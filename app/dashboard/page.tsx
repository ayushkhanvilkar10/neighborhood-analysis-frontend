"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Select } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import CardStatPropertyMix from "@/components/stat-cards-02";
import CardStat311 from "@/components/stat-cards-03";
import Stats03 from "@/components/stats-03";
import Map, { NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
const BOSTON_CENTER = { longitude: -71.0589, latitude: 42.3601, zoom: 12 };

const NEIGHBORHOOD_COORDINATES: Record<string, { latitude: number; longitude: number; zoom: number }> = {
  "Allston":                                        { latitude: 42.3539, longitude: -71.1337, zoom: 14 },
  "Allston / Brighton":                             { latitude: 42.3517, longitude: -71.1500, zoom: 13.5 },
  "Back Bay":                                       { latitude: 42.3503, longitude: -71.0810, zoom: 14.5 },
  "Beacon Hill":                                    { latitude: 42.3588, longitude: -71.0707, zoom: 15 },
  "Brighton":                                       { latitude: 42.3464, longitude: -71.1627, zoom: 14 },
  "Charlestown":                                    { latitude: 42.3782, longitude: -71.0602, zoom: 14.5 },
  "Dorchester":                                     { latitude: 42.3016, longitude: -71.0674, zoom: 13 },
  "Downtown / Financial District":                  { latitude: 42.3555, longitude: -71.0565, zoom: 15 },
  "East Boston":                                    { latitude: 42.3702, longitude: -71.0389, zoom: 14 },
  "Fenway / Kenmore / Audubon Circle / Longwood":   { latitude: 42.3429, longitude: -71.1003, zoom: 14 },
  "Greater Mattapan":                               { latitude: 42.2677, longitude: -71.0934, zoom: 14 },
  "Hyde Park":                                      { latitude: 42.2565, longitude: -71.1245, zoom: 13.5 },
  "Jamaica Plain":                                  { latitude: 42.3098, longitude: -71.1144, zoom: 14 },
  "Mattapan":                                       { latitude: 42.2770, longitude: -71.0912, zoom: 14 },
  "Mission Hill":                                   { latitude: 42.3297, longitude: -71.1060, zoom: 15 },
  "Roslindale":                                     { latitude: 42.2837, longitude: -71.1270, zoom: 14 },
  "Roxbury":                                        { latitude: 42.3152, longitude: -71.0886, zoom: 14 },
  "South Boston":                                   { latitude: 42.3381, longitude: -71.0476, zoom: 14 },
  "South Boston / South Boston Waterfront":         { latitude: 42.3420, longitude: -71.0400, zoom: 13.5 },
  "South End":                                      { latitude: 42.3424, longitude: -71.0713, zoom: 15 },
  "West Roxbury":                                   { latitude: 42.2798, longitude: -71.1581, zoom: 13.5 },
};

// ─────────────────────────────────────────────
// Neighborhood options
// ─────────────────────────────────────────────
const NEIGHBORHOODS: { label: string; value: string }[] = [
  { label: "Allston",                   value: "Allston" },
  { label: "Allston / Brighton",        value: "Allston / Brighton" },
  { label: "Back Bay",                  value: "Back Bay" },
  { label: "Beacon Hill",               value: "Beacon Hill" },
  { label: "Brighton",                  value: "Brighton" },
  { label: "Charlestown",               value: "Charlestown" },
  { label: "Dorchester",                value: "Dorchester" },
  { label: "Downtown",                  value: "Downtown / Financial District" },
  { label: "Financial District",        value: "Downtown / Financial District" },
  { label: "East Boston",               value: "East Boston" },
  { label: "Fenway",                    value: "Fenway / Kenmore / Audubon Circle / Longwood" },
  { label: "Kenmore",                   value: "Fenway / Kenmore / Audubon Circle / Longwood" },
  { label: "Audubon Circle",            value: "Fenway / Kenmore / Audubon Circle / Longwood" },
  { label: "Longwood",                  value: "Fenway / Kenmore / Audubon Circle / Longwood" },
  { label: "Greater Mattapan",          value: "Greater Mattapan" },
  { label: "Hyde Park",                 value: "Hyde Park" },
  { label: "Jamaica Plain",             value: "Jamaica Plain" },
  { label: "Mattapan",                  value: "Mattapan" },
  { label: "Mission Hill",              value: "Mission Hill" },
  { label: "Roslindale",                value: "Roslindale" },
  { label: "Roxbury",                   value: "Roxbury" },
  { label: "South Boston",              value: "South Boston" },
  { label: "South Boston Waterfront",   value: "South Boston / South Boston Waterfront" },
  { label: "South End",                 value: "South End" },
  { label: "West Roxbury",              value: "West Roxbury" },
];

// ─────────────────────────────────────────────
// Household type options (dropdown)
// ─────────────────────────────────────────────
const HOUSEHOLD_TYPES: { label: string; value: string }[] = [
  { label: "Living solo",            value: "Living solo" },
  { label: "Couple / Partner",       value: "Couple / Partner" },
  { label: "Family with kids",       value: "Family with kids" },
  { label: "Retiree / Empty nester", value: "Retiree / Empty nester" },
  { label: "Investor",               value: "Investor" },
];

// ─────────────────────────────────────────────
// Property preference options (badge selector, max 2)
// ─────────────────────────────────────────────
const PROPERTY_TYPES: string[] = [
  "Condo",
  "Single Family",
  "Two / Three Family",
  "Small Apartment",
  "Mid-Size Apartment",
  "Mixed Use",
];

// ─────────────────────────────────────────────
// Neighborhood → BPD District mapping
// ─────────────────────────────────────────────
const NEIGHBORHOOD_TO_DISTRICT: Record<string, string> = {
  "Allston":                                        "D14",
  "Allston / Brighton":                             "D14",
  "Back Bay":                                       "D4",
  "Beacon Hill":                                    "A1",
  "Brighton":                                       "D14",
  "Charlestown":                                    "A15",
  "Dorchester":                                     "C11",
  "Downtown / Financial District":                  "A1",
  "East Boston":                                    "A7",
  "Fenway / Kenmore / Audubon Circle / Longwood":   "D4",
  "Greater Mattapan":                               "B3",
  "Hyde Park":                                      "E18",
  "Jamaica Plain":                                  "E13",
  "Mattapan":                                       "B3",
  "Mission Hill":                                   "E13",
  "Roslindale":                                     "E13",
  "Roxbury":                                        "B2",
  "South Boston":                                   "C6",
  "South Boston / South Boston Waterfront":         "C6",
  "South End":                                      "D4",
  "West Roxbury":                                   "E5",
};

// ─────────────────────────────────────────────
// Neighborhood → Zip Code mapping
// ─────────────────────────────────────────────
const NEIGHBORHOOD_ZIP_CODES: Record<string, string[]> = {
  "Allston":                                        ["02134"],
  "Allston / Brighton":                             ["02134", "02135"],
  "Back Bay":                                       ["02116", "02199"],
  "Beacon Hill":                                    ["02108", "02114"],
  "Brighton":                                       ["02135"],
  "Charlestown":                                    ["02129"],
  "Dorchester":                                     ["02121", "02122", "02124", "02125"],
  "Downtown / Financial District":                  ["02109", "02110", "02113", "02201"],
  "East Boston":                                    ["02128"],
  "Fenway / Kenmore / Audubon Circle / Longwood":   ["02115", "02215"],
  "Greater Mattapan":                               ["02126"],
  "Hyde Park":                                      ["02136", "02137"],
  "Jamaica Plain":                                  ["02130"],
  "Mattapan":                                       ["02126"],
  "Mission Hill":                                   ["02120"],
  "Roslindale":                                     ["02131"],
  "Roxbury":                                        ["02119"],
  "South Boston":                                   ["02127"],
  "South Boston / South Boston Waterfront":         ["02127", "02210"],
  "South End":                                      ["02111", "02118"],
  "West Roxbury":                                   ["02132"],
};

const BOSTON_API    = "https://data.boston.gov/api/3/action/datastore_search_sql";
const CRIME_DATASET = "b973d8cb-eeb2-4e7e-99da-c92938efc9c0";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface RawStatEntry {
  section: string;
  data:    Record<string, number> | { type?: string; offense?: string; count: number }[];
  total?:  number;
}

interface NeighborhoodTiers {
  crime:          "High" | "Moderate" | "Low";
  complaints_311: "High" | "Moderate" | "Low";
}

interface AnalysisData {
  requests_311:        string;
  crime_safety:        string;
  property_mix:        string;
  permit_activity:     string;
  entertainment_scene: string;
  traffic_safety:      string;
  gun_violence:        string;
  green_space:         string;
  overall_verdict:     string;
  raw_stats:           RawStatEntry[];
  neighborhood_tiers:  NeighborhoodTiers | null;
}

interface Search {
  id:           string;
  neighborhood: string;
  street:       string;
  zip_code:     string;
  created_at:   string;
  analysis:     AnalysisData | null;
}

interface SelectedAnalysis {
  data:         AnalysisData;
  neighborhood: string;
  street:       string;
  zip_code:     string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(session: Session) {
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

// ─────────────────────────────────────────────
// Analysis card component
// ─────────────────────────────────────────────
const SERIOUS_CRIME_TYPES = new Set([
  "ASSAULT - AGGRAVATED",
  "THREATS TO DO BODILY HARM",
  "ROBBERY",
  "DRUGS - POSSESSION/ SALE/ MANUFACTURING/ USE",
  "BURGLARY - RESIDENTIAL",
]);

const SERIOUS_311_TYPES = new Set([
  "CE Collection",
  "Needle Pickup",
  "Encampments",
  "Heat - Excessive  Insufficient",
  "Unsatisfactory Living Conditions",
]);

function formatFlagSentence(
  items: { label: string; count: number }[],
  kind: "crime" | "311"
): string {
  const active = items.filter(i => i.count > 0);
  if (active.length === 0) return "";
  const parts = active.map(i => `${i.count.toLocaleString()} ${i.label}`);
  const list =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
      ? `${parts[0]} and ${parts[1]}`
      : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
  return kind === "311"
    ? `${list} requests in 2026`
    : `${list} incidents on this street`;
}

function FlagBadge({
  items,
  kind,
}: {
  items: { label: string; count: number }[];
  kind: "crime" | "311";
}) {
  const sentence = formatFlagSentence(items, kind);
  if (!sentence) return null;
  return (
    <span className="text-xs text-red-600 font-normal">
      {sentence}
    </span>
  );
}

function AnalysisCard({
  label,
  content,
  flagItems,
  flagKind,
  variant = "default",
}: {
  label: string;
  content: string;
  flagItems?: { label: string; count: number }[];
  flagKind?: "crime" | "311";
  variant?: "default" | "verdict";
}) {
  if (variant === "verdict") {
    return (
      <div className="rounded-xl bg-[#F5ECD8] border border-[#7B8DC5]/20 backdrop-blur-md p-4 col-span-1 sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          {label}
        </p>
        <p className="text-sm/6 text-gray-900 font-medium">{content}</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-white/10 border border-[#7B8DC5]/20 backdrop-blur-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
      </div>
      <p className="text-sm/6 text-gray-800 leading-relaxed font-medium">{content}</p>
      {flagItems && flagKind && (
        <p className="mt-3 text-xs text-red-600 border-t border-[#7B8DC5]/20 pt-2">
          {formatFlagSentence(flagItems, flagKind)}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Dashboard page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession]                 = useState<Session | null>(null);
  const [searches, setSearches]               = useState<Search[]>([]);
  const [loadingSearches, setLoadingSearches] = useState(true);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SelectedAnalysis | null>(null);

  // Neighborhood listbox
  const [neighborhood, setNeighborhood] = useState<{ label: string; value: string } | null>(null);

  // Street combobox
  const [streetInput, setStreetInput]             = useState("");
  const [street, setStreet]                       = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets]       = useState(false);

  const [zipCode, setZipCode]         = useState("");
  const [householdType, setHouseholdType] = useState("");
  const [propertyPrefs, setPropertyPrefs] = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [mapOpen, setMapOpen]         = useState(false);

  // Prevents auto-save from firing while we load preferences from the API
  const prefsLoaded = useRef(false);

  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMapOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mapOpen]);

  // Toggle a property preference badge (max 2)
  function togglePropertyPref(p: string) {
    setPropertyPrefs((prev) =>
      prev.includes(p)
        ? prev.filter((x) => x !== p)
        : prev.length < 2
        ? [...prev, p]
        : prev
    );
  }

  // Auto-populate zip when neighborhood has only one option
  useEffect(() => {
    if (!neighborhood?.value) return;
    const zips = NEIGHBORHOOD_ZIP_CODES[neighborhood.value] ?? [];
    if (zips.length === 1) setZipCode(zips[0]);
    else setZipCode("");
  }, [neighborhood]);

  // Debounced street fetch
  useEffect(() => {
    const district = neighborhood?.value ? NEIGHBORHOOD_TO_DISTRICT[neighborhood.value] : undefined;
    if (!district || streetInput.trim().length < 2) {
      setStreetSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingStreets(true);
      try {
        const sql = `SELECT DISTINCT "STREET" FROM "${CRIME_DATASET}" WHERE "DISTRICT" = '${district}' AND "STREET" ILIKE '${streetInput.trim().toUpperCase()}%' ORDER BY "STREET" LIMIT 20`;
        const res  = await fetch(`${BOSTON_API}?sql=${encodeURIComponent(sql)}`);
        const data = await res.json();
        const streets: string[] = (data.result?.records ?? [])
          .map((r: { STREET: string }) => r.STREET)
          .filter(Boolean);
        setStreetSuggestions(streets);
      } catch {
        setStreetSuggestions([]);
      } finally {
        setLoadingStreets(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [streetInput, neighborhood]);


  // ─────────────────────────────────────────────
  // Preferences: fetch on load, auto-save on change
  // ─────────────────────────────────────────────

  async function fetchPreferences(s: Session) {
    try {
      const res = await fetch(`${API_URL}/preferences`, { headers: authHeaders(s) });
      if (!res.ok) return;
      const data = await res.json();
      if (data.household_type)       setHouseholdType(data.household_type);
      if (data.property_preferences?.length) setPropertyPrefs(data.property_preferences);
    } catch { /* silently ignore */ }
    finally { prefsLoaded.current = true; }
  }

  async function savePreferences(s: Session, ht: string, pp: string[]) {
    try {
      await fetch(`${API_URL}/preferences`, {
        method: "PUT",
        headers: authHeaders(s),
        body: JSON.stringify({
          household_type: ht || null,
          property_preferences: pp.length > 0 ? pp : null,
        }),
      });
    } catch { /* silently ignore */ }
  }

  // Auto-save when household type changes
  useEffect(() => {
    if (!prefsLoaded.current || !session) return;
    savePreferences(session, householdType, propertyPrefs);
  }, [householdType]);

  // Auto-save when property preferences change
  useEffect(() => {
    if (!prefsLoaded.current || !session) return;
    savePreferences(session, householdType, propertyPrefs);
  }, [propertyPrefs]);


  // Auto-select the most recent search with analysis on load
  function autoSelectMostRecent(list: Search[]) {
    const first = list.find((s) => s.analysis !== null);
    if (first) {
      setSelectedSearchId(first.id);
      setSelectedAnalysis({
        data:         first.analysis!,
        neighborhood: first.neighborhood,
        street:       first.street,
        zip_code:     first.zip_code,
      });
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setSession(session);
      fetchSearches(session, true);
      fetchPreferences(session);
    });
  }, [router]);

  async function fetchSearches(s: Session, autoSelect = false) {
    setLoadingSearches(true);
    try {
      const res = await fetch(`${API_URL}/searches`, { headers: authHeaders(s) });
      if (!res.ok) throw new Error();
      const list: Search[] = await res.json();
      setSearches(list);
      if (autoSelect) autoSelectMostRecent(list);
    } catch { setSearches([]); }
    finally { setLoadingSearches(false); }
  }

  function handleCardClick(s: Search) {
    setSelectedSearchId(s.id);
    if (s.analysis) {
      setSelectedAnalysis({
        data:         s.analysis,
        neighborhood: s.neighborhood,
        street:       s.street,
        zip_code:     s.zip_code,
      });
    } else {
      setSelectedAnalysis(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (!neighborhood?.value) { setFormError("Please select a neighborhood from the list."); return; }
    if (!street)               { setFormError("Please select a street from the suggestions."); return; }
    setFormError(null);

    // Clear analysis panel while agent runs
    setSelectedAnalysis(null);
    setSelectedSearchId(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/searches`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify({
          neighborhood: neighborhood!.value,
          street,
          zip_code: zipCode,
          ...(householdType && { household_type: householdType }),
          ...(propertyPrefs.length > 0 && { property_preferences: propertyPrefs }),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? "Failed to save search");
      }

      // Reset location fields only — preferences persist
      setNeighborhood(null);
      setStreetInput("");       setStreet("");
      setZipCode("");

      // Refresh list — auto-select the newest (index 0 after DESC sort)
      await fetchSearches(session, true);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/searches/${id}`, {
        method: "DELETE", headers: authHeaders(session),
      });
      if (!res.ok) throw new Error();
      const updated = searches.filter((s) => s.id !== id);
      setSearches(updated);
      // If the deleted card was selected, auto-select next most recent
      if (selectedSearchId === id) {
        setSelectedAnalysis(null);
        setSelectedSearchId(null);
        const next = updated.find((s) => s.analysis !== null);
        if (next) {
          setSelectedSearchId(next.id);
          setSelectedAnalysis({
            data:         next.analysis!,
            neighborhood: next.neighborhood,
            street:       next.street,
            zip_code:     next.zip_code,
          });
        }
      }
    } catch { /* silently ignore */ }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <>
    <div
      className={`min-h-screen transition-[filter] duration-300 ${mapOpen ? "blur-sm pointer-events-none select-none" : ""}`}
      style={{
        backgroundImage: "url('/images/Linear_Blur_Background_Blue_minimal.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* Form */}
        <section>
          <div className="w-full rounded-xl bg-[#F5ECD8] border border-[#7B8DC5]/20 backdrop-blur-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Neighborhood</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Row 1 — Neighborhood */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Listbox
                  value={neighborhood}
                  onChange={(n) => {
                    setNeighborhood(n);
                    setStreetInput(""); setStreet("");
                  }}
                >
                  <div className="relative">
                    <Label className="block text-sm/6 font-medium text-gray-700">Neighborhood</Label>
                    <ListboxButton className="mt-1 flex w-full items-center justify-between rounded-lg border border-[#5A73B5]/40 bg-white/10 px-3 py-1.5 text-sm/6 shadow-sm backdrop-blur-sm focus:outline-2 focus:-outline-offset-2 focus:outline-[#3A5AA5]/40">
                      <span className={neighborhood ? "text-gray-900" : "text-[#5A73B5]/60"}>
                        {neighborhood?.label ?? "e.g. Back Bay"}
                      </span>
                      <ChevronDown className="size-4 text-[#5A73B5]/60 shrink-0" aria-hidden="true" />
                    </ListboxButton>
                    <ListboxOptions
                      anchor="bottom"
                      transition
                      className="z-40 w-(--input-width) rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl p-1 [--anchor-gap:--spacing(1)] empty:invisible transition duration-100 ease-in data-leave:data-closed:opacity-0 shadow-lg max-h-56 overflow-auto"
                    >
                      {NEIGHBORHOODS.map((n) => (
                        <ListboxOption
                          key={n.label}
                          value={n}
                          className="group flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-sm/6 text-gray-900 data-[focus]:bg-white/20"
                        >
                          {n.label}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>

              {/* Row 2 — Street & Zip Code */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Combobox
                  value={street}
                  onChange={(val: string | null) => {
                    setStreet(val ?? "");
                    setStreetInput(val ?? "");
                  }}
                  onClose={() => setStreetInput(street)}
                  disabled={!neighborhood}
                >
                  <div className="relative">
                    <label htmlFor="street" className="block text-sm/6 font-medium text-gray-700">
                      Street
                    </label>
                    <ComboboxInput
                      id="street"
                      autoComplete="off"
                      placeholder={neighborhood?.value ? "Type to search…" : "Select neighborhood first"}
                      displayValue={(val: string) => val}
                      onChange={(e) => {
                        setStreetInput(e.target.value);
                        setStreet("");
                      }}
                      className="mt-1 block w-full rounded-lg border border-[#5A73B5]/40 bg-white/10 px-3 py-1.5 text-sm/6 text-gray-900 placeholder:text-[#5A73B5]/60 shadow-sm backdrop-blur-sm focus:outline-2 focus:-outline-offset-2 focus:outline-[#3A5AA5]/40 disabled:border-[#A2A9D4]/30 disabled:cursor-not-allowed"
                    />
                    <ComboboxOptions
                      anchor="bottom"
                      transition
                      className="z-40 w-(--input-width) rounded-xl border border-white/10 bg-white/10 backdrop-blur-xl p-1 [--anchor-gap:--spacing(1)] empty:invisible transition duration-100 ease-in data-leave:data-closed:opacity-0 shadow-lg"
                    >
                      {streetInput.trim().length < 2 ? null : loadingStreets ? (
                        <div className="px-3 py-1.5 text-sm/6 text-gray-500">Loading…</div>
                      ) : streetSuggestions.length === 0 ? (
                        <div className="px-3 py-1.5 text-sm/6 text-gray-500">No streets found</div>
                      ) : (
                        streetSuggestions.map((s) => (
                          <ComboboxOption
                            key={s}
                            value={s}
                            className="group flex cursor-default select-none items-center rounded-lg px-3 py-1.5 text-sm/6 text-gray-900 data-[focus]:bg-white/20"
                          >
                            {s}
                          </ComboboxOption>
                        ))
                      )}
                    </ComboboxOptions>
                  </div>
                </Combobox>

                <Field disabled={!neighborhood?.value}>
                  <Label className="block text-sm/6 font-medium text-gray-700">Zip Code</Label>
                  <div className="relative mt-1">
                    <Select
                      id="zipCode"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-[#5A73B5]/40 bg-white/10 px-3 py-1.5 text-sm/6 text-gray-900 shadow-sm backdrop-blur-sm focus:outline-2 focus:-outline-offset-2 focus:outline-[#3A5AA5]/40 disabled:border-[#A2A9D4]/30 disabled:cursor-not-allowed *:text-black"
                    >
                      <option value="">
                        {neighborhood?.value ? "Select zip code" : "Select neighborhood first"}
                      </option>
                      {(NEIGHBORHOOD_ZIP_CODES[neighborhood?.value ?? ""] ?? []).map((zip) => (
                        <option key={zip} value={zip}>{zip}</option>
                      ))}
                    </Select>
                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 text-[#5A73B5]/60" aria-hidden="true" />
                  </div>
                </Field>
              </div>

              {/* Row 2 — Buyer profile */}
              <div className="grid grid-cols-1 gap-4 sm:mt-8">

                {/* Household type dropdown */}
                <Field className="sm:max-w-xs">
                  <Label className="block text-sm/6 font-medium text-gray-700">
                    Household Type <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  <div className="relative mt-1">
                    <Select
                      id="householdType"
                      value={householdType}
                      onChange={(e) => setHouseholdType(e.target.value)}
                      className="block w-full appearance-none rounded-lg border border-[#5A73B5]/40 bg-white/10 px-3 py-1.5 text-sm/6 text-gray-900 shadow-sm backdrop-blur-sm focus:outline-2 focus:-outline-offset-2 focus:outline-[#3A5AA5]/40 *:text-black"
                    >
                      <option value="">Select household type…</option>
                      {HOUSEHOLD_TYPES.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                      ))}
                    </Select>
                    <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 text-[#5A73B5]/60" aria-hidden="true" />
                  </div>
                </Field>

                {/* Property preferences badges */}
                <div className="sm:mt-4">
                  <p className="block text-sm font-medium text-gray-700">
                    Property Preferences{" "}
                    <span className="font-normal">(optional · pick up to 2)</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((p) => {
                      const selected = propertyPrefs.includes(p);
                      const disabled = !selected && propertyPrefs.length >= 2;
                      return (
                        <ShadcnButton
                          key={p}
                          type="button"
                          disabled={disabled}
                          onClick={() => togglePropertyPref(p)}
                          size="sm"
                          variant="outline"
                          className={cn(
                            "rounded-full border backdrop-blur-sm transition-colors",
                            selected
                              ? "bg-[#3A5AA5]/10 border-[#3A5AA5]/80 text-gray-900 hover:bg-[#3A5AA5]/20"
                              : "bg-white/10 border-[#5A73B5]/40 text-gray-700 hover:bg-white/20 hover:border-[#5A73B5]/60"
                          )}
                        >
                          {p}
                        </ShadcnButton>
                      );
                    })}
                  </div>
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg border border-[#5A73B5]/40 bg-white/10 px-4 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm backdrop-blur-sm focus:not-data-focus:outline-none data-focus:outline-2 data-focus:outline-white/25 data-hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Analyzing…" : "Analyze & Save"}
              </Button>
            </form>
          </div>
        </section>

        {/* Loading state */}
        {submitting && (
          <section>
            <div className="w-full rounded-xl bg-white/10 border border-[#7B8DC5]/20 backdrop-blur-2xl p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Spinner />
                  <p className="text-sm text-gray-500">
                    Running neighborhood analysis — this takes about 20–30 seconds…
                  </p>
                </div>

                {/* Table skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                </div>

                {/* Text skeleton */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2 rounded-lg border border-white/30 p-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Analysis Report */}
        {selectedAnalysis && !submitting && (
          <section>
            <div className="w-full rounded-xl bg-white/10 border border-[#7B8DC5]/20 backdrop-blur-2xl p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Analysis Report</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAnalysis.neighborhood} · {selectedAnalysis.street} · {selectedAnalysis.zip_code}
                  </p>
                </div>

                <AnalysisCard label="Overall Verdict"       content={selectedAnalysis.data.overall_verdict} variant="verdict" />

                {(() => {
                  const crimeStat = selectedAnalysis.data.raw_stats?.find(
                    (s) => s.section === "crime_safety"
                  );
                  if (!crimeStat || !Array.isArray(crimeStat.data)) return null;
                  return (
                    <Stats03
                      data={crimeStat.data as { offense: string; count: number }[]}
                      seriousTypes={SERIOUS_CRIME_TYPES}
                    />
                  );
                })()}

                <Button
                  type="button"
                  onClick={() => setMapOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#5A73B5]/40 bg-[#F5ECD8] px-4 py-1.5 text-sm/6 font-semibold text-gray-900 shadow-sm backdrop-blur-sm focus:not-data-focus:outline-none data-focus:outline-2 data-focus:outline-white/25 data-hover:bg-[#F5ECD8]/80 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                  </svg>
                  View Crime Map
                </Button>

                <div className="flex flex-col md:flex-row gap-4">
                  {(() => {
                    const statsProp = selectedAnalysis.data.raw_stats?.find(
                      (s) => s.section === "property_mix"
                    );
                    if (!statsProp || Array.isArray(statsProp.data)) return null;
                    return (
                      <CardStatPropertyMix
                        data={statsProp.data as Record<string, number>}
                        total={statsProp.total ?? 0}
                      />
                    );
                  })()}
                  {(() => {
                    const stats311 = selectedAnalysis.data.raw_stats?.find(
                      (s) => s.section === "requests_311"
                    );
                    if (!stats311 || !Array.isArray(stats311.data)) return null;
                    return (
                      <CardStat311
                        data={stats311.data as { type: string; count: number }[]}
                        total={stats311.total ?? 0}
                        seriousTypes={SERIOUS_311_TYPES}
                      />
                    );
                  })()}
                </div>

                {(() => {
                  const crimeFlagItems = (() => {
                    const stat = selectedAnalysis.data.raw_stats?.find(s => s.section === "crime_safety");
                    if (!stat || !Array.isArray(stat.data)) return [];
                    const rows = stat.data as { offense: string; count: number }[];
                    return [...SERIOUS_CRIME_TYPES].map(type => ({
                      label: type
                        .replace("ASSAULT - AGGRAVATED", "Aggravated Assault")
                        .replace("THREATS TO DO BODILY HARM", "Threats to Do Bodily Harm")
                        .replace("ROBBERY", "Robbery")
                        .replace("DRUGS - POSSESSION/ SALE/ MANUFACTURING/ USE", "Drug Offenses")
                        .replace("BURGLARY - RESIDENTIAL", "Residential Burglary"),
                      count: rows.find(r => r.offense === type)?.count ?? 0,
                    })).filter(i => i.count > 0);
                  })();
                  const flag311Items = (() => {
                    const stat = selectedAnalysis.data.raw_stats?.find(s => s.section === "requests_311");
                    if (!stat || !Array.isArray(stat.data)) return [];
                    const rows = stat.data as { type: string; count: number }[];
                    return [...SERIOUS_311_TYPES].map(type => ({
                      label: type,
                      count: rows.find(r => r.type === type)?.count ?? 0,
                    })).filter(i => i.count > 0);
                  })();
                  return (
                    <div className="grid grid-cols-1 gap-4">
                      <AnalysisCard label="Crime & Safety"        content={selectedAnalysis.data.crime_safety}  flagItems={crimeFlagItems} flagKind="crime" />
                      <AnalysisCard label="311 Service Requests"  content={selectedAnalysis.data.requests_311}  flagItems={flag311Items}  flagKind="311" />
                      <AnalysisCard label="Gun Violence"          content={selectedAnalysis.data.gun_violence} />
                      <AnalysisCard label="Property Mix"          content={selectedAnalysis.data.property_mix} />
                      <AnalysisCard label="Traffic Safety"        content={selectedAnalysis.data.traffic_safety} />
                      <AnalysisCard label="Building Permits"      content={selectedAnalysis.data.permit_activity} />
                      <AnalysisCard label="Entertainment Scene"   content={selectedAnalysis.data.entertainment_scene} />
                      <AnalysisCard label="Green Space"           content={selectedAnalysis.data.green_space} />
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Saved Searches */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Searches</h2>
          {loadingSearches ? (
            <p className="text-sm text-gray-500">Loading searches…</p>
          ) : searches.length === 0 ? (
            <p className="text-sm text-gray-500">No saved searches yet. Add one above.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {searches.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleCardClick(s)}
                  className={`rounded-lg border p-4 flex items-start justify-between cursor-pointer transition-colors backdrop-blur-md ${
                    selectedSearchId === s.id
                      ? "bg-[#3A5AA5]/10 border-[#3A5AA5]/80"
                      : "bg-white/60 border-white/40 hover:bg-white/80"
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.neighborhood}</p>
                    <p className="text-sm text-gray-600">{s.street}</p>
                    <p className="text-sm text-gray-600">{s.zip_code}</p>
                    {!s.analysis && (
                      <p className="text-xs text-gray-400 mt-1">No analysis available</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>

    {/* Crime Map Modal */}
    {mapOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setMapOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative w-full max-w-4xl h-[75vh] rounded-xl overflow-hidden shadow-2xl bg-gray-900 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">
              Crime Map — {selectedAnalysis?.neighborhood ?? "Boston"}
            </h3>
            <button
              onClick={() => setMapOpen(false)}
              className="rounded-md p-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100%-49px)]">
            <Map
              key={selectedAnalysis?.neighborhood ?? "boston"}
              initialViewState={
                selectedAnalysis
                  ? NEIGHBORHOOD_COORDINATES[selectedAnalysis.neighborhood] ?? BOSTON_CENTER  // selectedAnalysis.neighborhood is already a string value
                  : BOSTON_CENTER
              }
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              <NavigationControl position="top-right" />
            </Map>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
