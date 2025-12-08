"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const poiIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface POILocation {
  lat: number;
  lng: number;
}

interface POIMapEditorProps {
  location: POILocation | null;
  onChange: (location: POILocation) => void;
  center?: [number, number];
  zoom?: number;
}

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });

  return null;
}

export function POIMapEditor({
  location,
  onChange,
  center = [48.8566, 2.3522], // Paris default
  zoom = 13,
}: POIMapEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocationSelect = (lat: number, lng: number) => {
    onChange({ lat, lng });
  };

  if (!mounted) {
    return (
      <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  const mapCenter: [number, number] = location
    ? [location.lat, location.lng]
    : center;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Click on the map to set the POI location
      </div>

      <div className="h-[400px] rounded-lg overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onLocationSelect={handleLocationSelect} />

          {location && (
            <Marker position={[location.lat, location.lng]} icon={poiIcon} />
          )}
        </MapContainer>
      </div>

      {location && (
        <div className="text-sm border rounded p-3 bg-gray-50">
          <div className="font-medium mb-1">Selected Location:</div>
          <div className="font-mono text-gray-600">
            Latitude: {Number(location.lat).toFixed(6)}, Longitude:{" "}
            {Number(location.lng).toFixed(6)}
          </div>
        </div>
      )}
    </div>
  );
}
