"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Combobox, ComboboxInput, ComboboxOption, ComboboxOptions, Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions, Select } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import {
  NEIGHBORHOODS,
  HOUSEHOLD_TYPES,
  PROPERTY_TYPES,
  NEIGHBORHOOD_TO_DISTRICT,
  NEIGHBORHOOD_ZIP_CODES,
  BOSTON_API,
  CRIME_DATASET,
} from "@/lib/constants";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Search, SelectedAnalysis } from "./types";
import { AnalysisReport } from "./_components/analysis-report";
import { CrimeMapModal } from "./_components/crime-map-modal";
import { SavedSearchesList } from "./_components/saved-searches-list";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(session: Session) {
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

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
        backgroundImage: "url('/images/Linear_Blur_Background_Blue_opacity_75.svg')",
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
          <AnalysisReport analysis={selectedAnalysis} onOpenMap={() => setMapOpen(true)} />
        )}

        {/* Saved Searches */}
        <SavedSearchesList
          searches={searches}
          loading={loadingSearches}
          selectedSearchId={selectedSearchId}
          onCardClick={handleCardClick}
          onDelete={handleDelete}
        />
      </main>
    </div>

    {/* Crime Map Modal */}
    {mapOpen && (
      <CrimeMapModal
        neighborhood={selectedAnalysis?.neighborhood}
        onClose={() => setMapOpen(false)}
      />
    )}
    </>
  );
}
