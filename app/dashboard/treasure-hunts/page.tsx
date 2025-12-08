"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Edit, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { TreasureHunt as TreasureHuntType, TreasureItem } from "@/lib/types";

interface TreasureHunt extends TreasureHuntType {
  parcours?: {
    name: string;
  };
}

interface Parcours {
  id: number;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  parcoursId: z.coerce.number().positive("Parcours is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  scanRadiusMeters: z.coerce.number().int().positive().default(50),
});

export default function TreasureHuntPage() {
  const router = useRouter();
  const [treasures, setTreasures] = useState<TreasureHunt[]>([]);
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTreasure, setEditingTreasure] = useState<TreasureHunt | null>(
    null
  );
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
      name: "",
      description: "",
      isActive: true,
      parcoursId: 0,
      latitude: 0,
      longitude: 0,
      scanRadiusMeters: 50,
    },
  });

  const fetchData = async (page = 1, limit = paginationMeta.limit) => {
    try {
      const [treasuresRes, parcoursRes] = await Promise.all([
        api.get(`/treasure-hunts?page=${page}&limit=${limit}`),
        api.get("/parcours"),
      ]);
      setTreasures(treasuresRes.data.data || treasuresRes.data);
      if (treasuresRes.data.meta) {
        setPaginationMeta(treasuresRes.data.meta);
      }
      setParcoursList(parcoursRes.data.data || parcoursRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10);
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingTreasure(null);
      form.reset({
        name: "",
        description: "",
        isActive: true,
        parcoursId: 0,
        latitude: 0,
        longitude: 0,
        scanRadiusMeters: 50,
      });
    }
  }, [open, form]);

  const handleEdit = (t: TreasureHunt) => {
    setEditingTreasure(t);
    form.reset({
      name: t.name,
      description: t.description,
      isActive: t.isActive,
      parcoursId: t.parcoursId,
      latitude: t.latitude,
      longitude: t.longitude,
      scanRadiusMeters: t.scanRadiusMeters,
    });
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (editingTreasure) {
        await api.put(`/treasure-hunts/${editingTreasure.id}`, values);
        toast.success("Treasure hunt updated successfully");
      } else {
        await api.post("/treasure-hunts", values);
        toast.success("Treasure hunt created successfully");
      }
      setOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save treasure hunt", error);
      toast.error(
        editingTreasure
          ? "Failed to update treasure hunt"
          : "Failed to create treasure hunt"
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this treasure hunt?")) return;

    try {
      await api.delete(`/treasure-hunts/${id}`);
      toast.success("Treasure hunt deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to delete treasure hunt", error);
      toast.error("Failed to delete treasure hunt");
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
    return <div className="p-8">Loading treasure hunts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Treasure Hunt Management
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Treasure
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTreasure
                  ? "Edit Treasure Hunt"
                  : "Add New Treasure Hunt"}
              </DialogTitle>
              <DialogDescription>
                {editingTreasure
                  ? "Update the treasure hunt details."
                  : "Create a hidden treasure for users to find."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value as number}
                          />
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
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value as number}
                          />
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
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          defaultValue={
                            field.value ? field.value.toString() : undefined
                          }
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
                    name="scanRadiusMeters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scan Radius (m)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value as number}
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
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {editingTreasure ? "Update Treasure" : "Create Treasure"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Treasure Hunts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min(
                (paginationMeta.page - 1) * paginationMeta.limit + 1,
                paginationMeta.total
              )}{" "}
              to{" "}
              {Math.min(
                paginationMeta.page * paginationMeta.limit,
                paginationMeta.total
              )}{" "}
              of {paginationMeta.total} results
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Rows per page:
              </span>
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
                <TableHead>Target</TableHead>
                <TableHead>Parcours</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treasures.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No treasure hunts found.
                  </TableCell>
                </TableRow>
              ) : (
                treasures.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.id}</TableCell>
                    <TableCell className="font-medium">{t.name}</TableCell>

                    <TableCell>
                      {parcoursList.find((p) => p.id === t.parcoursId)?.name ||
                        t.parcoursId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {t.items?.length || 0} items
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {t.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-400">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/dashboard/treasure-hunts/${t.id}`)
                          }
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(t)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(t.id)}
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
          <div className="flex items-center justify-center pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      paginationMeta.hasPreviousPage &&
                      handlePageChange(paginationMeta.page - 1)
                    }
                    className={
                      !paginationMeta.hasPreviousPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
                {Array.from(
                  { length: paginationMeta.totalPages },
                  (_, i) => i + 1
                ).map((pageNum) => (
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
                    onClick={() =>
                      paginationMeta.hasNextPage &&
                      handlePageChange(paginationMeta.page + 1)
                    }
                    className={
                      !paginationMeta.hasNextPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
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
