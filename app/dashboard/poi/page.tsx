"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Plus, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ServerDataTable } from "@/components/server-data-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { PointOfInterest } from "@/lib/types";

interface POI extends PointOfInterest {
  parcours?: {
    name: string;
  };
}

export default function POIPage() {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchPOIs = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/poi?page=${page}&limit=${limit}`);
      setPois(response.data.data);
      setPaginationMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch POIs", error);
      toast.error("Failed to fetch POIs");
      setPois([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOIs(1, 10);
  }, []);

  const handlePageChange = (page: number) => {
    fetchPOIs(page, paginationMeta.limit);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchPOIs(1, pageSize);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this POI?")) return;

    try {
      await api.delete(`/poi/${id}`);
      toast.success("POI deleted successfully");
      fetchPOIs(paginationMeta.page, paginationMeta.limit);
    } catch (error) {
      console.error("Failed to delete POI", error);
      toast.error("Failed to delete POI");
    }
  };

  const columns: ColumnDef<POI>[] = [
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
      cell: ({ row }) => {
        const poi = row.original;
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="font-medium">{poi.name}</span>
              <span className="text-xs text-muted-foreground">
                {Number(poi.latitude).toFixed(4)},{" "}
                {Number(poi.longitude).toFixed(4)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "poiType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("poiType") as string;
        return (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "parcoursId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parcours ID" />
      ),
    },
    {
      accessorKey: "orderInParcours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => {
        return `#${row.getValue("orderInParcours")}`;
      },
    },
    {
      accessorKey: "qrCode",
      header: "QR Code",
      cell: ({ row }) => {
        const qrCode = row.original.qrCode;
        return qrCode ? (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <QrCode className="h-3 w-3 mr-1" />
            Generated
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-gray-100 text-gray-600">
            None
          </Badge>
        );
      },
    },
    {
      accessorKey: "quiz",
      header: "Quiz",
      cell: ({ row }) => {
        const quiz = row.original.quiz;
        return quiz ? (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            {quiz.title}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        );
      },
    },
    {
      accessorKey: "podcast",
      header: "Podcast",
      cell: ({ row }) => {
        const podcast = row.original.podcast;
        return podcast ? (
          <Badge
            variant="outline"
            className="bg-orange-50 text-orange-700 border-orange-200"
          >
            {podcast.title}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const poi = row.original;
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
                handleDelete(poi.id);
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
        <h1 className="text-3xl font-bold text-gray-900">Points of Interest</h1>
        <Button onClick={() => toast.info("Add POI functionality coming soon")}>
          <Plus className="mr-2 h-4 w-4" /> Add POI
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Points of Interest</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={pois}
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
