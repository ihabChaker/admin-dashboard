"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { uploadService } from "@/lib/upload";
import { AudioPlayer } from "@/components/audio-player";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Trash2, Plus, Play, Upload } from "lucide-react";
import { toast } from "sonner";

interface Podcast {
  id: number;
  title: string;
  description: string;
  durationSeconds: number;
  audioFileUrl: string;
  narrator: string;
  language: string;
  thumbnailUrl?: string;
}

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  durationSeconds: z.number().min(1, "Duration must be positive"),
  audioFileUrl: z.string().min(1, "Audio URL is required"),
  narrator: z.string().min(2, "Narrator name is required"),
  language: z
    .string()
    .length(2, "Language code must be 2 characters (e.g., fr)"),
  thumbnailUrl: z.string().optional().or(z.literal("")),
});

type PodcastFormValues = z.infer<typeof formSchema>;

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [uploading, setUploading] = useState(false);
  const [playingPodcast, setPlayingPodcast] = useState<Podcast | null>(null);

  const form = useForm<PodcastFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      durationSeconds: 0,
      audioFileUrl: "",
      narrator: "",
      language: "fr",
      thumbnailUrl: "",
    },
  });

  const fetchPodcasts = async () => {
    try {
      const response = await api.get("/podcasts");
      setPodcasts(response.data);
    } catch (error) {
      console.error("Failed to fetch podcasts", error);
      toast.error("Failed to fetch podcasts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, []);

  useEffect(() => {
    if (!open) {
      setEditingPodcast(null);
      form.reset({
        title: "",
        description: "",
        durationSeconds: 0,
        audioFileUrl: "",
        narrator: "",
        language: "fr",
        thumbnailUrl: "",
      });
    }
  }, [open, form]);

  const handleAudioUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadService.uploadPodcastAudio(file);

      form.setValue("audioFileUrl", result.audioFileUrl || "");

      // Try to get audio duration
      const audio = new Audio(result.audioFileUrl);
      audio.addEventListener("loadedmetadata", () => {
        if (audio.duration && isFinite(audio.duration)) {
          form.setValue("durationSeconds", Math.floor(audio.duration));
        }
      });

      toast.success("Audio file uploaded successfully");
    } catch (error) {
      console.error("Failed to upload audio", error);
      toast.error("Failed to upload audio file");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (podcast: Podcast) => {
    setEditingPodcast(podcast);
    form.reset({
      title: podcast.title,
      description: podcast.description,
      durationSeconds: podcast.durationSeconds,
      audioFileUrl: podcast.audioFileUrl,
      narrator: podcast.narrator,
      language: podcast.language,
      thumbnailUrl: podcast.thumbnailUrl || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this podcast? This action cannot be undone."
      )
    )
      return;

    try {
      await api.delete(`/podcasts/${id}`);
      toast.success("Podcast deleted successfully");
      fetchPodcasts();
    } catch (error) {
      console.error("Failed to delete podcast", error);
      toast.error("Failed to delete podcast");
    }
  };

  const onSubmit = async (values: PodcastFormValues) => {
    try {
      if (editingPodcast) {
        await api.put(`/podcasts/${editingPodcast.id}`, values);
        toast.success("Podcast updated successfully");
      } else {
        await api.post("/podcasts", values);
        toast.success("Podcast created successfully");
      }
      setOpen(false);
      fetchPodcasts();
    } catch (error) {
      console.error("Failed to save podcast", error);
      toast.error("Failed to save podcast");
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="p-8">Loading podcasts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Podcasts Management
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Podcast
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPodcast ? "Edit Podcast" : "Add New Podcast"}
              </DialogTitle>
              <DialogDescription>
                {editingPodcast
                  ? "Update podcast details."
                  : "Create a new podcast entry."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Podcast Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Podcast Description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audio Upload */}
                <div className="space-y-2">
                  <FormLabel>Audio File</FormLabel>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id="audio-upload"
                      accept="audio/mp3,audio/wav,audio/ogg,audio/m4a"
                      className="hidden"
                      onChange={handleAudioUpload}
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("audio-upload")?.click()
                      }
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Audio File"}
                    </Button>
                  </div>
                  {form.watch("audioFileUrl") && (
                    <div className="text-xs text-green-600">
                      ✓ Audio file uploaded
                    </div>
                  )}
                  <FormDescription>
                    Supported formats: MP3, WAV, OGG, M4A (max 50MB)
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="audioFileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audio URL (or use upload above)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/audio.mp3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="durationSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="600"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <FormControl>
                          <Input placeholder="fr" {...field} maxLength={2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="narrator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narrator</FormLabel>
                      <FormControl>
                        <Input placeholder="Narrator Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/image.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {editingPodcast ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Podcasts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Narrator</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Lang</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podcasts.map((podcast) => (
                <React.Fragment key={podcast.id}>
                  <TableRow>
                    <TableCell className="font-medium">{podcast.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{podcast.title}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[200px]">
                          {podcast.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{podcast.narrator}</TableCell>
                    <TableCell>
                      {formatDuration(podcast.durationSeconds)}
                    </TableCell>
                    <TableCell>{podcast.language.toUpperCase()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setPlayingPodcast(
                              playingPodcast?.id === podcast.id ? null : podcast
                            )
                          }
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(podcast)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(podcast.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {playingPodcast?.id === podcast.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-gray-50">
                        <AudioPlayer
                          src={podcast.audioFileUrl}
                          title={podcast.title}
                          className="my-2"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {podcasts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    No podcasts found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
