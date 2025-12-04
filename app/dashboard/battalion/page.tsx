"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, Shield, Route } from "lucide-react";
import { toast } from "sonner";

interface Battalion {
  id: number;
  name: string;
  country: string;
  militaryUnit?: string;
  period?: string;
  description?: string;
  createdAt: string;
}

interface BattalionRoute {
  id: number;
  battalionId: number;
  parcoursId: number;
  routeDate: string;
  historicalContext?: string;
  battalion?: {
    name: string;
    country: string;
  };
  parcours?: {
    name: string;
  };
}

const battalionFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  country: z.string().min(1, "Country is required").max(100, "Country too long"),
  militaryUnit: z.string().max(200).optional(),
  period: z.string().max(100).optional(),
  description: z.string().optional(),
});

const routeFormSchema = z.object({
  battalionId: z.coerce.number().int().positive("Battalion is required"),
  parcoursId: z.coerce.number().int().positive("Parcours is required"),
  routeDate: z.string().min(1, "Date is required"),
  historicalContext: z.string().optional(),
});

export default function BattalionPage() {
  const [battalions, setBattalions] = useState<Battalion[]>([]);
  const [routes, setRoutes] = useState<BattalionRoute[]>([]);
  const [parcoursList, setParcoursList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBattalion, setOpenBattalion] = useState(false);
  const [openRoute, setOpenRoute] = useState(false);
  const [editingBattalion, setEditingBattalion] = useState<Battalion | null>(null);
  const [editingRoute, setEditingRoute] = useState<BattalionRoute | null>(null);

  const battalionForm = useForm({
    resolver: zodResolver(battalionFormSchema),
    defaultValues: {
      name: "",
      country: "",
      militaryUnit: "",
      period: "",
      description: "",
    },
  });

  const routeForm = useForm({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      battalionId: 0,
      parcoursId: 0,
      routeDate: "",
      historicalContext: "",
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [battalionsRes, parcourRes] = await Promise.all([
        api.get("/historical/battalions"),
        api.get("/parcours"),
      ]);
      setBattalions(battalionsRes.data);
      setParcoursList(parcourRes.data);
      
      // Fetch routes for first battalion if exists
      if (battalionsRes.data.length > 0) {
        await fetchAllRoutes();
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRoutes = async () => {
    try {
      // For now, fetch routes for all battalions
      const allRoutes: BattalionRoute[] = [];
      for (const battalion of battalions) {
        const res = await api.get(`/historical/routes/battalion/${battalion.id}`);
        allRoutes.push(...res.data);
      }
      setRoutes(allRoutes);
    } catch (error) {
      console.error("Failed to fetch routes", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!openBattalion) {
      setEditingBattalion(null);
      battalionForm.reset({
        name: "",
        country: "",
        militaryUnit: "",
        period: "",
        description: "",
      });
    }
  }, [openBattalion, battalionForm]);

  useEffect(() => {
    if (!openRoute) {
      setEditingRoute(null);
      routeForm.reset({
        battalionId: 0,
        parcoursId: 0,
        routeDate: "",
        historicalContext: "",
      });
    }
  }, [openRoute, routeForm]);

  const handleEditBattalion = (battalion: Battalion) => {
    setEditingBattalion(battalion);
    battalionForm.reset({
      name: battalion.name,
      country: battalion.country,
      militaryUnit: battalion.militaryUnit || "",
      period: battalion.period || "",
      description: battalion.description || "",
    });
    setOpenBattalion(true);
  };

  const handleEditRoute = (route: BattalionRoute) => {
    setEditingRoute(route);
    routeForm.reset({
      battalionId: route.battalionId,
      parcoursId: route.parcoursId,
      routeDate: route.routeDate,
      historicalContext: route.historicalContext || "",
    });
    setOpenRoute(true);
  };

  const onSubmitBattalion = async (values: z.infer<typeof battalionFormSchema>) => {
    try {
      if (editingBattalion) {
        await api.put(`/historical/battalions/${editingBattalion.id}`, values);
        toast.success("Battalion updated successfully");
      } else {
        await api.post("/historical/battalions", values);
        toast.success("Battalion created successfully");
      }
      setOpenBattalion(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save battalion", error);
      toast.error(editingBattalion ? "Failed to update battalion" : "Failed to create battalion");
    }
  };

  const onSubmitRoute = async (values: z.infer<typeof routeFormSchema>) => {
    try {
      if (editingRoute) {
        const { battalionId, parcoursId, ...updateData } = values;
        await api.put(`/historical/routes/${editingRoute.id}`, updateData);
        toast.success("Route updated successfully");
      } else {
        await api.post("/historical/routes", values);
        toast.success("Route created successfully");
      }
      setOpenRoute(false);
      fetchAllRoutes();
    } catch (error) {
      console.error("Failed to save route", error);
      toast.error(editingRoute ? "Failed to update route" : "Failed to create route");
    }
  };

  const handleDeleteBattalion = async (id: number) => {
    if (!confirm("Are you sure you want to delete this battalion?")) return;

    try {
      await api.delete(`/historical/battalions/${id}`);
      toast.success("Battalion deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to delete battalion", error);
      toast.error("Failed to delete battalion");
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm("Are you sure you want to delete this route?")) return;

    try {
      await api.delete(`/historical/routes/${id}`);
      toast.success("Route deleted successfully");
      fetchAllRoutes();
    } catch (error) {
      console.error("Failed to delete route", error);
      toast.error("Failed to delete route");
    }
  };

  if (loading) {
    return <div className="p-8">Loading historical data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-600" />
          Historical Battalion Management
        </h1>
        <p className="text-gray-600 mt-1">Manage WWII battalions and their historical routes</p>
      </div>

      <Tabs defaultValue="battalions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="battalions">Battalions</TabsTrigger>
          <TabsTrigger value="routes">Historical Routes</TabsTrigger>
        </TabsList>

        <TabsContent value="battalions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openBattalion} onOpenChange={setOpenBattalion}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Battalion
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingBattalion ? "Edit Battalion" : "Add New Battalion"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBattalion
                      ? "Update the battalion details."
                      : "Create a new historical battalion record."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...battalionForm}>
                  <form
                    onSubmit={battalionForm.handleSubmit(onSubmitBattalion)}
                    className="space-y-4"
                  >
                    <FormField
                      control={battalionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Battalion Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2nd Ranger Battalion" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={battalionForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., USA, UK, France" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={battalionForm.control}
                      name="militaryUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Military Unit</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., US Army Rangers" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={battalionForm.control}
                      name="period"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1944-1945" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={battalionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Historical details about this battalion..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">
                        {editingBattalion ? "Update Battalion" : "Create Battalion"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Battalions ({battalions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Military Unit</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {battalions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No battalions found. Create your first battalion!
                      </TableCell>
                    </TableRow>
                  ) : (
                    battalions.map((battalion) => (
                      <TableRow key={battalion.id}>
                        <TableCell className="font-medium">{battalion.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{battalion.name}</div>
                          {battalion.description && (
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {battalion.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{battalion.country}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {battalion.militaryUnit || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {battalion.period || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditBattalion(battalion)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteBattalion(battalion.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openRoute} onOpenChange={setOpenRoute}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Historical Route
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingRoute ? "Edit Historical Route" : "Add New Historical Route"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRoute
                      ? "Update the route details."
                      : "Link a battalion to a parcours with historical context."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...routeForm}>
                  <form
                    onSubmit={routeForm.handleSubmit(onSubmitRoute)}
                    className="space-y-4"
                  >
                    <FormField
                      control={routeForm.control}
                      name="battalionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Battalion *</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-gray-300 px-3 py-2"
                              {...field}
                              value={field.value as number}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled={!!editingRoute}
                            >
                              <option value="">Select a battalion</option>
                              {battalions.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} ({b.country})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={routeForm.control}
                      name="parcoursId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parcours *</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-gray-300 px-3 py-2"
                              {...field}
                              value={field.value as number}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              disabled={!!editingRoute}
                            >
                              <option value="">Select a parcours</option>
                              {parcoursList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={routeForm.control}
                      name="routeDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Route Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={routeForm.control}
                      name="historicalContext"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Historical Context</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What happened on this route on this date..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">
                        {editingRoute ? "Update Route" : "Create Route"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Historical Routes ({routes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Battalion</TableHead>
                    <TableHead>Parcours</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Context</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No routes found. Create your first historical route!
                      </TableCell>
                    </TableRow>
                  ) : (
                    routes.map((route) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {route.battalion?.name || `Battalion #${route.battalionId}`}
                          </div>
                          {route.battalion?.country && (
                            <div className="text-xs text-gray-500">
                              {route.battalion.country}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {route.parcours?.name || `Parcours #${route.parcoursId}`}
                        </TableCell>
                        <TableCell className="text-sm">{route.routeDate}</TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs">
                          <div className="line-clamp-2">
                            {route.historicalContext || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRoute(route)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteRoute(route.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
