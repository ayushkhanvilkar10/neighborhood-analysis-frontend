"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

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

  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
        return;
      }
      setSession(session);
      fetchSearches(session);
    });
  }, [router]);

  async function fetchSearches(session: Session) {
    setLoadingSearches(true);
    try {
      const res = await fetch(`${API_URL}/searches`, {
        headers: authHeaders(session),
      });
      if (!res.ok) throw new Error("Failed to load searches");
      setSearches(await res.json());
    } catch {
      setSearches([]);
    } finally {
      setLoadingSearches(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
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
      setNeighborhood("");
      setStreet("");
      setZipCode("");
      await fetchSearches(session);
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
        method: "DELETE",
        headers: authHeaders(session),
      });
      if (!res.ok) throw new Error();
      setSearches((prev) => prev.filter((s) => s.id !== id));
      setAnalysis(null);
    } catch {
      /* silently ignore */
    }
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
          <span className="text-lg font-semibold text-gray-900">
            Neighborhood Analysis
          </span>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Add a Search
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700">
                  Neighborhood
                </label>
                <input
                  id="neighborhood"
                  type="text"
                  required
                  placeholder="e.g. Back Bay"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                  Street
                </label>
                <input
                  id="street"
                  type="text"
                  required
                  placeholder="e.g. BOYLSTON ST"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                  Zip Code
                </label>
                <input
                  id="zipCode"
                  type="text"
                  required
                  placeholder="e.g. 02116"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
              <h2 className="text-lg font-semibold text-gray-900">
                Analysis Report
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {analysis.neighborhood} · {analysis.street} · {analysis.zip_code}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  311 Service Requests
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {analysis.requests_311}
                </p>
              </div>

              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Crime & Safety
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {analysis.crime_safety}
                </p>
              </div>

              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Property Mix
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {analysis.property_mix}
                </p>
              </div>

              <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400 mb-2">
                  Overall Verdict
                </p>
                <p className="text-sm text-blue-900 leading-relaxed font-medium">
                  {analysis.overall_verdict}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Saved Searches */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Saved Searches
          </h2>

          {loadingSearches ? (
            <p className="text-sm text-gray-500">Loading searches…</p>
          ) : searches.length === 0 ? (
            <p className="text-sm text-gray-500">
              No saved searches yet. Add one above.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {searches.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.neighborhood}</p>
                    <p className="text-sm text-gray-600">{s.street}</p>
                    <p className="text-sm text-gray-600">{s.zip_code}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
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
