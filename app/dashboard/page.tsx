"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Map,
  Trophy,
  Activity,
  Award,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  users: {
    total: number;
    newThisMonth: number;
    activeThisWeek: number;
  };
  parcours: {
    total: number;
    published: number;
    draft: number;
  };
  activities: {
    totalActivities: number;
    totalDistance: number;
    totalDuration: number;
  };
  rewards: {
    total: number;
    redeemed: number;
  };
}

interface RecentActivity {
  id: number;
  userId: number;
  parcoursId: number;
  startTime: string;
  user?: {
    username: string;
  };
  parcours?: {
    name: string;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activitiesRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/activities/recent").catch(() => ({ data: [] })),
        ]);

        setStats(statsRes.data);
        setRecentActivities(activitiesRes.data || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the HistoRando admin panel
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.users?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.users?.newThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Parcours
            </CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.parcours?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.parcours?.published || 0} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.activities?.totalActivities || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.activities?.totalDistance?.toFixed(1) || 0} km total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.rewards?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.rewards?.redeemed || 0} redeemed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : stats?.users?.activeThisWeek || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Distance
            </CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading
                ? "..."
                : stats?.activities?.totalDistance?.toFixed(1) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Kilometers traveled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? "..." : "Online"}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Badge variant="secondary">{recentActivities.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activities.</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.user?.username || `User #${activity.userId}`}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {activity.parcours?.name ||
                          `Parcours #${activity.parcoursId}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(activity.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/dashboard/parcours"
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Map className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Add Parcours
                </span>
              </Link>
              <Link
                href="/dashboard/challenges"
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-yellow-500 hover:bg-yellow-50 transition-all cursor-pointer"
              >
                <Trophy className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Add Challenge
                </span>
              </Link>
              <Link
                href="/dashboard/badges"
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
              >
                <Award className="h-8 w-8 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Add Badge
                </span>
              </Link>
              <Link
                href="/dashboard/users"
                className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
              >
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  Manage Users
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
