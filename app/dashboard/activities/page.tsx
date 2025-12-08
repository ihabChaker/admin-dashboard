"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Calendar, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ServerDataTable } from "@/components/server-data-table";
import { DataTableColumnHeader } from "@/components/data-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface UserActivity {
  id: number;
  userId: number;
  parcoursId: number;
  activityType: string;
  startDatetime: string;
  endDatetime?: string;
  status: string;
  distanceCoveredKm: number;
  durationMinutes?: number;
  averageSpeed?: number;
  pointsEarned: number;
  createdAt: string;
  user?: {
    username: string;
    email: string;
  };
  parcours?: {
    name: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    totalDistance: 0,
    totalPoints: 0,
  });

  const fetchActivities = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/user-activities`, {
        params: { page, limit: 20 },
      });

      if (response.data.data) {
        setActivities(response.data.data);
        setPaginationMeta(response.data.meta);
      } else {
        setActivities(response.data);
      }

      // Fetch stats
      const statsData = activities.reduce(
        (acc, activity) => ({
          total: acc.total + 1,
          completed: acc.completed + (activity.status === "completed" ? 1 : 0),
          inProgress:
            acc.inProgress + (activity.status === "in_progress" ? 1 : 0),
          totalDistance: acc.totalDistance + activity.distanceCoveredKm,
          totalPoints: acc.totalPoints + activity.pointsEarned,
        }),
        {
          total: 0,
          completed: 0,
          inProgress: 0,
          totalDistance: 0,
          totalPoints: 0,
        }
      );

      setStats(statsData);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handlePageChange = (page: number) => {
    fetchActivities(page);
  };

  const columns: ColumnDef<UserActivity>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
    },
    {
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">
              {row.original.user?.username || `User #${row.original.userId}`}
            </div>
            <div className="text-xs text-gray-500">
              {row.original.user?.email || "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "parcours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parcours" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>
            {row.original.parcours?.name ||
              `Parcours #${row.original.parcoursId}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "activityType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue("activityType")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant={
              status === "completed"
                ? "default"
                : status === "in_progress"
                ? "secondary"
                : "outline"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "distanceCoveredKm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Distance (km)" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {Number(row.getValue<number>("distanceCoveredKm")).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "durationMinutes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const duration = row.getValue("durationMinutes") as number | undefined;
        return duration ? `${duration} min` : "-";
      },
    },
    {
      accessorKey: "pointsEarned",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Points" />
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          +{row.getValue("pointsEarned")}
        </span>
      ),
    },
    {
      accessorKey: "startDatetime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          {new Date(row.getValue("startDatetime")).toLocaleDateString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Activities</h1>
          <p className="text-gray-600 mt-1">
            Monitor user parcours activities and completions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inProgress}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Distance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(stats.totalDistance).toFixed(1)} km
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.totalPoints}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={activities}
            loading={loading}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setPaginationMeta((prev) => ({ ...prev, limit: pageSize }));
              fetchActivities(1);
            }}
          />

          {/* Pagination */}
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
