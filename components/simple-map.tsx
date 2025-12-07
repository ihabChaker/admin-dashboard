"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapPoint {
  lat: number;
  lon: number;
  label?: string;
  type?: "start" | "end" | "poi";
}

interface SimpleMapProps {
  startPoint: { lat: number; lon: number };
  endPoint?: { lat: number; lon: number };
  geoJson?: string;
  points?: MapPoint[];
  className?: string;
}

export function SimpleMap({
  startPoint,
  endPoint,
  geoJson,
  points = [],
  className,
}: SimpleMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const updateError = useCallback((newError: string | null) => {
    setError((prev) => (prev === newError ? prev : newError));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate bounds
      const allPoints = [
        startPoint,
        ...(endPoint ? [endPoint] : []),
        ...points.map((p) => ({ lat: p.lat, lon: p.lon })),
      ];

      // Parse GeoJSON if available
      let geoJsonPoints: { lat: number; lon: number }[] = [];
      if (geoJson) {
        try {
          const parsed = JSON.parse(geoJson);
          if (parsed.type === "LineString" && parsed.coordinates) {
            geoJsonPoints = parsed.coordinates.map(
              (coord: [number, number]) => ({
                lon: coord[0],
                lat: coord[1],
              })
            );
            allPoints.push(...geoJsonPoints);
          }
        } catch (e) {
          console.error("Failed to parse GeoJSON:", e);
        }
      }

      if (allPoints.length === 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        updateError("No points to display");
        return;
      }

      const lats = allPoints.map((p) => p.lat);
      const lons = allPoints.map((p) => p.lon);

      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      const padding = 0.1;
      const latRange = maxLat - minLat || 0.01;
      const lonRange = maxLon - minLon || 0.01;

      // Convert lat/lon to canvas coordinates
      const toCanvas = (lat: number, lon: number) => {
        const x =
          ((lon - minLon + padding * lonRange) /
            (lonRange * (1 + 2 * padding))) *
          canvas.width;
        const y =
          canvas.height -
          ((lat - minLat + padding * latRange) /
            (latRange * (1 + 2 * padding))) *
            canvas.height;
        return { x, y };
      };

      // Draw background
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw GeoJSON path
      if (geoJsonPoints.length > 1) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.beginPath();

        const first = toCanvas(geoJsonPoints[0].lat, geoJsonPoints[0].lon);
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < geoJsonPoints.length; i++) {
          const point = toCanvas(geoJsonPoints[i].lat, geoJsonPoints[i].lon);
          ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
      } else if (endPoint) {
        // Draw straight line from start to end
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.beginPath();
        const start = toCanvas(startPoint.lat, startPoint.lon);
        const end = toCanvas(endPoint.lat, endPoint.lon);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }

      // Draw start point
      const startCanvas = toCanvas(startPoint.lat, startPoint.lon);
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(startCanvas.x, startCanvas.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw end point
      if (endPoint) {
        const endCanvas = toCanvas(endPoint.lat, endPoint.lon);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(endCanvas.x, endCanvas.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw additional points (POIs)
      points.forEach((point) => {
        const canvas = toCanvas(point.lat, point.lon);
        ctx.fillStyle =
          point.type === "start"
            ? "#22c55e"
            : point.type === "end"
            ? "#ef4444"
            : "#f59e0b";
        ctx.beginPath();
        ctx.arc(canvas.x, canvas.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // eslint-disable-next-line react-hooks/set-state-in-effect
      updateError(null);
    } catch (err) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      updateError("Failed to render map");
      console.error("Map render error:", err);
    }
  }, [startPoint, endPoint, geoJson, points, updateError]);

  if (error) {
    return (
      <div className={className}>
        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-auto border border-gray-200 rounded-lg"
      />
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
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>POIs ({points.length})</span>
          </div>
        )}
      </div>
    </div>
  );
}
