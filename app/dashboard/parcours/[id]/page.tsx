"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Gauge,
  Accessibility,
  Calendar,
  Image as ImageIcon,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { AudioPlayer } from "@/components/audio-player";
import { Parcours, PointOfInterest, Podcast } from "@/lib/types";
import { uploadService } from "@/lib/upload";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamically import the map to avoid SSR issues
const DynamicMap = dynamic(
  () => import("@/components/openstreet-map").then((mod) => mod.OpenStreetMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    ),
  }
);

export default function ParcoursDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchParcoursDetails();
  }, [id]);

  const fetchParcoursDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/parcours/${id}`);
      setParcours(response.data);
      setPois(response.data.pointsOfInterest || []);
      setPodcasts(response.data.podcasts || []);
    } catch (error) {
      console.error("Failed to fetch parcours details", error);
      toast.error("Failed to fetch parcours details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadService.uploadParcoursImage(file);

      // Update parcours with new image URL
      await api.put(`/parcours/${id}`, {
        imageUrl: result.imageUrl,
      });

      toast.success("Image uploaded successfully");
      fetchParcoursDetails();
    } catch (error) {
      console.error("Failed to upload image", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleGPXUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadService.uploadGPXFile(file);

      // Update parcours with GPX data
      await api.put(`/parcours/${id}`, {
        gpxFileUrl: result.gpxFileUrl,
        geoJsonPath: result.geoJson,
        startingPointLat: result.startPoint?.lat,
        startingPointLon: result.startPoint?.lon,
        endPointLat: result.endPoint?.lat,
        endPointLon: result.endPoint?.lon,
        distanceKm: result.totalDistance,
      });

      toast.success(
        `GPX uploaded: ${
          result.waypointsCount
        } waypoints, ${result.totalDistance?.toFixed(2)} km`
      );
      fetchParcoursDetails();
    } catch (error) {
      console.error("Failed to upload GPX", error);
      toast.error("Failed to upload GPX file");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium">Loading parcours...</div>
        </div>
      </div>
    );
  }

  if (!parcours) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">
            Parcours not found
          </div>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const mapPoints = pois.map((poi) => ({
    lat: poi.latitude,
    lon: poi.longitude,
    label: poi.name,
    type: "poi" as const,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{parcours.name}</h1>
          <Badge variant={parcours.isActive ? "default" : "secondary"}>
            {parcours.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Cover Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parcours.imageUrl ? (
              <img
                src={parcours.imageUrl}
                alt={parcours.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div>
              <input
                type="file"
                id="image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("image-upload")?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Description</div>
              <div className="text-gray-900">
                {parcours.description || "No description"}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Gauge className="h-4 w-4" />
                  Difficulty
                </div>
                <Badge
                  variant={
                    parcours.difficultyLevel === "easy"
                      ? "default"
                      : parcours.difficultyLevel === "medium"
                      ? "secondary"
                      : "destructive"
                  }
                  className={
                    parcours.difficultyLevel === "easy"
                      ? "bg-green-100 text-green-700"
                      : parcours.difficultyLevel === "medium"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {parcours.difficultyLevel}
                </Badge>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Distance
                </div>
                <div className="font-medium">{parcours.distanceKm} km</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Duration
                </div>
                <div className="font-medium">
                  {parcours.estimatedDuration} min
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Accessibility className="h-4 w-4" />
                  PMR Access
                </div>
                <div
                  className={
                    parcours.isPmrAccessible
                      ? "text-green-600 font-medium"
                      : "text-gray-400"
                  }
                >
                  {parcours.isPmrAccessible ? "Yes" : "No"}
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-1">Historical Theme</div>
              <div className="font-medium">
                {parcours.historicalTheme || "N/A"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Created</div>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(parcours.creationDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Last Updated</div>
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {new Date(parcours.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Visualization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Route Visualization</CardTitle>
          <div>
            <input
              type="file"
              id="gpx-upload"
              accept=".gpx"
              className="hidden"
              onChange={handleGPXUpload}
              disabled={uploading}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("gpx-upload")?.click()}
              disabled={uploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload GPX"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {parcours.startingPointLat && parcours.startingPointLon ? (
            <DynamicMap
              startPoint={{
                lat: parcours.startingPointLat,
                lon: parcours.startingPointLon,
              }}
              endPoint={
                parcours.endPointLat && parcours.endPointLon
                  ? {
                      lat: parcours.endPointLat,
                      lon: parcours.endPointLon,
                    }
                  : undefined
              }
              geoJson={parcours.geoJsonPath || undefined}
              points={mapPoints}
            />
          ) : (
            <div className="bg-gray-100 rounded-lg p-12 text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No route data available</p>
              <p className="text-sm mt-2">
                Upload a GPX file to visualize the route
              </p>
            </div>
          )}

          {parcours.gpxFileUrl && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <FileText className="h-4 w-4" />
                  <span>GPX File Available</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open(parcours.gpxFileUrl, "_blank")}
                  className="text-blue-700"
                >
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Points of Interest */}
      <Card>
        <CardHeader>
          <CardTitle>Points of Interest ({pois.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pois.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pois.map((poi) => (
                <div
                  key={poi.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    {poi.imageUrl ? (
                      <img
                        src={poi.imageUrl}
                        alt={poi.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{poi.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {poi.description}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {poi.poiType}
                        </Badge>
                        {poi.historicalPeriod && (
                          <Badge variant="outline" className="text-xs">
                            {poi.historicalPeriod}
                          </Badge>
                        )}
                      </div>
                      {poi.audioUrl && (
                        <div className="mt-2 text-xs text-blue-600">
                          🎧 Audio guide available
                        </div>
                      )}
                      {poi.quiz && (
                        <div className="mt-1 text-xs text-purple-600">
                          ❓ Quiz: {poi.quiz.title}
                        </div>
                      )}
                      {poi.podcast && (
                        <div className="mt-1 text-xs text-orange-600">
                          🎙️ Podcast: {poi.podcast.title}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No points of interest yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Podcasts */}
      {podcasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Podcasts ({podcasts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-4 mb-4">
                  {podcast.thumbnailUrl ? (
                    <img
                      src={podcast.thumbnailUrl}
                      alt={podcast.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-lg">{podcast.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {podcast.description}
                    </div>
                    <div className="flex gap-2 mt-2 text-xs text-gray-500">
                      <span>Narrator: {podcast.narrator}</span>
                      <span>•</span>
                      <span>{podcast.language.toUpperCase()}</span>
                      <span>•</span>
                      <span>
                        {Math.floor(podcast.durationSeconds / 60)}:
                        {(podcast.durationSeconds % 60)
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>
                <AudioPlayer src={podcast.audioFileUrl} title={podcast.title} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
