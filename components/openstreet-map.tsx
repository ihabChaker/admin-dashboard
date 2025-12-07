"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
type IconDefault = typeof L.Icon.Default.prototype & {
  _getIconUrl?: unknown;
};
delete (L.Icon.Default.prototype as IconDefault)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom markers
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

const poiIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPoint {
  lat: number;
  lon: number;
  label?: string;
  type?: "start" | "end" | "poi";
}

interface OpenStreetMapProps {
  startPoint: { lat: number; lon: number };
  endPoint?: { lat: number; lon: number };
  geoJson?: string;
  points?: MapPoint[];
  className?: string;
}

// Component to fit bounds when data changes
function FitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);

  return null;
}

export function OpenStreetMap({
  startPoint,
  endPoint,
  geoJson,
  points = [],
  className,
}: OpenStreetMapProps) {
  // Parse GeoJSON if available
  let routeCoordinates: [number, number][] = [];
  if (geoJson) {
    try {
      const parsed = JSON.parse(geoJson);
      if (parsed.type === "LineString" && parsed.coordinates) {
        routeCoordinates = parsed.coordinates.map((coord: [number, number]) => [
          coord[1], // lat
          coord[0], // lon
        ]);
      }
    } catch (e) {
      console.error("Failed to parse GeoJSON:", e);
    }
  }

  // Calculate bounds
  const allPoints = [
    [startPoint.lat, startPoint.lon],
    ...(endPoint ? [[endPoint.lat, endPoint.lon]] : []),
    ...points.map((p) => [p.lat, p.lon]),
    ...routeCoordinates,
  ] as [number, number][];

  const bounds = L.latLngBounds(allPoints);
  const center: [number, number] = bounds.isValid()
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : [startPoint.lat, startPoint.lon];

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "500px", width: "100%", borderRadius: "0.5rem" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds bounds={bounds} />

        {/* Route path */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{ color: "#3b82f6", weight: 4, opacity: 0.7 }}
          />
        )}

        {/* Start marker */}
        <Marker position={[startPoint.lat, startPoint.lon]} icon={startIcon}>
          <Popup>
            <div className="font-medium">Start Point</div>
            <div className="text-xs text-gray-600">
              {startPoint.lat.toFixed(6)}, {startPoint.lon.toFixed(6)}
            </div>
          </Popup>
        </Marker>

        {/* End marker */}
        {endPoint && (
          <Marker position={[endPoint.lat, endPoint.lon]} icon={endIcon}>
            <Popup>
              <div className="font-medium">End Point</div>
              <div className="text-xs text-gray-600">
                {endPoint.lat.toFixed(6)}, {endPoint.lon.toFixed(6)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* POI markers */}
        {points.map((point, index) => (
          <Marker
            key={index}
            position={[point.lat, point.lon]}
            icon={
              point.type === "start"
                ? startIcon
                : point.type === "end"
                ? endIcon
                : poiIcon
            }
          >
            <Popup>
              <div className="font-medium">
                {point.label || `Point ${index + 1}`}
              </div>
              <div className="text-xs text-gray-600">
                {Number(point.lat).toFixed(6)}, {Number(point.lon).toFixed(6)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="mt-2 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Start</span>
        </div>
        {endPoint && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>End</span>
          </div>
        )}
        {points.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>POIs ({points.length})</span>
          </div>
        )}
        {routeCoordinates.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span>Route ({routeCoordinates.length} points)</span>
          </div>
        )}
      </div>
    </div>
  );
}
