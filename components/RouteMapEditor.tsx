"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Trash2, Undo } from "lucide-react";

// Fix Leaflet default icon issue with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons for start/end/waypoints
const startIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const waypointIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Waypoint {
  lat: number;
  lng: number;
}

interface RouteMapEditorProps {
  waypoints: Waypoint[];
  onChange: (waypoints: Waypoint[]) => void;
  center?: [number, number];
  zoom?: number;
}

function MapClickHandler({
  waypoints,
  onAddWaypoint,
  onRemoveWaypoint,
}: {
  waypoints: Waypoint[];
  onAddWaypoint: (lat: number, lng: number) => void;
  onRemoveWaypoint: (index: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;

      // Check if clicking on existing waypoint to remove it
      const clickedIndex = waypoints.findIndex((wp) => {
        const distance = Math.sqrt(
          Math.pow(wp.lat - lat, 2) + Math.pow(wp.lng - lng, 2)
        );
        return distance < 0.0001; // ~11 meters tolerance
      });

      if (clickedIndex !== -1) {
        onRemoveWaypoint(clickedIndex);
      } else {
        onAddWaypoint(lat, lng);
      }
    },
  });

  return null;
}

export function RouteMapEditor({
  waypoints,
  onChange,
  center = [48.8566, 2.3522], // Paris default
  zoom = 13,
}: RouteMapEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addWaypoint = (lat: number, lng: number) => {
    onChange([...waypoints, { lat, lng }]);
  };

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    onChange(newWaypoints);
  };

  const clearAllWaypoints = () => {
    onChange([]);
  };

  const undoLastWaypoint = () => {
    if (waypoints.length > 0) {
      onChange(waypoints.slice(0, -1));
    }
  };

  const calculateDistance = () => {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      // Haversine formula
      const R = 6371; // Earth's radius in km
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) *
          Math.cos((p2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }

    return Number(totalDistance).toFixed(2);
  };

  if (!mounted) {
    return (
      <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  const mapCenter: [number, number] =
    waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : center;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm space-y-1">
          <p className="font-medium">
            Waypoints: {waypoints.length} | Distance: {calculateDistance()} km
          </p>
          <p className="text-gray-500">
            Click on map to add waypoints. Click on existing waypoint to remove
            it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={undoLastWaypoint}
            disabled={waypoints.length === 0}
          >
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clearAllWaypoints}
            disabled={waypoints.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="h-[500px] rounded-lg overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler
            waypoints={waypoints}
            onAddWaypoint={addWaypoint}
            onRemoveWaypoint={removeWaypoint}
          />

          {waypoints.map((waypoint, index) => {
            let icon = waypointIcon;
            let title = `Waypoint ${index + 1}`;

            if (index === 0) {
              icon = startIcon;
              title = "Start Point";
            } else if (index === waypoints.length - 1) {
              icon = endIcon;
              title = "End Point";
            }

            return (
              <Marker
                key={index}
                position={[waypoint.lat, waypoint.lng]}
                icon={icon}
                title={title}
              />
            );
          })}

          {waypoints.length > 1 && (
            <Polyline
              positions={waypoints.map((wp) => [wp.lat, wp.lng])}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {waypoints.length > 0 && (
        <div className="text-xs space-y-1 max-h-32 overflow-auto border rounded p-2 bg-gray-50">
          {waypoints.map((wp, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-mono">
                {index === 0
                  ? "🟢 Start"
                  : index === waypoints.length - 1
                  ? "🔴 End"
                  : `🔵 Point ${index}`}
                :
              </span>
              <span className="text-gray-600">
                {Number(wp.lat).toFixed(6)}, {Number(wp.lng).toFixed(6)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
