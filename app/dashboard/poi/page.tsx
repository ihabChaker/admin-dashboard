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
import { Plus, Trash2, Edit, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface POI {
  id: number;
  name: string;
  description: string;
  poiType: string;
  latitude: number;
  longitude: number;
  parcoursId: number;
  orderInParcours: number;
}

interface Parcours {
  id: number;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  poiType: z.enum(['bunker', 'blockhaus', 'memorial', 'museum', 'beach', 'monument']),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  parcoursId: z.coerce.number().positive('Parcours is required'),
  orderInParcours: z.coerce.number().int().positive(),
  historicalPeriod: z.string().optional(),
});

export default function POIPage() {
  const [pois, setPois] = useState<POI[]>([]);
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPOI, setEditingPOI] = useState<POI | null>(null);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      poiType: 'monument',
      latitude: 0,
      longitude: 0,
      parcoursId: 0,
      orderInParcours: 1,
      historicalPeriod: '',
    },
  });

  const fetchData = async (page = 1, limit = paginationMeta.limit) => {
    try {
      const [poisRes, parcoursRes] = await Promise.all([
        api.get(`/poi?page=${page}&limit=${limit}`),
        api.get('/parcours'),
      ]);
      setPois(poisRes.data.data || poisRes.data);
      if (poisRes.data.meta) {
        setPaginationMeta(poisRes.data.meta);
      }
      setParcoursList(parcoursRes.data.data || parcoursRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10);
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingPOI(null);
      form.reset({
        name: '',
        description: '',
        poiType: 'monument',
        latitude: 0,
        longitude: 0,
        parcoursId: 0,
        orderInParcours: 1,
        historicalPeriod: '',
      });
    }
  }, [open, form]);

  const handleEdit = (poi: POI) => {
    setEditingPOI(poi);
    form.reset({
      name: poi.name,
      description: poi.description,
      poiType: poi.poiType as any,
      latitude: poi.latitude,
      longitude: poi.longitude,
      parcoursId: poi.parcoursId,
      orderInParcours: poi.orderInParcours,
      historicalPeriod: '', // Assuming this might be missing or needs fetching
    });
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingPOI) {
        await api.put(`/poi/${editingPOI.id}`, values);
        toast.success('POI updated successfully');
      } else {
        await api.post('/poi', values);
        toast.success('POI created successfully');
      }
      setOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save POI', error);
      toast.error(editingPOI ? 'Failed to update POI' : 'Failed to create POI');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this POI?')) return;
    
    try {
      await api.delete(`/poi/${id}`);
      toast.success('POI deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete POI', error);
      toast.error('Failed to delete POI');
    }
  };

  const handlePageChange = (page: number) => {
    fetchData(page, paginationMeta.limit);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPaginationMeta({ ...paginationMeta, limit: pageSize, page: 1 });
    fetchData(1, pageSize);
  };

  if (loading) {
    return <div className="p-8">Loading points of interest...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Points of Interest</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add POI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPOI ? 'Edit Point of Interest' : 'Add New Point of Interest'}</DialogTitle>
              <DialogDescription>
                {editingPOI ? 'Update the details of the point of interest.' : 'Add a historical location to a parcours.'}
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
                        <Input placeholder="POI name" {...field} />
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
                    name="poiType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="bunker">Bunker</SelectItem>
                            <SelectItem value="blockhaus">Blockhaus</SelectItem>
                            <SelectItem value="memorial">Memorial</SelectItem>
                            <SelectItem value="museum">Museum</SelectItem>
                            <SelectItem value="beach">Beach</SelectItem>
                            <SelectItem value="monument">Monument</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="historicalPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1944" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="latitude"
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
                    name="longitude"
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="parcoursId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parcours</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select parcours" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {parcoursList.map((p) => (
                              <SelectItem key={p.id} value={p.id.toString()}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orderInParcours"
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
                </div>
                <DialogFooter>
                  <Button type="submit">{editingPOI ? 'Update POI' : 'Create POI'}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Points of Interest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((paginationMeta.page - 1) * paginationMeta.limit + 1, paginationMeta.total)} to{' '}
              {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} results
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={paginationMeta.limit.toString()}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parcours</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pois.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No points of interest found.
                  </TableCell>
                </TableRow>
              ) : (
                pois.map((poi) => (
                  <TableRow key={poi.id}>
                    <TableCell className="font-medium">{poi.id}</TableCell>
                    <TableCell className="font-medium">{poi.name}</TableCell>
                    <TableCell className="capitalize">{poi.poiType}</TableCell>
                    <TableCell>
                      {parcoursList.find(p => p.id === poi.parcoursId)?.name || poi.parcoursId}
                    </TableCell>
                    <TableCell>{poi.orderInParcours}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(poi)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(poi.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-center pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => paginationMeta.hasPreviousPage && handlePageChange(paginationMeta.page - 1)}
                    className={!paginationMeta.hasPreviousPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: paginationMeta.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={pageNum === paginationMeta.page}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => paginationMeta.hasNextPage && handlePageChange(paginationMeta.page + 1)}
                    className={!paginationMeta.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
