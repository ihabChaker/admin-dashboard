"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Target,
  Gift,
  Trophy,
  QrCode,
  Image as ImageIcon,
  Play,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { TreasureHunt, TreasureItem } from "@/lib/types";
import { AudioPlayer } from "@/components/audio-player";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import the map to avoid SSR issues
const DynamicMap = dynamic(
  () => import("@/components/openstreet-map").then((mod) => mod.OpenStreetMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
);

interface TreasureHuntDetails extends TreasureHunt {
  parcours?: {
    id: number;
    name: string;
  };
}

export default function TreasureHuntDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [treasure, setTreasure] = useState<TreasureHuntDetails | null>(null);
  const [items, setItems] = useState<TreasureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchTreasureDetails();
  }, [id]);

  const fetchTreasureDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/treasure-hunts/${id}`);
      setTreasure(response.data);
      setItems(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch treasure hunt details", error);
      toast.error("Failed to fetch treasure hunt details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Loading treasure hunt...</div>
        </div>
      </div>
    );
  }

  if (!treasure) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">
            Treasure hunt not found
          </div>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{treasure.name}</h1>
          <Badge variant={treasure.isActive ? "default" : "secondary"}>
            {treasure.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {treasure.description && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <div className="text-gray-900">{treasure.description}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <Target className="h-4 w-4" />
                Target Object
              </div>
              <div className="font-medium">{treasure.targetObject}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Points Reward
                </div>
                <div className="font-medium text-lg text-amber-600">
                  {treasure.pointsReward} pts
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Scan Radius
                </div>
                <div className="font-medium">{treasure.scanRadiusMeters}m</div>
              </div>
            </div>

            {treasure.parcours && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Parcours</div>
                <Badge variant="outline">{treasure.parcours.name}</Badge>
              </div>
            )}

            {treasure.qrCode && (
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </div>
                <Badge className="bg-green-100 text-green-700">Generated</Badge>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Created: {new Date(treasure.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        {/* Map Card */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent>
            <DynamicMap
              startPoint={{
                lat: treasure.latitude,
                lon: treasure.longitude,
              }}
              points={[
                {
                  lat: treasure.latitude,
                  lon: treasure.longitude,
                  label: treasure.name,
                  type: "poi",
                },
              ]}
            />
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {Number(treasure.latitude).toFixed(6)},{" "}
                  {Number(treasure.longitude).toFixed(6)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treasure Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Treasure Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded flex items-center justify-center">
                        <Gift className="h-8 w-8 text-amber-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-lg">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </div>
                      )}
                      <div className="mt-2">
                        <Badge className="bg-amber-100 text-amber-700">
                          {item.points} points
                        </Badge>
                      </div>

                      {/* Quiz Association */}
                      {item.quiz && (
                        <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
                            <HelpCircle className="h-4 w-4" />
                            Quiz: {item.quiz.title}
                          </div>
                          {item.quiz.description && (
                            <div className="text-xs text-purple-600">
                              {item.quiz.description}
                            </div>
                          )}
                          {item.quiz.questions && (
                            <div className="text-xs text-purple-600 mt-1">
                              {item.quiz.questions.length} questions
                            </div>
                          )}
                        </div>
                      )}

                      {/* Podcast Association */}
                      {item.podcast && (
                        <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                            <Play className="h-4 w-4" />
                            Podcast: {item.podcast.title}
                          </div>
                          <AudioPlayer
                            src={item.podcast.audioFileUrl}
                            title={item.podcast.title}
                          />
                          <div className="text-xs text-orange-600 mt-2">
                            Duration:{" "}
                            {Math.floor(item.podcast.durationSeconds / 60)}:
                            {(item.podcast.durationSeconds % 60)
                              .toString()
                              .padStart(2, "0")}{" "}
                            • Narrator: {item.podcast.narrator}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No treasure items yet</p>
              <p className="text-sm mt-2">
                Add items to make this treasure hunt more engaging
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
