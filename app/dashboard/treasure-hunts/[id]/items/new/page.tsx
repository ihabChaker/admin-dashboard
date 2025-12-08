"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const itemSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  pointsValue: z.number().min(0, "Points must be 0 or greater"),
});

type ItemFormData = z.infer<typeof itemSchema>;

export default function NewTreasureItemPage() {
  const params = useParams();
  const router = useRouter();
  const treasureHuntId = parseInt(params.id as string);

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      itemName: "",
      description: "",
      imageUrl: "",
      pointsValue: 10,
    },
  });

  useEffect(() => {
    // Component mounted
  }, []);

  const onSubmit = async (data: ItemFormData) => {
    try {
      setIsLoading(true);

      const payload = {
        treasureHuntId,
        itemName: data.itemName,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        pointsValue: data.pointsValue,
      };

      await api.post("/treasure-hunts/items", payload);
      toast.success("Treasure item created successfully");
      router.push(`/dashboard/treasure-hunts/${treasureHuntId}`);
    } catch (error) {
      console.error("Error creating treasure item:", error);
      toast.error("Failed to create treasure item");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() =>
            router.push(`/dashboard/treasure-hunts/${treasureHuntId}`)
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add Treasure Item</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    {...register("itemName")}
                    placeholder="e.g., Médaille des braves"
                  />
                  {errors.itemName && (
                    <p className="text-sm text-red-500">
                      {errors.itemName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe this treasure item"
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

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
                  <Label htmlFor="pointsValue">Points Value *</Label>
                  <Input
                    id="pointsValue"
                    type="number"
                    {...register("pointsValue", { valueAsNumber: true })}
                    placeholder="10"
                  />
                  {errors.pointsValue && (
                    <p className="text-sm text-red-500">
                      {errors.pointsValue.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Treasure Item"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/treasure-hunts/${treasureHuntId}`)
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
