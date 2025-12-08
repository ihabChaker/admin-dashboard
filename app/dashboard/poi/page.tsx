"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit,
  Trash2,
  Plus,
  MapPin,
  QrCode,
  Download,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { ServerDataTable } from "@/components/server-data-table";
import { DataTableColumnHeader } from "@/components/data-table";
import { PointOfInterest } from "@/lib/types";
import QRCodeLib from "qrcode";

interface POI extends PointOfInterest {
  parcours?: {
    name: string;
  };
}

export default function POIPage() {
  const router = useRouter();
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paginationMeta, setPaginationMeta] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchPOIs = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await api.get(`/poi?page=${page}&limit=${limit}`);
      setPois(response.data.data);
      setPaginationMeta(response.data.meta);
    } catch (error) {
      console.error("Failed to fetch POIs", error);
      toast.error("Failed to fetch POIs");
      setPois([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOIs(1, 10);
  }, []);

  const handlePageChange = (page: number) => {
    fetchPOIs(page, paginationMeta.limit);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchPOIs(1, pageSize);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this POI?")) return;

    try {
      await api.delete(`/poi/${id}`);
      toast.success("POI deleted successfully");
      fetchPOIs(paginationMeta.page, paginationMeta.limit);
    } catch (error) {
      console.error("Failed to delete POI", error);
      toast.error("Failed to delete POI");
    }
  };

  const handleEdit = (id: number) => {
    router.push(`/dashboard/poi/${id}/edit?id=${id}`);
  };

  const handleViewQR = async (poi: POI) => {
    if (!poi.qrCode) {
      toast.error("This POI doesn't have a QR code");
      return;
    }

    setSelectedPOI(poi);
    setQrDialogOpen(true);

    // Generate QR code
    try {
      const dataUrl = await QRCodeLib.toDataURL(poi.qrCode, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H",
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("QR generation error:", error);
      toast.error("Failed to generate QR code");
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !selectedPOI) return;

    const link = document.createElement("a");
    link.download = `qr-${selectedPOI.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success("QR code downloaded");
  };

  const handlePrintQR = () => {
    if (!qrDataUrl || !selectedPOI) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${selectedPOI.name}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
            }
            img { 
              max-width: 100%; 
              height: auto; 
            }
            h2 {
              margin-top: 20px;
              font-size: 24px;
              color: #333;
            }
            p {
              margin-top: 10px;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .qr-container { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" />
            <h2>${selectedPOI.name}</h2>
            <p>${selectedPOI.qrCode}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const columns: ColumnDef<POI>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div className="font-medium w-[60px]">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const poi = row.original;
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="font-medium">{poi.name}</span>
              <span className="text-xs text-muted-foreground">
                {Number(poi.latitude).toFixed(4)},{" "}
                {Number(poi.longitude).toFixed(4)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "poiType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const type = row.getValue("poiType") as string;
        return (
          <Badge variant="outline" className="capitalize">
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "parcoursId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parcours ID" />
      ),
    },
    {
      accessorKey: "orderInParcours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => {
        return `#${row.getValue("orderInParcours")}`;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const poi = row.original;
        return (
          <div className="flex justify-end gap-2">
            {poi.qrCode && (
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewQR(poi);
                }}
                title="View QR Code"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(poi.id);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(poi.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Points of Interest</h1>
        <Button onClick={() => router.push("/dashboard/poi/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add POI
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Points of Interest</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerDataTable
            columns={columns}
            data={pois}
            paginationMeta={paginationMeta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            searchKey="name"
            searchPlaceholder="Search by name..."
            loading={loading}
          />
        </CardContent>
      </Card>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedPOI?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrDataUrl && (
              <>
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-64 h-64 border-2 border-gray-200 rounded"
                />
                <p className="text-sm text-gray-600 font-mono">
                  {selectedPOI?.qrCode}
                </p>
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleDownloadQR}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handlePrintQR} className="flex-1">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
