"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Award,
  Activity,
  MapPin,
  Trophy,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface UserDetails {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  totalPoints: number;
  createdAt: string;
}

interface UserActivity {
  id: number;
  parcoursId: number;
  startTime: string;
  endTime?: string;
  distanceKm?: number;
  durationMinutes?: number;
  pointsEarned: number;
  parcours?: {
    name: string;
  };
}

interface UserBadge {
  id: number;
  badge: {
    id: number;
    name: string;
    description: string;
    rarity: string;
    iconUrl?: string;
  };
  earnedAt: string;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);

  const [user, setUser] = useState<UserDetails | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [userRes, activitiesRes, badgesRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/activities?userId=${userId}`).catch(() => ({ data: [] })),
        api.get(`/badges/user/${userId}`).catch(() => ({ data: [] })),
      ]);

      setUser(userRes.data);
      setActivities(activitiesRes.data || []);
      setBadges(badgesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch user data", error);
      toast.error("Failed to load user details");
      router.push("/dashboard/users");
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Button
          onClick={() => router.push("/dashboard/users")}
          className="mt-4"
        >
          Back to Users
        </Button>
      </div>
    );
  }

  const totalDistance = Array.isArray(activities)
    ? activities.reduce((sum, a) => sum + (a.distanceKm || 0), 0)
    : 0;
  const totalDuration = Array.isArray(activities)
    ? activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600 mt-1">
              View user profile and activity history
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="text-2xl">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              {(user.firstName || user.lastName) && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Points</p>
                  <p className="font-medium text-blue-600">
                    {user.totalPoints}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDistance.toFixed(1)} km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badges ({badges.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((userBadge) => (
                <div
                  key={userBadge.id}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                >
                  {userBadge.badge.iconUrl ? (
                    <img
                      src={userBadge.badge.iconUrl}
                      alt={userBadge.badge.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{userBadge.badge.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={getRarityColor(userBadge.badge.rarity)}
                      >
                        {userBadge.badge.rarity}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(userBadge.earnedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History ({activities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No activities yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Parcours</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.id}</TableCell>
                    <TableCell>
                      {activity.parcours?.name ||
                        `Parcours #${activity.parcoursId}`}
                    </TableCell>
                    <TableCell>
                      {new Date(activity.startTime).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {activity.distanceKm
                        ? `${activity.distanceKm.toFixed(1)} km`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {activity.durationMinutes
                        ? `${Math.floor(activity.durationMinutes / 60)}h ${
                            activity.durationMinutes % 60
                          }m`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
                        +{activity.pointsEarned}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
