"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ServerDataTable } from "@/components/server-data-table";
import { DataTableColumnHeader } from "@/components/data-table";

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

export default function ParcoursPage() {
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchParcours = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/parcours?page=${page}&limit=${limit}`);
      setParcours(response.data.data);
      setPaginationMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch parcours", error);
      toast.error("Failed to fetch parcours");
      setParcours([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcours(1, 10);
  }, []);

  const handlePageChange = (page: number) => {
    fetchParcours(page, paginationMeta.limit);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchParcours(1, pageSize);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this parcours?")) return;

    try {
      await api.delete(`/parcours/${id}`);
      toast.success("Parcours deleted successfully");
      fetchParcours(paginationMeta.page, paginationMeta.limit);
    } catch (error) {
      console.error("Failed to delete parcours", error);
      toast.error("Failed to delete parcours");
    }
  };

  const columns: ColumnDef<Parcours>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div className="font-medium w-[60px]">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "historicalTheme",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Theme" />
      ),
    },
    {
      accessorKey: "difficultyLevel",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Difficulty" />
      ),
      cell: ({ row }) => {
        const level = row.getValue("difficultyLevel") as string;
        return (
          <Badge
            variant={
              level === "easy"
                ? "default"
                : level === "medium"
                ? "secondary"
                : "destructive"
            }
            className={
              level === "easy"
                ? "bg-green-100 text-green-700"
                : level === "medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }
          >
            {level}
          </Badge>
        );
      },
    },
    {
      accessorKey: "distanceKm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Distance (km)" />
      ),
      cell: ({ row }) => {
        return `${row.getValue("distanceKm")} km`;
      },
    },
    {
      accessorKey: "estimatedDuration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration (min)" />
      ),
      cell: ({ row }) => {
        return `${row.getValue("estimatedDuration")} min`;
      },
    },
    {
      accessorKey: "isPmrAccessible",
      header: "PMR",
      cell: ({ row }) => {
        const accessible = row.getValue("isPmrAccessible") as boolean;
        return accessible ? (
          <span className="text-green-600 font-medium">Yes</span>
        ) : (
          <span className="text-gray-400">No</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const parcours = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                toast.info("Edit functionality coming soon");
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
                handleDelete(parcours.id);
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
        <h1 className="text-3xl font-bold text-gray-900">
          Parcours Management
        </h1>
        <Button
          onClick={() => toast.info("Add parcours functionality coming soon")}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Parcours
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Parcours</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={parcours}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            searchKey="name"
            searchPlaceholder="Search by name..."
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
