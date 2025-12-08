"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Activity } from "lucide-react";
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

interface ParcoursSession {
  id: number;
  userId: number;
  parcoursId: number;
  status: string;
  startLat: number;
  startLon: number;
  currentLat?: number;
  currentLon?: number;
  distanceCoveredKm: number;
  durationMinutes: number;
  pointsEarned: number;
  startTime: string;
  endTime?: string;
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

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ParcoursSession[]>([]);
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
    active: 0,
    completed: 0,
    paused: 0,
    totalDistance: 0,
  });

  const fetchSessions = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/parcours-sessions`, {
        params: { page, limit: 20 },
      });

      if (response.data.data) {
        setSessions(response.data.data);
        setPaginationMeta(response.data.meta);
      } else {
        setSessions(response.data);
      }

      // Calculate stats
      const statsData = sessions.reduce(
        (acc, session) => ({
          active: acc.active + (session.status === "active" ? 1 : 0),
          completed: acc.completed + (session.status === "completed" ? 1 : 0),
          paused: acc.paused + (session.status === "paused" ? 1 : 0),
          totalDistance: acc.totalDistance + session.distanceCoveredKm,
        }),
        { active: 0, completed: 0, paused: 0, totalDistance: 0 }
      );

      setStats(statsData);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handlePageChange = (page: number) => {
    fetchSessions(page);
  };

  const columns: ColumnDef<ParcoursSession>[] = [
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
                : status === "active"
                ? "secondary"
                : status === "paused"
                ? "outline"
                : "outline"
            }
          >
            <Activity className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "distanceCoveredKm",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Distance" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {Number(row.getValue<number>("distanceCoveredKm")).toFixed(2)} km
        </span>
      ),
    },
    {
      accessorKey: "durationMinutes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const duration = row.getValue("durationMinutes") as number;
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
      accessorKey: "startTime",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="h-3 w-3 text-gray-400" />
          {new Date(row.getValue("startTime")).toLocaleString()}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Parcours Sessions
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time tracking of active and completed sessions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Paused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.paused}
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
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={sessions}
            loading={loading}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
            onPageSizeChange={(pageSize) => {
              setPaginationMeta((prev) => ({ ...prev, limit: pageSize }));
              fetchSessions(1);
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
