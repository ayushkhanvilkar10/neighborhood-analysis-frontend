"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// Neighborhood options
// Multi-neighborhood values (joined by " / ") are split into individual labels
// but each maps back to the original canonical value that the backend expects.
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
// Neighborhood → BPD District mapping
// Mirrors the mapping in agent/neighborhood_analysis.py
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
// Outliers excluded: 02026, 02133, 02146, 02219, 02445, 02446, 02458, 02467
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

const BOSTON_API = "https://data.boston.gov/api/3/action/datastore_search_sql";
const CRIME_DATASET = "b973d8cb-eeb2-4e7e-99da-c92938efc9c0";

interface Search {
  id: string;
  neighborhood: string;
  street: string;
  zip_code: string;
  created_at: string;
}

interface Analysis {
  requests_311: string;
  crime_safety: string;
  property_mix: string;
  overall_verdict: string;
  neighborhood: string;
  street: string;
  zip_code: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(session: Session) {
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [searches, setSearches] = useState<Search[]>([]);
  const [loadingSearches, setLoadingSearches] = useState(true);

  // Neighborhood combobox
  const [neighborhoodInput, setNeighborhoodInput] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [showNeighborhoodDropdown, setShowNeighborhoodDropdown] = useState(false);
  const neighborhoodRef = useRef<HTMLDivElement>(null);

  // Street combobox
  const [streetInput, setStreetInput] = useState("");
  const [street, setStreet] = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [loadingStreets, setLoadingStreets] = useState(false);
  const [showStreetDropdown, setShowStreetDropdown] = useState(false);
  const streetRef = useRef<HTMLDivElement>(null);

  const [zipCode, setZipCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Auto-populate zip when neighborhood has only one option
  useEffect(() => {
    if (!neighborhood) return;
    const zips = NEIGHBORHOOD_ZIP_CODES[neighborhood] ?? [];
    if (zips.length === 1) setZipCode(zips[0]);
    else setZipCode("");
  }, [neighborhood]);

  // Debounced street fetch — fires 300ms after user stops typing
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
        const res = await fetch(`${BOSTON_API}?sql=${encodeURIComponent(sql)}`);
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

  // Close neighborhood dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (neighborhoodRef.current && !neighborhoodRef.current.contains(e.target as Node))
        setShowNeighborhoodDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close street dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (streetRef.current && !streetRef.current.contains(e.target as Node))
        setShowStreetDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredNeighborhoods = neighborhoodInput.trim()
    ? NEIGHBORHOODS.filter((n) =>
        n.label.toLowerCase().includes(neighborhoodInput.toLowerCase())
      )
    : NEIGHBORHOODS;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setSession(session);
      fetchSearches(session);
    });
  }, [router]);

  async function fetchSearches(s: Session) {
    setLoadingSearches(true);
    try {
      const res = await fetch(`${API_URL}/searches`, { headers: authHeaders(s) });
      if (!res.ok) throw new Error();
      setSearches(await res.json());
    } catch { setSearches([]); }
    finally { setLoadingSearches(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (!neighborhood) { setFormError("Please select a neighborhood from the list."); return; }
    if (!street) { setFormError("Please select a street from the suggestions."); return; }
    setFormError(null);
    setAnalysis(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/searches`, {
        method: "POST",
        headers: authHeaders(session),
        body: JSON.stringify({ neighborhood, street, zip_code: zipCode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? "Failed to save search");
      }
      const data = await res.json();
      setAnalysis({
        requests_311:    data.requests_311,
        crime_safety:    data.crime_safety,
        property_mix:    data.property_mix,
        overall_verdict: data.overall_verdict,
        neighborhood:    data.neighborhood,
        street:          data.street,
        zip_code:        data.zip_code,
      });
      setNeighborhoodInput(""); setNeighborhood("");
      setStreetInput("");       setStreet("");
      setZipCode("");
      await fetchSearches(session);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!session) return;
    try {
      const res = await fetch(`${API_URL}/searches/${id}`, {
        method: "DELETE", headers: authHeaders(session),
      });
      if (!res.ok) throw new Error();
      setSearches((prev) => prev.filter((s) => s.id !== id));
      setAnalysis(null);
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
          <span className="text-lg font-semibold text-gray-900">Neighborhood Analysis</span>
          <button onClick={handleSignOut} className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Sign Out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Form */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a Search</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    setStreet(""); // clear confirmed value until user picks from list
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {/* Suggestions dropdown */}
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
              Running neighborhood analysis — this takes about 15 seconds…
            </p>
          </section>
        )}

        {/* Analysis Report */}
        {analysis && !submitting && (
          <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Analysis Report</h2>
              <p className="text-sm text-gray-500 mt-1">
                {analysis.neighborhood} · {analysis.street} · {analysis.zip_code}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">311 Service Requests</p>
                <p className="text-sm text-gray-700 leading-relaxed">{analysis.requests_311}</p>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Crime & Safety</p>
                <p className="text-sm text-gray-700 leading-relaxed">{analysis.crime_safety}</p>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Property Mix</p>
                <p className="text-sm text-gray-700 leading-relaxed">{analysis.property_mix}</p>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-2">Overall Verdict</p>
                <p className="text-sm text-blue-900 leading-relaxed font-medium">{analysis.overall_verdict}</p>
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
                <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{s.neighborhood}</p>
                    <p className="text-sm text-gray-600">{s.street}</p>
                    <p className="text-sm text-gray-600">{s.zip_code}</p>
                  </div>
                  <button onClick={() => handleDelete(s.id)} className="text-sm font-medium text-red-600 hover:text-red-800">
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
