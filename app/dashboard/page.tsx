"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

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
  { label: "Living solo",           value: "single" },
  { label: "Couple / Partner",      value: "partner" },
  { label: "Family with kids",      value: "family" },
  { label: "Retiree / Empty nester", value: "retiree" },
  { label: "Investor",              value: "investor" },
];

// ─────────────────────────────────────────────
// Property preference options (badge selector, max 2)
// ─────────────────────────────────────────────
const PROPERTY_TYPES: string[] = [
  "Condo",
  "Single Family",
  "Multi-Family",
  "Townhouse",
  "New Construction",
  "Fixer-Upper",
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
function AnalysisCard({
  label,
  content,
  variant = "default",
}: {
  label: string;
  content: string;
  variant?: "default" | "verdict";
}) {
  if (variant === "verdict") {
    return (
      <div className="rounded-md bg-blue-50 border border-blue-200 p-4 col-span-1 sm:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-2">
          {label}
        </p>
        <p className="text-sm text-blue-900 leading-relaxed font-medium">{content}</p>
      </div>
    );
  }
  return (
    <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        {label}
      </p>
      <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
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

  // Neighborhood combobox
  const [neighborhoodInput, setNeighborhoodInput] = useState("");
  const [neighborhood, setNeighborhood]           = useState("");
  const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false);
  const neighborhoodRef = useRef<HTMLDivElement>(null);

  // Street combobox
  const [streetInput, setStreetInput]             = useState("");
  const [street, setStreet]                       = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets]       = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetRef = useRef<HTMLDivElement>(null);

  const [zipCode, setZipCode]         = useState("");
  const [householdType, setHouseholdType] = useState("");
  const [propertyPrefs, setPropertyPrefs] = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

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
    if (!neighborhood) return;
    const zips = NEIGHBORHOOD_ZIP_CODES[neighborhood] ?? [];
    if (zips.length === 1) setZipCode(zips[0]);
    else setZipCode("");
  }, [neighborhood]);

  // Debounced street fetch
  useEffect(() => {
    const district = NEIGHBORHOOD_TO_DISTRICT[neighborhood];
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
        setShowStreetDropdown(streets.length > 0);
      } catch {
        setStreetSuggestions([]);
      } finally {
        setLoadingStreets(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [streetInput, neighborhood]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (neighborhoodRef.current && !neighborhoodRef.current.contains(e.target as Node))
        setShowNeighborhoodDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (streetRef.current && !streetRef.current.contains(e.target as Node))
        setShowStreetDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredNeighborhoods = neighborhoodInput.trim()
    ? NEIGHBORHOODS.filter((n) =>
        n.label.toLowerCase().includes(neighborhoodInput.toLowerCase())
      )
    : NEIGHBORHOODS;

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
    if (!neighborhood) { setFormError("Please select a neighborhood from the list."); return; }
    if (!street)       { setFormError("Please select a street from the suggestions."); return; }
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
          neighborhood,
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

      // Reset form
      setNeighborhoodInput(""); setNeighborhood("");
      setStreetInput("");       setStreet("");
      setZipCode("");
      setHouseholdType("");
      setPropertyPrefs([]);

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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-gray-900">Neighborhood Analysis</span>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-blue-600 border-b-2 border-blue-600 pb-0.5"
              >
                Analysis
              </Link>
              <Link
                href="/chat"
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Chat
              </Link>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* Form */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a Search</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 — Location */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              {/* Neighborhood combobox */}
              <div className="relative" ref={neighborhoodRef}>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
                  Neighborhood
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  autoComplete="off"
                  required
                  placeholder="e.g. Back Bay"
                  value={neighborhoodInput}
                  onChange={(e) => {
                    setNeighborhoodInput(e.target.value);
                    setNeighborhood("");
                    setStreetInput(""); setStreet("");
                    setShowNeighborhoodDropdown(true);
                  }}
                  onFocus={() => setShowNeighborhoodDropdown(true)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {showNeighborhoodDropdown && filteredNeighborhoods.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm">
                    {filteredNeighborhoods.map((n) => (
                      <li
                        key={n.label}
                        onMouseDown={() => {
                          setNeighborhoodInput(n.label);
                          setNeighborhood(n.value);
                          setShowNeighborhoodDropdown(false);
                        }}
                        className="cursor-pointer px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                      >
                        {n.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Street combobox */}
              <div className="relative" ref={streetRef}>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Street
                </label>
                <input
                  id="street"
                  type="text"
                  autoComplete="off"
                  required
                  disabled={!neighborhood}
                  placeholder={neighborhood ? "Type to search…" : "Select neighborhood first"}
                  value={streetInput}
                  onChange={(e) => {
                    setStreetInput(e.target.value);
                    setStreet("");
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {showStreetDropdown && (
                  <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm">
                    {loadingStreets ? (
                      <li className="px-3 py-2 text-gray-400">Loading…</li>
                    ) : (
                      streetSuggestions.map((s) => (
                        <li
                          key={s}
                          onMouseDown={() => {
                            setStreetInput(s);
                            setStreet(s);
                            setShowStreetDropdown(false);
                          }}
                          className="cursor-pointer px-3 py-2 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {s}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>

              {/* Zip Code */}
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <select
                  id="zipCode"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={!neighborhood}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {neighborhood ? "Select zip code" : "Select neighborhood first"}
                  </option>
                  {(NEIGHBORHOOD_ZIP_CODES[neighborhood] ?? []).map((zip) => (
                    <option key={zip} value={zip}>{zip}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2 — Buyer profile */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Household type dropdown */}
              <div>
                <label htmlFor="householdType" className="block text-sm font-medium text-gray-700">
                  Household Type <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  id="householdType"
                  value={householdType}
                  onChange={(e) => setHouseholdType(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select household type…</option>
                  {HOUSEHOLD_TYPES.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>

              {/* Property preferences badges */}
              <div>
                <p className="block text-sm font-medium text-gray-700">
                  Property Preferences{" "}
                  <span className="text-gray-400 font-normal">(optional · pick up to 2)</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((p) => {
                    const selected = propertyPrefs.includes(p);
                    const disabled = !selected && propertyPrefs.length >= 2;
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={disabled}
                        onClick={() => togglePropertyPref(p)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selected
                            ? "bg-blue-600 border-blue-600 text-white"
                            : disabled
                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                            : "bg-white border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? "Analyzing…" : "Analyze & Save"}
            </button>
          </form>
        </section>

        {/* Loading state */}
        {submitting && (
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-500 animate-pulse">
              Running neighborhood analysis — this takes about 20–30 seconds…
            </p>
          </section>
        )}

        {/* Analysis Report */}
        {selectedAnalysis && !submitting && (
          <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Analysis Report</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedAnalysis.neighborhood} · {selectedAnalysis.street} · {selectedAnalysis.zip_code}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <AnalysisCard label="311 Service Requests"  content={selectedAnalysis.data.requests_311} />
              <AnalysisCard label="Crime & Safety"        content={selectedAnalysis.data.crime_safety} />
              <AnalysisCard label="Property Mix"          content={selectedAnalysis.data.property_mix} />
              <AnalysisCard label="Building Permits"      content={selectedAnalysis.data.permit_activity} />
              <AnalysisCard label="Entertainment Scene"   content={selectedAnalysis.data.entertainment_scene} />
              <AnalysisCard label="Traffic Safety"        content={selectedAnalysis.data.traffic_safety} />
              <AnalysisCard label="Gun Violence"          content={selectedAnalysis.data.gun_violence} />
              <AnalysisCard label="Green Space"           content={selectedAnalysis.data.green_space} />
              <AnalysisCard label="Overall Verdict"       content={selectedAnalysis.data.overall_verdict} variant="verdict" />
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
                  className={`rounded-lg border p-4 flex items-start justify-between cursor-pointer transition-colors ${
                    selectedSearchId === s.id
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
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
  );
}
