"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POIMapEditor } from "@/components/POIMapEditor";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import { toast } from "sonner";
import api from "@/lib/api";
import { Parcours, Quiz, Podcast, TreasureHunt } from "@/lib/types";

const poiSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  poiType: z.string().min(1, "POI type is required"),
  parcoursId: z.number().min(1, "Parcours is required"),
  historicalPeriod: z.string().optional(),
  orderInParcours: z.number().min(0, "Order must be 0 or greater"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  imageUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
  attachmentType: z
    .enum(["none", "quiz", "podcast", "treasureHunt"])
    .optional(),
  quizId: z.number().optional(),
  podcastId: z.number().optional(),
  treasureHuntId: z.number().optional(),
});

type POIFormData = z.infer<typeof poiSchema>;

export default function POIFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [isLoading, setIsLoading] = useState(false);
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [podcastList, setPodcastList] = useState<Podcast[]>([]);
  const [treasureHuntList, setTreasureHuntList] = useState<TreasureHunt[]>([]);
  const [attachmentType, setAttachmentType] = useState<string>("none");
  const [selectedPoiType, setSelectedPoiType] = useState<string>("");
  const [selectedParcoursId, setSelectedParcoursId] = useState<string>("");
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [selectedPodcastId, setSelectedPodcastId] = useState<string>("");
  const [selectedTreasureHuntId, setSelectedTreasureHuntId] =
    useState<string>("");
  const [savedPOI, setSavedPOI] = useState<{
    id: number;
    qrCode?: string;
    name: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<POIFormData>({
    resolver: zodResolver(poiSchema),
    defaultValues: {
      latitude: 48.8566,
      longitude: 2.3522,
      orderInParcours: 1,
      attachmentType: "none",
    },
  });

  const latitude = watch("latitude");
  const longitude = watch("longitude");

  useEffect(() => {
    fetchParcours();
    fetchQuizzes();
    fetchPodcasts();
    fetchTreasureHunts();

    if (isEditMode && editId) {
      fetchPOI(parseInt(editId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editId]);

  const fetchParcours = async () => {
    try {
      const response = await api.get("/parcours");
      setParcoursList(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch parcours:", error);
      toast.error("Failed to load parcours list");
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await api.get("/quizzes");
      setQuizList(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    }
  };

  const fetchPodcasts = async () => {
    try {
      const response = await api.get("/podcasts");
      setPodcastList(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch podcasts:", error);
    }
  };

  const fetchTreasureHunts = async () => {
    try {
      const response = await api.get("/treasure-hunts");
      setTreasureHuntList(response.data.data || response.data);
    } catch (error) {
      console.error("Failed to fetch treasure hunts:", error);
    }
  };

  const fetchPOI = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/poi/${id}`);
      const poi = response.data;

      setValue("name", poi.name);
      setValue("description", poi.description);
      setValue("poiType", poi.poiType);
      setValue("parcoursId", poi.parcoursId);
      setValue("historicalPeriod", poi.historicalPeriod || "");
      setValue("orderInParcours", poi.orderInParcours);
      setValue("latitude", Number(poi.latitude));
      setValue("longitude", Number(poi.longitude));
      setValue("imageUrl", poi.imageUrl || "");
      setValue("audioUrl", poi.audioUrl || "");

      setSelectedPoiType(poi.poiType);
      setSelectedParcoursId(poi.parcoursId.toString());

      if (poi.quizId) {
        setAttachmentType("quiz");
        setValue("attachmentType", "quiz");
        setValue("quizId", poi.quizId);
        setSelectedQuizId(poi.quizId.toString());
      } else if (poi.podcastId) {
        setAttachmentType("podcast");
        setValue("attachmentType", "podcast");
        setValue("podcastId", poi.podcastId);
        setSelectedPodcastId(poi.podcastId.toString());
      } else if (poi.treasureHuntId) {
        setAttachmentType("treasureHunt");
        setValue("attachmentType", "treasureHunt");
        setValue("treasureHuntId", poi.treasureHuntId);
        setSelectedTreasureHuntId(poi.treasureHuntId.toString());
      }

      setSavedPOI(poi);
    } catch (error) {
      console.error("Error fetching POI:", error);
      toast.error("Error loading POI");
      router.push("/dashboard/poi");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: POIFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Is edit mode:", isEditMode);
    console.log("Edit ID:", editId);

    try {
      setIsLoading(true);

      const payload = {
        name: data.name,
        description: data.description,
        poiType: data.poiType,
        parcoursId: data.parcoursId,
        historicalPeriod: data.historicalPeriod || null,
        orderInParcours: data.orderInParcours,
        latitude: data.latitude,
        longitude: data.longitude,
        imageUrl: data.imageUrl || null,
        audioUrl: data.audioUrl || null,
        quizId: attachmentType === "quiz" ? data.quizId : null,
        podcastId: attachmentType === "podcast" ? data.podcastId : null,
        treasureHuntId:
          attachmentType === "treasureHunt" ? data.treasureHuntId : null,
      };

      console.log("Payload:", payload);

      let result;
      if (isEditMode) {
        console.log("Calling PUT /poi/" + editId);
        const response = await api.put(`/poi/${editId}`, payload);
        result = response.data;
        console.log("Update response:", result);
      } else {
        console.log("Calling POST /poi");
        const response = await api.post("/poi", payload);
        result = response.data;
        console.log("Create response:", result);
      }

      toast.success(
        isEditMode ? "POI updated successfully" : "POI created successfully"
      );
      setSavedPOI(result);

      if (!isEditMode) {
        setTimeout(() => router.push("/dashboard/poi"), 2000);
      }
    } catch (error: any) {
      console.error("Error saving POI:", error);
      console.error("Error response:", error.response?.data);
      toast.error(
        error.response?.data?.message || "An error occurred while saving"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setValue("latitude", lat);
    setValue("longitude", lng);
  };

  // Log form errors for debugging
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
    }
  }, [errors]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit POI" : "Add New POI"}
        </h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/poi")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="POI name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="POI description"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="poiType">Type *</Label>
                    <Select
                      value={selectedPoiType}
                      onValueChange={(value) => {
                        setSelectedPoiType(value);
                        setValue("poiType", value);
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bunker">Bunker</SelectItem>
                        <SelectItem value="blockhaus">Blockhaus</SelectItem>
                        <SelectItem value="memorial">Memorial</SelectItem>
                        <SelectItem value="museum">Museum</SelectItem>
                        <SelectItem value="beach">Beach</SelectItem>
                        <SelectItem value="monument">Monument</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.poiType && (
                      <p className="text-sm text-red-500">
                        {errors.poiType.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="parcours">Parcours *</Label>
                    <Select
                      value={selectedParcoursId}
                      onValueChange={(value) => {
                        setSelectedParcoursId(value);
                        setValue("parcoursId", parseInt(value));
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select parcours" />
                      </SelectTrigger>
                      <SelectContent>
                        {parcoursList.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.parcoursId && (
                      <p className="text-sm text-red-500">
                        {errors.parcoursId.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="historicalPeriod">Historical Period</Label>
                    <Input
                      id="historicalPeriod"
                      {...register("historicalPeriod")}
                      placeholder="e.g., Medieval, WWI"
                    />
                  </div>

                  <div>
                    <Label htmlFor="orderInParcours">Order in Parcours *</Label>
                    <Input
                      id="orderInParcours"
                      type="number"
                      {...register("orderInParcours", { valueAsNumber: true })}
                      placeholder="1"
                    />
                    {errors.orderInParcours && (
                      <p className="text-sm text-red-500">
                        {errors.orderInParcours.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    {...register("imageUrl")}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="text-sm text-red-500">
                      {errors.imageUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="audioUrl">Audio URL</Label>
                  <Input
                    id="audioUrl"
                    {...register("audioUrl")}
                    placeholder="https://example.com/audio.mp3"
                  />
                  {errors.audioUrl && (
                    <p className="text-sm text-red-500">
                      {errors.audioUrl.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="attachmentType">Attachment Type</Label>
                  <Select
                    value={attachmentType}
                    onValueChange={(value) => {
                      setAttachmentType(value);
                      setValue(
                        "attachmentType",
                        value as "none" | "quiz" | "podcast" | "treasureHunt"
                      );
                      setValue("quizId", undefined);
                      setValue("podcastId", undefined);
                      setValue("treasureHuntId", undefined);
                      setSelectedQuizId("");
                      setSelectedPodcastId("");
                      setSelectedTreasureHuntId("");
                    }}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="podcast">Podcast</SelectItem>
                      <SelectItem value="treasureHunt">
                        Treasure Hunt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {attachmentType === "quiz" && (
                  <div>
                    <Label htmlFor="quizId">Select Quiz</Label>
                    <Select
                      value={selectedQuizId}
                      onValueChange={(value) => {
                        setSelectedQuizId(value);
                        setValue("quizId", parseInt(value));
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select quiz" />
                      </SelectTrigger>
                      <SelectContent>
                        {quizList.map((quiz) => (
                          <SelectItem key={quiz.id} value={quiz.id.toString()}>
                            {quiz.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {attachmentType === "podcast" && (
                  <div>
                    <Label htmlFor="podcastId">Select Podcast</Label>
                    <Select
                      value={selectedPodcastId}
                      onValueChange={(value) => {
                        setSelectedPodcastId(value);
                        setValue("podcastId", parseInt(value));
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select podcast" />
                      </SelectTrigger>
                      <SelectContent>
                        {podcastList.map((podcast) => (
                          <SelectItem
                            key={podcast.id}
                            value={podcast.id.toString()}
                          >
                            {podcast.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {attachmentType === "treasureHunt" && (
                  <div>
                    <Label htmlFor="treasureHuntId">Select Treasure Hunt</Label>
                    <Select
                      value={selectedTreasureHuntId}
                      onValueChange={(value) => {
                        setSelectedTreasureHuntId(value);
                        setValue("treasureHuntId", parseInt(value));
                      }}
                    >
                      <SelectTrigger className="cursor-pointer">
                        <SelectValue placeholder="Select treasure hunt" />
                      </SelectTrigger>
                      <SelectContent>
                        {treasureHuntList.map((hunt) => (
                          <SelectItem key={hunt.id} value={hunt.id.toString()}>
                            {hunt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location *</CardTitle>
              </CardHeader>
              <CardContent>
                <POIMapEditor
                  location={{ lat: latitude, lng: longitude }}
                  onChange={(location) =>
                    handleLocationSelect(location.lat, location.lng)
                  }
                  center={[latitude, longitude]}
                />
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>Latitude: {Number(latitude).toFixed(6)}</p>
                  <p>Longitude: {Number(longitude).toFixed(6)}</p>
                </div>
              </CardContent>
            </Card>

            {savedPOI && savedPOI.qrCode && (
              <QRCodeDisplay value={savedPOI.qrCode} title={savedPOI.name} />
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="cursor-pointer">
            {isLoading ? "Saving..." : isEditMode ? "Update POI" : "Create POI"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/poi")}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
