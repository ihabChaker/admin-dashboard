'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface Parcours {
  id: number;
  name: string;
  description: string;
  difficultyLevel: string;
  distanceKm: number;
  estimatedDuration: number;
  isPmrAccessible: boolean;
  historicalTheme: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']),
  distanceKm: z.coerce.number().positive('Distance must be positive'),
  estimatedDuration: z.coerce.number().int().positive('Duration must be positive'),
  isPmrAccessible: z.boolean().default(false),
  historicalTheme: z.string().optional(),
  startingPointLat: z.coerce.number().min(-90).max(90),
  startingPointLon: z.coerce.number().min(-180).max(180),
});

export default function ParcoursPage() {
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingParcours, setEditingParcours] = useState<Parcours | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      difficultyLevel: 'medium',
      distanceKm: 0,
      estimatedDuration: 0,
      isPmrAccessible: false,
      historicalTheme: '',
      startingPointLat: 0,
      startingPointLon: 0,
    },
  });

  const fetchParcours = async () => {
    try {
      const response = await api.get('/parcours');
      setParcours(response.data);
    } catch (error) {
      console.error('Failed to fetch parcours', error);
      toast.error('Failed to fetch parcours');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcours();
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingParcours(null);
      form.reset({
        name: '',
        description: '',
        difficultyLevel: 'medium',
        distanceKm: 0,
        estimatedDuration: 0,
        isPmrAccessible: false,
        historicalTheme: '',
        startingPointLat: 0,
        startingPointLon: 0,
      });
    }
  }, [open, form]);

  const handleEdit = (p: Parcours) => {
    setEditingParcours(p);
    form.reset({
      name: p.name,
      description: p.description,
      difficultyLevel: p.difficultyLevel as any,
      distanceKm: p.distanceKm,
      estimatedDuration: p.estimatedDuration,
      isPmrAccessible: p.isPmrAccessible,
      historicalTheme: p.historicalTheme,
      // Assuming the API returns these fields, if not we might need to fetch details or handle defaults
      startingPointLat: 0, 
      startingPointLon: 0,
    });
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingParcours) {
        await api.put(`/parcours/${editingParcours.id}`, values);
        toast.success('Parcours updated successfully');
      } else {
        await api.post('/parcours', values);
        toast.success('Parcours created successfully');
      }
      setOpen(false);
      fetchParcours();
    } catch (error) {
      console.error('Failed to save parcours', error);
      toast.error(editingParcours ? 'Failed to update parcours' : 'Failed to create parcours');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this parcours?')) return;
    
    try {
      await api.delete(`/parcours/${id}`);
      toast.success('Parcours deleted successfully');
      fetchParcours();
    } catch (error) {
      console.error('Failed to delete parcours', error);
      toast.error('Failed to delete parcours');
    }
  };

  if (loading) {
    return <div className="p-8">Loading parcours...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Parcours Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Parcours
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingParcours ? 'Edit Parcours' : 'Add New Parcours'}</DialogTitle>
              <DialogDescription>
                {editingParcours ? 'Update the details of the hiking route.' : 'Create a new hiking route with historical details.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Parcours name" {...field} />
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
                        <Input placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="difficultyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="historicalTheme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. WWII" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="distanceKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (km)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (min)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startingPointLat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startingPointLon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input type="number" step="any" {...field} value={field.value as number} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isPmrAccessible"
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
                          PMR Accessible
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">{editingParcours ? 'Update Parcours' : 'Create Parcours'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Parcours</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Distance (km)</TableHead>
                <TableHead>Duration (min)</TableHead>
                <TableHead>PMR</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcours.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No parcours found.
                  </TableCell>
                </TableRow>
              ) : (
                parcours.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.historicalTheme}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.difficultyLevel === 'easy' ? 'bg-green-100 text-green-700' :
                        p.difficultyLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.difficultyLevel}
                      </span>
                    </TableCell>
                    <TableCell>{p.distanceKm}</TableCell>
                    <TableCell>{p.estimatedDuration}</TableCell>
                    <TableCell>
                      {p.isPmrAccessible ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(p.id)}>
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
