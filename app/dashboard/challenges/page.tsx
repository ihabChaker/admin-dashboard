"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: number;
  name: string;
  description: string;
  challengeType: string;
  pointsReward: number;
  difficultyMultiplier: number;
  isActive: boolean;
  createdAt: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().optional(),
  challengeType: z.enum(["weighted_backpack", "period_clothing", "distance", "time"]),
  pointsReward: z.coerce.number().int().min(1, "Points must be positive"),
  difficultyMultiplier: z.coerce.number().min(0.1).max(10),
  isActive: z.boolean().default(true),
});

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      challengeType: "distance",
      pointsReward: 100,
      difficultyMultiplier: 1.0,
      isActive: true,
    },
  });

  const fetchChallenges = async () => {
    try {
      const response = await api.get("/challenges");
      setChallenges(response.data);
    } catch (error) {
      console.error("Failed to fetch challenges", error);
      toast.error("Failed to fetch challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingChallenge(null);
      form.reset({
        name: "",
        description: "",
        challengeType: "distance",
        pointsReward: 100,
        difficultyMultiplier: 1.0,
        isActive: true,
      });
    }
  }, [open, form]);

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    form.reset({
      name: challenge.name,
      description: challenge.description || "",
      challengeType: challenge.challengeType as any,
      pointsReward: challenge.pointsReward,
      difficultyMultiplier: challenge.difficultyMultiplier,
      isActive: challenge.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingChallenge) {
        await api.put(`/challenges/${editingChallenge.id}`, values);
        toast.success("Challenge updated successfully");
      } else {
        await api.post("/challenges", values);
        toast.success("Challenge created successfully");
      }
      setOpen(false);
      fetchChallenges();
    } catch (error) {
      console.error("Failed to save challenge", error);
      toast.error(editingChallenge ? "Failed to update challenge" : "Failed to create challenge");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this challenge?")) return;

    try {
      await api.delete(`/challenges/${id}`);
      toast.success("Challenge deleted successfully");
      fetchChallenges();
    } catch (error) {
      console.error("Failed to delete challenge", error);
      toast.error("Failed to delete challenge");
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      weighted_backpack: "Weighted Backpack",
      period_clothing: "Period Clothing",
      distance: "Distance",
      time: "Time",
    };
    return labels[type] || type;
  };

  const getChallengeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      weighted_backpack: "bg-orange-100 text-orange-700",
      period_clothing: "bg-purple-100 text-purple-700",
      distance: "bg-blue-100 text-blue-700",
      time: "bg-green-100 text-green-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return <div className="p-8">Loading challenges...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-600" />
            Challenges Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage physical challenges for users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Challenge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingChallenge ? "Edit Challenge" : "Add New Challenge"}</DialogTitle>
              <DialogDescription>
                {editingChallenge 
                  ? "Update the challenge details." 
                  : "Create a new physical challenge for users to complete during their activities."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10km March with weighted backpack" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the challenge requirements..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="challengeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challenge Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select challenge type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weighted_backpack">Weighted Backpack</SelectItem>
                          <SelectItem value="period_clothing">Period Clothing</SelectItem>
                          <SelectItem value="distance">Distance Goal</SelectItem>
                          <SelectItem value="time">Time Goal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pointsReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points Reward *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="100"
                            {...field}
                            value={field.value as number}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="difficultyMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty (1.0-10.0)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="3"
                            placeholder="1.0"
                            {...field}
                            value={field.value as number}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-gray-500">
                          Users can see and start active challenges
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {editingChallenge ? "Update Challenge" : "Create Challenge"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Challenges ({challenges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No challenges found. Create your first challenge!
                  </TableCell>
                </TableRow>
              ) : (
                challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">{challenge.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{challenge.name}</div>
                      {challenge.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {challenge.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChallengeTypeColor(challenge.challengeType)}`}>
                        {getChallengeTypeLabel(challenge.challengeType)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{challenge.pointsReward}</TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {challenge.difficultyMultiplier.toFixed(1)}x
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          challenge.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {challenge.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(challenge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(challenge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
