"use client";

import { useEffect } from "react";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { NEIGHBORHOOD_COORDINATES } from "@/lib/constants";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const BOSTON_CENTER = { longitude: -71.0589, latitude: 42.3601, zoom: 12 };

export function CrimeMapModal({
  neighborhood,
  onClose,
}: {
  neighborhood?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const initialViewState = neighborhood
    ? NEIGHBORHOOD_COORDINATES[neighborhood] ?? BOSTON_CENTER
    : BOSTON_CENTER;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-4xl h-[75vh] rounded-xl overflow-hidden shadow-2xl bg-gray-900 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
          <h3 className="text-sm font-semibold text-white">
            Crime Map — {neighborhood ?? "Boston"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="h-[calc(100%-49px)]">
          <Map
            key={neighborhood ?? "boston"}
            initialViewState={initialViewState}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            <NavigationControl position="top-right" />
          </Map>
        </div>
      </div>
    </div>
  );
}
