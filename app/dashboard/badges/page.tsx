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
import { Plus, Trash2, Edit, Award, Star } from "lucide-react";
import { toast } from "sonner";
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface Badge {
  id: number;
  name: string;
  description: string;
  iconUrl?: string;
  requirement: string;
  points: number;
  rarity: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().min(1, "Description is required"),
  iconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  requirement: z.string().min(1, "Requirement code is required"),
  points: z.coerce.number().int().min(0, "Points cannot be negative"),
  rarity: z.enum(["commun", "rare", "épique", "légendaire"]),
  isActive: z.boolean().default(true),
});

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
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
      iconUrl: "",
      requirement: "",
      points: 50,
      rarity: "commun",
      isActive: true,
    },
  });

  const fetchBadges = async (page = 1) => {
    try {
      const response = await api.get(`/badges?page=${page}&limit=10`);
      setBadges(response.data.data || response.data);
      if (response.data.meta) {
        setPaginationMeta(response.data.meta);
      }
    } catch (error) {
      console.error("Failed to fetch badges", error);
      toast.error("Failed to fetch badges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingBadge(null);
      form.reset({
        name: "",
        description: "",
        iconUrl: "",
        requirement: "",
        points: 50,
        rarity: "commun",
        isActive: true,
      });
    }
  }, [open, form]);

  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    form.reset({
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl || "",
      requirement: badge.requirement,
      points: badge.points,
      rarity: badge.rarity as any,
      isActive: badge.isActive,
    });
    setOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convert empty string to undefined for optional iconUrl
      const payload = {
        ...values,
        iconUrl: values.iconUrl || undefined,
      };

      if (editingBadge) {
        await api.put(`/badges/${editingBadge.id}`, payload);
        toast.success("Badge updated successfully");
      } else {
        await api.post("/badges", payload);
        toast.success("Badge created successfully");
      }
      setOpen(false);
      fetchBadges();
    } catch (error) {
      console.error("Failed to save badge", error);
      toast.error(editingBadge ? "Failed to update badge" : "Failed to create badge");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;

    try {
      await api.delete(`/badges/${id}`);
      toast.success("Badge deleted successfully");
      fetchBadges();
    } catch (error) {
      console.error("Failed to delete badge", error);
      toast.error("Failed to delete badge");
    }
  };

  const handlePageChange = (page: number) => {
    fetchBadges(page);
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      commun: "bg-gray-100 text-gray-700",
      rare: "bg-blue-100 text-blue-700",
      épique: "bg-purple-100 text-purple-700",
      légendaire: "bg-yellow-100 text-yellow-700",
    };
    return colors[rarity] || "bg-gray-100 text-gray-700";
  };

  const getRarityIcon = (rarity: string) => {
    const icons: Record<string, number> = {
      commun: 1,
      rare: 2,
      épique: 3,
      légendaire: 4,
    };
    const count = icons[rarity] || 1;
    return Array(count).fill("⭐").join("");
  };

  if (loading) {
    return <div className="p-8">Loading badges...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-8 w-8 text-blue-600" />
            Badges Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage achievement badges for users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingBadge ? "Edit Badge" : "Add New Badge"}</DialogTitle>
              <DialogDescription>
                {editingBadge 
                  ? "Update the badge details." 
                  : "Create a new achievement badge that users can earn."}
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
                        <Input placeholder="e.g., Marathon Runner" {...field} />
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
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what users need to do to earn this badge..."
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
                  name="iconUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com/badge-icon.png" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requirement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirement Code *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., DISTANCE_42KM, VISIT_10_POI" 
                          {...field} 
                        />
                      </FormControl>
                      <div className="text-xs text-gray-500 mt-1">
                        Code used to identify when this badge should be awarded
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="50"
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
                    name="rarity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rarity *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rarity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="commun">⭐ Common</SelectItem>
                            <SelectItem value="rare">⭐⭐ Rare</SelectItem>
                            <SelectItem value="épique">⭐⭐⭐ Epic</SelectItem>
                            <SelectItem value="légendaire">⭐⭐⭐⭐ Legendary</SelectItem>
                          </SelectContent>
                        </Select>
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
                          Users can earn active badges
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
                    {editingBadge ? "Update Badge" : "Create Badge"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Badges ({badges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Requirement</TableHead>
                <TableHead>Rarity</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500"
                  >
                    No badges found. Create your first badge!
                  </TableCell>
                </TableRow>
              ) : (
                badges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell className="font-medium">{badge.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {badge.iconUrl ? (
                          <img 
                            src={badge.iconUrl} 
                            alt={badge.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Award className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{badge.name}</div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {badge.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {badge.requirement}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                        {getRarityIcon(badge.rarity)} {badge.rarity}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{badge.points}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          badge.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {badge.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(badge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(badge.id)}
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
          <DataTablePagination meta={paginationMeta} onPageChange={handlePageChange} />
        </CardContent>
      </Card>
    </div>
  );
}
