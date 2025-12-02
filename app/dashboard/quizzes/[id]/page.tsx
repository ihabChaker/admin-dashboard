'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2, Check, X, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Answer {
  id: number;
  answerText: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  questionText: string;
  correctAnswer: string;
  questionOrder: number;
  points: number;
  answers: Answer[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  pointsReward: number;
  isActive: boolean;
  questions: Question[];
}

const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  correctAnswer: z.string().min(1, 'Correct answer text is required'), // This seems redundant if we have answers array, but the backend DTO has it.
  questionOrder: z.coerce.number().int().positive(),
  points: z.coerce.number().int().positive(),
});

const answerSchema = z.object({
  answerText: z.string().min(1, 'Answer text is required'),
  isCorrect: z.boolean().default(false),
});

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [answerOpen, setAnswerOpen] = useState<{ [key: number]: boolean }>({});
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);

  const questionForm = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: '',
      correctAnswer: '',
      questionOrder: 1,
      points: 10,
    },
  });

  // We need a separate form instance for each answer dialog or manage state carefully.
  // For simplicity, let's use one form and reset it.
  const answerForm = useForm({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answerText: '',
      isCorrect: false,
    },
  });
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${params.id}`);
      setQuiz(response.data);
    } catch (error) {
      console.error('Failed to fetch quiz', error);
      toast.error('Failed to fetch quiz details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchQuiz();
    }
  }, [params.id]);

  useEffect(() => {
    if (!questionOpen) {
      setEditingQuestion(null);
      questionForm.reset({
        questionText: '',
        correctAnswer: '',
        questionOrder: 1,
        points: 10,
      });
    }
  }, [questionOpen, questionForm]);

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    questionForm.reset({
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      questionOrder: question.questionOrder,
      points: question.points,
    });
    setQuestionOpen(true);
  };

  const onQuestionSubmit = async (values: z.infer<typeof questionSchema>) => {
    try {
      if (editingQuestion) {
        await api.put(`/quizzes/questions/${editingQuestion.id}`, values);
        toast.success('Question updated successfully');
      } else {
        await api.post(`/quizzes/${params.id}/questions`, values);
        toast.success('Question added successfully');
      }
      setQuestionOpen(false);
      fetchQuiz();
    } catch (error) {
      console.error('Failed to save question', error);
      toast.error(editingQuestion ? 'Failed to update question' : 'Failed to add question');
    }
  };

  const onDeleteQuestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/quizzes/questions/${id}`);
      toast.success('Question deleted successfully');
      fetchQuiz();
    } catch (error) {
      console.error('Failed to delete question', error);
      toast.error('Failed to delete question');
    }
  };

  const handleEditAnswer = (answer: Answer, questionId: number) => {
    setEditingAnswer(answer);
    setCurrentQuestionId(questionId);
    answerForm.reset({
      answerText: answer.answerText,
      isCorrect: answer.isCorrect,
    });
    setAnswerOpen({ ...answerOpen, [questionId]: true });
  };

  const onAnswerSubmit = async (values: z.infer<typeof answerSchema>) => {
    if (!currentQuestionId) return;
    try {
      if (editingAnswer) {
        await api.put(`/quizzes/answers/${editingAnswer.id}`, values);
        toast.success('Answer updated successfully');
      } else {
        await api.post(`/quizzes/questions/${currentQuestionId}/answers`, values);
        toast.success('Answer added successfully');
      }
      setAnswerOpen({ ...answerOpen, [currentQuestionId]: false });
      setEditingAnswer(null);
      fetchQuiz();
    } catch (error) {
      console.error('Failed to save answer', error);
      toast.error(editingAnswer ? 'Failed to update answer' : 'Failed to add answer');
    }
  };

  const onDeleteAnswer = async (id: number) => {
    if (!confirm('Are you sure you want to delete this answer?')) return;
    try {
      await api.delete(`/quizzes/answers/${id}`);
      toast.success('Answer deleted successfully');
      fetchQuiz();
    } catch (error) {
      console.error('Failed to delete answer', error);
      toast.error('Failed to delete answer');
    }
  };

  const openAnswerDialog = (questionId: number) => {
    setCurrentQuestionId(questionId);
    setAnswerOpen({ ...answerOpen, [questionId]: true });
    answerForm.reset();
  };

  if (loading) return <div className="p-8">Loading quiz details...</div>;
  if (!quiz) return <div className="p-8">Quiz not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/quizzes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="text-gray-500">{quiz.description}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={quiz.isActive ? 'default' : 'secondary'}>
            {quiz.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{quiz.difficulty}</Badge>
          <Badge variant="outline">{quiz.pointsReward} pts</Badge>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Questions ({quiz.questions.length})</h2>
        <Dialog open={questionOpen} onOpenChange={setQuestionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
            </DialogHeader>
            <Form {...questionForm}>
              <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                <FormField
                  control={questionForm.control}
                  name="questionText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. When was D-Day?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="correctAnswer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correct Answer (Text)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. June 6, 1944" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={questionForm.control}
                    name="questionOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={questionForm.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{editingQuestion ? 'Update Question' : 'Add Question'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {quiz.questions.map((question) => (
          <Card key={question.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-medium">
                    {question.questionOrder}. {question.questionText}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Points: {question.points} | Correct Answer: <span className="font-medium">{question.correctAnswer}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(question)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDeleteQuestion(question.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Answers</h4>
                  <Dialog 
                    open={answerOpen[question.id] || false} 
                    onOpenChange={(open) => {
                      setAnswerOpen({ ...answerOpen, [question.id]: open });
                      if (open) {
                        setCurrentQuestionId(question.id);
                        answerForm.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openAnswerDialog(question.id)}>
                        <Plus className="mr-2 h-3 w-3" /> Add Answer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingAnswer ? 'Edit Answer Option' : 'Add Answer Option'}</DialogTitle>
                      </DialogHeader>
                      <Form {...answerForm}>
                        <form onSubmit={answerForm.handleSubmit(onAnswerSubmit)} className="space-y-4">
                          <FormField
                            control={answerForm.control}
                            name="answerText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Answer Text</FormLabel>
                                <FormControl>
                                  <Input placeholder="Option text" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={answerForm.control}
                            name="isCorrect"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Is Correct Answer?
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit">{editingAnswer ? 'Update Answer' : 'Add Answer'}</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-2">
                  {question.answers && question.answers.length > 0 ? (
                    question.answers.map((answer) => (
                      <div key={answer.id} className={`flex items-center justify-between p-2 rounded-md border ${answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          {answer.isCorrect ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                          <span className={answer.isCorrect ? 'text-green-900 font-medium' : 'text-gray-700'}>
                            {answer.answerText}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-500" onClick={() => handleEditAnswer(answer, question.id)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => onDeleteAnswer(answer.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">No answers added yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
