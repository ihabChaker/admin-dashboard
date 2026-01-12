"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import { RouteMapEditor } from "@/components/RouteMapEditor";
import { ArrowLeft, Save } from "lucide-react";

const parcoursSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]),
  distanceKm: z.number().positive("Distance must be positive"),
  estimatedDuration: z.number().int().positive("Duration must be positive"),
  isPmrAccessible: z.boolean().optional(),
  historicalTheme: z.string().max(255).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

type ParcoursFormData = z.infer<typeof parcoursSchema>;

interface Waypoint {
  lat: number;
  lng: number;
}

export default function ParcoursFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.id;
  const parcoursId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEdit);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParcoursFormData>({
    resolver: zodResolver(parcoursSchema),
    defaultValues: {
      difficultyLevel: "medium",
      isPmrAccessible: false,
      isActive: true,
    },
  });

  const difficultyLevel = watch("difficultyLevel");
  const isPmrAccessible = watch("isPmrAccessible");
  const isActive = watch("isActive");

  useEffect(() => {
    if (isEdit && parcoursId) {
      fetchParcoursData();
    }
  }, [isEdit, parcoursId]);

  const fetchParcoursData = async () => {
    try {
      setFetchingData(true);
      const response = await api.get(`/parcours/${parcoursId}`);
      const data = response.data;

      setValue("name", data.name);
      setValue("description", data.description || "");
      setValue("difficultyLevel", data.difficultyLevel);
      setValue("distanceKm", parseFloat(data.distanceKm));
      setValue("estimatedDuration", data.estimatedDuration);
      setValue("isPmrAccessible", data.isPmrAccessible);
      setValue("historicalTheme", data.historicalTheme || "");
      setValue("imageUrl", data.imageUrl || "");
      setValue("isActive", data.isActive);

      // Parse GeoJSON path if available
      if (data.geoJsonPath) {
        try {
          const geoJson = JSON.parse(data.geoJsonPath);
          if (geoJson.type === "LineString" && geoJson.coordinates) {
            const parsedWaypoints = geoJson.coordinates.map(
              (coord: number[]) => ({
                lng: coord[0],
                lat: coord[1],
              })
            );
            setWaypoints(parsedWaypoints);
          }
        } catch (e) {
          console.error("Error parsing GeoJSON:", e);
        }
      } else if (data.startingPointLat && data.startingPointLon) {
        // Fallback to start/end points
        const wps: Waypoint[] = [
          {
            lat: parseFloat(data.startingPointLat),
            lng: parseFloat(data.startingPointLon),
          },
        ];
        if (data.endPointLat && data.endPointLon) {
          wps.push({
            lat: parseFloat(data.endPointLat),
            lng: parseFloat(data.endPointLon),
          });
        }
        setWaypoints(wps);
      }
    } catch (error) {
      console.error("Error fetching parcours:", error);
      toast.error("Failed to load parcours data");
      router.push("/dashboard/parcours");
    } finally {
      setFetchingData(false);
    }
  };

  const onSubmit = async (data: ParcoursFormData) => {
    if (waypoints.length === 0) {
      toast.error("Please add at least a start point on the map");
      return;
    }

    setLoading(true);
    try {
      // Build GeoJSON from waypoints
      const geoJsonPath = {
        type: "LineString",
        coordinates: waypoints.map((wp) => [wp.lng, wp.lat]),
      };

      const payload = {
        ...data,
        startingPointLat: waypoints[0].lat,
        startingPointLon: waypoints[0].lng,
        endPointLat: waypoints[waypoints.length - 1].lat,
        endPointLon: waypoints[waypoints.length - 1].lng,
        geoJsonPath: JSON.stringify(geoJsonPath),
        distanceKm: parseFloat(data.distanceKm.toString()),
      };

      if (isEdit) {
        console.log("Updating parcours with payload:", payload);
        await api.put(`/parcours/${parcoursId}`, payload);
        toast.success("Parcours updated successfully");
      } else {
        console.log("Creating parcours with payload:", payload);
        await api.post("/parcours", payload);
        toast.success("Parcours created successfully");
      }

      router.push("/dashboard/parcours");
    } catch (error: any) {
      console.error("Error saving parcours:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to save parcours";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/dashboard/parcours")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Parcours
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEdit ? "Edit Parcours" : "Create New Parcours"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Plages du Débarquement"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Description of the parcours..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficultyLevel">Difficulty *</Label>
                  <Select
                    value={difficultyLevel}
                    onValueChange={(value) =>
                      setValue(
                        "difficultyLevel",
                        value as "easy" | "medium" | "hard"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="distanceKm">Distance (km) *</Label>
                  <Input
                    id="distanceKm"
                    type="number"
                    step="0.1"
                    {...register("distanceKm", { valueAsNumber: true })}
                    placeholder="8.5"
                  />
                  {errors.distanceKm && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.distanceKm.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedDuration">
                    Duration (minutes) *
                  </Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    {...register("estimatedDuration", { valueAsNumber: true })}
                    placeholder="180"
                  />
                  {errors.estimatedDuration && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.estimatedDuration.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="historicalTheme">Historical Theme</Label>
                  <Input
                    id="historicalTheme"
                    {...register("historicalTheme")}
                    placeholder="e.g., World War II"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  {...register("imageUrl")}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.imageUrl && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.imageUrl.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPmrAccessible"
                    checked={isPmrAccessible}
                    onCheckedChange={(checked) =>
                      setValue("isPmrAccessible", checked)
                    }
                  />
                  <Label htmlFor="isPmrAccessible">PMR Accessible</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setValue("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>

            {/* Route Map Editor */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Route Path</h3>
              <RouteMapEditor
                waypoints={waypoints}
                onChange={setWaypoints}
                center={
                  waypoints.length > 0
                    ? [waypoints[0].lat, waypoints[0].lng]
                    : undefined
                }
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/parcours")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading
                  ? "Saving..."
                  : isEdit
                  ? "Update Parcours"
                  : "Create Parcours"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
