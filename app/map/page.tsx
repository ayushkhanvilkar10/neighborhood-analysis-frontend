"use client";

import Link from "next/link";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Boston city center
const INITIAL_VIEW = {
  longitude: -71.0589,
  latitude:  42.3601,
  zoom:      12,
};

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-gray-900">Neighborhood Analysis</span>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Analysis
              </Link>
              <Link href="/chat" className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Chat
              </Link>
              <Link href="/map" className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5">
                Map
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Map */}
      <div style={{ height: "calc(100vh - 53px)" }}>
        <Map
          initialViewState={INITIAL_VIEW}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />
        </Map>
      </div>
    </div>
  );
}
