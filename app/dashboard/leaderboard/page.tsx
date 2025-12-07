"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, TrendingUp, User } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ServerDataTable } from "@/components/server-data-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  totalPoints: number;
  parcoursCompleted: number;
  badgesEarned: number;
  profileImageUrl?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function LeaderboardPage() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<
    LeaderboardEntry[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("global");
  const [globalPagination, setGlobalPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [weeklyPagination, setWeeklyPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchGlobalLeaderboard = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard/global`, {
        params: { page, limit: 50 },
      });

      if (response.data.data) {
        setGlobalLeaderboard(response.data.data);
        setGlobalPagination(response.data.meta);
      } else {
        setGlobalLeaderboard(response.data);
      }
    } catch (error) {
      console.error("Error fetching global leaderboard:", error);
      toast.error("Failed to load global leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyLeaderboard = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/leaderboard/weekly`, {
        params: { page, limit: 50 },
      });

      if (response.data.data) {
        setWeeklyLeaderboard(response.data.data);
        setWeeklyPagination(response.data.meta);
      } else {
        setWeeklyLeaderboard(response.data);
      }
    } catch (error) {
      console.error("Error fetching weekly leaderboard:", error);
      toast.error("Failed to load weekly leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLeaderboard();
    fetchWeeklyLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="font-bold text-gray-600">#{rank}</span>;
  };

  const columns: ColumnDef<LeaderboardEntry>[] = [
    {
      accessorKey: "rank",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Rank" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          {getRankIcon(row.getValue("rank"))}
        </div>
      ),
    },
    {
      accessorKey: "username",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.getValue("username")}</span>
        </div>
      ),
    },
    {
      accessorKey: "totalPoints",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Points" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="font-bold text-green-600">
            {row.getValue<number>("totalPoints").toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "parcoursCompleted",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parcours" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.getValue("parcoursCompleted")} completed
        </Badge>
      ),
    },
    {
      accessorKey: "badgesEarned",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Badges" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline">
          <Award className="h-3 w-3 mr-1" />
          {row.getValue("badgesEarned")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="text-gray-600 mt-1">
            Top performing users and weekly rankings
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {globalLeaderboard.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top 3 Champions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-end gap-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <Medal className="h-12 w-12 text-gray-400 mb-2" />
                <div className="bg-gray-100 rounded-lg p-4 text-center w-32">
                  <div className="text-2xl font-bold text-gray-700">2nd</div>
                  <div className="font-medium mt-1">
                    {globalLeaderboard[1]?.username}
                  </div>
                  <div className="text-sm text-gray-600">
                    {globalLeaderboard[1]?.totalPoints.toLocaleString()} pts
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-4">
                <Trophy className="h-16 w-16 text-yellow-500 mb-2" />
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center w-32">
                  <div className="text-3xl font-bold text-yellow-600">1st</div>
                  <div className="font-medium mt-1">
                    {globalLeaderboard[0]?.username}
                  </div>
                  <div className="text-sm text-gray-600">
                    {globalLeaderboard[0]?.totalPoints.toLocaleString()} pts
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <Award className="h-12 w-12 text-amber-600 mb-2" />
                <div className="bg-amber-50 rounded-lg p-4 text-center w-32">
                  <div className="text-2xl font-bold text-amber-700">3rd</div>
                  <div className="font-medium mt-1">
                    {globalLeaderboard[2]?.username}
                  </div>
                  <div className="text-sm text-gray-600">
                    {globalLeaderboard[2]?.totalPoints.toLocaleString()} pts
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="global">Global Leaderboard</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="global" className="space-y-4">
              <ServerDataTable
                columns={columns}
                data={globalLeaderboard}
                loading={loading && activeTab === "global"}
                paginationMeta={globalPagination}
                onPageChange={(page) => fetchGlobalLeaderboard(page)}
                onPageSizeChange={(pageSize) => {
                  setGlobalPagination((prev) => ({ ...prev, limit: pageSize }));
                  fetchGlobalLeaderboard(1);
                }}
              />

              <div className="flex items-center justify-center pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          globalPagination.hasPreviousPage &&
                          fetchGlobalLeaderboard(globalPagination.page - 1)
                        }
                        className={
                          !globalPagination.hasPreviousPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: globalPagination.totalPages },
                      (_, i) => i + 1
                    ).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => fetchGlobalLeaderboard(pageNum)}
                          isActive={pageNum === globalPagination.page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          globalPagination.hasNextPage &&
                          fetchGlobalLeaderboard(globalPagination.page + 1)
                        }
                        className={
                          !globalPagination.hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <ServerDataTable
                columns={columns}
                data={weeklyLeaderboard}
                loading={loading && activeTab === "weekly"}
                paginationMeta={weeklyPagination}
                onPageChange={(page) => fetchWeeklyLeaderboard(page)}
                onPageSizeChange={(pageSize) => {
                  setWeeklyPagination((prev) => ({ ...prev, limit: pageSize }));
                  fetchWeeklyLeaderboard(1);
                }}
              />

              <div className="flex items-center justify-center pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          weeklyPagination.hasPreviousPage &&
                          fetchWeeklyLeaderboard(weeklyPagination.page - 1)
                        }
                        className={
                          !weeklyPagination.hasPreviousPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: weeklyPagination.totalPages },
                      (_, i) => i + 1
                    ).map((pageNum) => (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => fetchWeeklyLeaderboard(pageNum)}
                          isActive={pageNum === weeklyPagination.page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          weeklyPagination.hasNextPage &&
                          fetchWeeklyLeaderboard(weeklyPagination.page + 1)
                        }
                        className={
                          !weeklyPagination.hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
