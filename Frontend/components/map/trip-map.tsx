"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";

import { buildHaversineDayRoute } from "@/lib/maps/haversine-route";
import { collectVisibleMapMarkers } from "@/lib/maps/markers";
import type { RouteWarning } from "@/lib/maps/validate-route";
import { cn } from "@/lib/utils";
import type { Currency, ItineraryDay } from "@/types/trip";

import "leaflet/dist/leaflet.css";

type TripMapProps = {
  destination: string;
  days: ItineraryDay[];
  selectedDay: number | "all";
  currency: Currency;
  warnings?: RouteWarning[];
  className?: string;
};

function numberedIcon(order: number, approximate: boolean) {
  return L.divIcon({
    className: "tripmind-map-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
    html: `<div style="
      width:30px;height:30px;border-radius:9999px;
      display:flex;align-items:center;justify-content:center;
      background:${approximate ? "oklch(0.72 0.08 75)" : "oklch(0.45 0.08 220)"};
      color:white;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;
      border:2px solid white;box-shadow:0 2px 10px rgba(15,23,42,0.22);
    ">${order}</div>`,
  });
}

function FitBounds({
  pointsKey,
  points,
}: {
  pointsKey: string;
  points: Array<{ lat: number; lng: number }>;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0]!.lat, points[0]!.lng], 13);
      return;
    }
    const bounds = L.latLngBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    // pointsKey is the stable dependency; points is derived from the same source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointsKey]);

  return null;
}

function formatMoney(amount: number, currency: Currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function TripMap({
  destination,
  days,
  selectedDay,
  currency,
  warnings = [],
  className,
}: TripMapProps) {
  // Avoid react-leaflet "Map container is already initialized" under Strict Mode / SSR.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const markers = useMemo(
    () => collectVisibleMapMarkers(days, selectedDay),
    [days, selectedDay],
  );

  const mapPoints = useMemo(
    () =>
      markers.map((marker) => ({
        lat: marker.latitude,
        lng: marker.longitude,
      })),
    [markers],
  );

  const pointsKey = useMemo(
    () =>
      mapPoints
        .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
        .join("|"),
    [mapPoints],
  );

  const route = useMemo(() => {
    if (selectedDay === "all") return null;
    if (mapPoints.length < 2) return null;
    return buildHaversineDayRoute(mapPoints);
  }, [mapPoints, selectedDay]);

  const openStreetMapUrl = useMemo(() => {
    if (markers.length === 0) {
      return "https://www.openstreetmap.org/";
    }
    const lat =
      markers.reduce((sum, marker) => sum + marker.latitude, 0) /
      markers.length;
    const lng =
      markers.reduce((sum, marker) => sum + marker.longitude, 0) /
      markers.length;
    if (markers.length >= 2) {
      const routeParam = markers
        .map((marker) => `${marker.latitude},${marker.longitude}`)
        .join(";");
      return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${routeParam}#map=13/${lat}/${lng}`;
    }
    return `https://www.openstreetmap.org/#map=14/${lat}/${lng}`;
  }, [markers]);

  const dayWarnings = useMemo(
    () =>
      warnings.filter(
        (warning) =>
          selectedDay === "all" || warning.day_number === selectedDay,
      ),
    [warnings, selectedDay],
  );

  const center = useMemo((): [number, number] => {
    if (markers.length === 0) return [0, 0];
    return [
      markers.reduce((sum, m) => sum + m.latitude, 0) / markers.length,
      markers.reduce((sum, m) => sum + m.longitude, 0) / markers.length,
    ];
  }, [markers]);

  if (markers.length === 0) {
    return (
      <div
        className={cn(
          "surface-card relative flex min-h-72 items-center justify-center overflow-hidden p-6",
          className,
        )}
        role="status"
      >
        <div className="max-w-xs text-center">
          <div className="bg-secondary text-brand mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl">
            <MapPin className="size-5" aria-hidden />
          </div>
          <p className="text-foreground text-sm font-medium tracking-tight">
            Map not available yet
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            We couldn&apos;t place exact stops for{" "}
            {selectedDay === "all" ? destination : `day ${selectedDay}`} on the
            map. Your itinerary is still ready to use.
          </p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          "surface-card flex min-h-72 flex-col items-center justify-center gap-3 p-6",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <div className="bg-secondary/80 h-2 w-32 animate-pulse rounded-full" />
        <p className="text-muted-foreground text-sm">
          Loading your trip map…
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "surface-card relative min-h-72 overflow-hidden p-0",
        className,
      )}
    >
      <MapContainer
        key={`trip-map-${selectedDay}-${pointsKey}`}
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="z-0 h-80 w-full"
        aria-label={`Map of ${destination}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pointsKey={pointsKey} points={mapPoints} />
        {route ? (
          <Polyline
            positions={route.polyline.map((point) => [point.lat, point.lng])}
            pathOptions={{
              color: "oklch(0.45 0.08 220)",
              weight: 4,
              opacity: 0.75,
              dashArray: "8 10",
            }}
          />
        ) : null}
        {markers.map((marker) => {
          const approximate = marker.confidence === "approximate";
          return (
            <Marker
              key={`${marker.dayNumber}-${marker.order}-${marker.title}`}
              position={[marker.latitude, marker.longitude]}
              icon={numberedIcon(marker.order, approximate)}
            >
              <Popup>
                <div className="min-w-[11rem] space-y-1.5 text-sm">
                  <p className="text-[10px] font-medium tracking-[0.14em] text-slate-500 uppercase">
                    {marker.time}
                  </p>
                  <p className="font-medium text-slate-900">{marker.title}</p>
                  <p className="text-slate-600">{marker.location}</p>
                  <p className="font-medium text-slate-800">
                    {formatMoney(marker.estimatedCost, currency)}
                  </p>
                  <p className="text-[10px] tracking-wide text-slate-500 uppercase">
                    {approximate
                      ? "Approximate neighborhood"
                      : "Verified location"}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {markers
          .filter((marker) => marker.confidence === "approximate")
          .map((marker) => (
            <CircleMarker
              key={`approx-${marker.dayNumber}-${marker.order}`}
              center={[marker.latitude, marker.longitude]}
              radius={18}
              pathOptions={{
                color: "oklch(0.72 0.08 75)",
                fillColor: "oklch(0.72 0.08 75)",
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
          ))}
      </MapContainer>

      <div className="absolute inset-x-0 bottom-0 z-[500] p-3">
        <div className="border-border/60 bg-card/95 space-y-2 rounded-2xl border px-3 py-2.5 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-foreground text-sm font-medium tracking-tight">
                {selectedDay === "all"
                  ? destination
                  : `Day ${selectedDay} route`}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {route
                  ? `~${route.total_distance_km.toFixed(1)} km · ~${route.total_duration_minutes} min local travel (approx.)`
                  : `${markers.length} mapped stop${markers.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <a
              href={openStreetMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-brand hover:bg-secondary/80 focus-visible:ring-ring/50 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase transition outline-none focus-visible:ring-3"
              aria-label="Open this route in OpenStreetMap"
            >
              OpenStreetMap
            </a>
          </div>
          {dayWarnings.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {dayWarnings.slice(0, 3).map((warning) => (
                <span
                  key={`${warning.code}-${warning.day_number}-${warning.message}`}
                  className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900 ring-1 ring-amber-200/80"
                >
                  {warning.message}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
