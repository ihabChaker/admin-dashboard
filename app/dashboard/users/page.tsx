"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ServerDataTable } from "@/components/server-data-table";
import { DataTableColumnHeader } from "@/components/data-table";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  totalPoints: number;
  registrationDate: string;
}

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["user", "admin"]),
});

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
      username: "",
      email: "",
      role: "user" as "user" | "admin",
    },
  });

  const fetchUsers = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/users?page=${page}&limit=${limit}`);

      if (response.data.meta && response.data.data) {
        setUsers(response.data.data);
        setPaginationMeta(response.data.meta);
      } else if (Array.isArray(response.data)) {
        setUsers(response.data);
        setPaginationMeta({
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, 10);
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingUser(null);
      form.reset();
    }
  }, [open, form]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      email: user.email,
      role: user.role as "user" | "admin",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
      fetchUsers(paginationMeta.page, paginationMeta.limit);
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to delete user");
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, paginationMeta.limit);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchUsers(1, pageSize);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!editingUser) return;

    try {
      await api.put(`/users/${editingUser.id}`, values);
      toast.success("User updated successfully");
      setOpen(false);
      fetchUsers(paginationMeta.page, paginationMeta.limit);
    } catch (error) {
      console.error("Failed to update user", error);
      toast.error("Failed to update user");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "username",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{user.username}</span>
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totalPoints",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Points" />
      ),
    },
    {
      accessorKey: "registrationDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => {
        return new Date(row.getValue("registrationDate")).toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/users/${user.id}`);
              }}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(user);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(user.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={users}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            searchKey="username"
            searchPlaceholder="Search by username..."
            loading={loading}
            onRowClick={(user) => router.push(`/dashboard/users/${user.id}`)}
          />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and role.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
