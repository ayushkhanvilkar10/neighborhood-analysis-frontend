"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { Field, Label, Radio, RadioGroup, Select } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BUYER_OR_RENTER,
  HOUSEHOLD_TYPES,
  PROPERTY_TYPES,
  COMMUTE_MODES,
  INTERESTS,
} from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function OnboardingPage() {
  const router = useRouter();
  const [session, setSession]         = useState<Session | null>(null);
  const [buyerOrRenter, setBuyerOrRenter] = useState("");
  const [householdType, setHouseholdType] = useState("");
  const [propertyPrefs, setPropertyPrefs] = useState<string[]>([]);
  const [commuteMode, setCommuteMode]     = useState("");
  const [interests, setInterests]         = useState<string[]>([]);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      setSession(session);
    });
  }, [router]);

  function togglePropertyPref(p: string) {
    setPropertyPrefs((prev) =>
      prev.includes(p)
        ? prev.filter((x) => x !== p)
        : prev.length < 2
        ? [...prev, p]
        : prev
    );
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          onboarding_completed: true,
          ...(buyerOrRenter && { buyer_or_renter: buyerOrRenter }),
          ...(householdType && { household_type: householdType }),
          ...(propertyPrefs.length > 0 && { property_preferences: propertyPrefs }),
          ...(commuteMode && { commute_mode: commuteMode }),
          ...(interests.length > 0 && { interests }),
        }),
      });
      router.replace("/dashboard");
    } catch {
      router.replace("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ onboarding_completed: true }),
      });
      router.replace("/dashboard");
    } catch {
      router.replace("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: "url('/images/Green_Gradient_Background.svg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full max-w-2xl rounded-xl bg-white/40 border border-[#016B51]/20 backdrop-blur-md p-8">

        {/* Header */}
        <h1
          style={{ fontFamily: "var(--font-nanum-myeongjo)" }}
          className="text-2xl font-bold text-gray-900"
        >
          Welcome to The Hunt
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Tell us a bit about yourself so we can personalize your neighborhood analysis.
        </p>

        {/* Fields */}
        <div className="mt-6">

          {/* Buyer/Renter + Household Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">
                I am a… <span className="text-gray-400 font-normal">(optional)</span>
              </legend>
              <RadioGroup
                value={buyerOrRenter}
                onChange={(val: string) => setBuyerOrRenter(val === buyerOrRenter ? "" : val)}
                className="mt-2 flex gap-4"
              >
                {BUYER_OR_RENTER.map((opt) => (
                  <Radio
                    key={opt.value}
                    value={opt.value}
                    className="group flex cursor-pointer items-center gap-2 focus:outline-none"
                  >
                    <span className="flex size-4 items-center justify-center rounded-full border border-[#649E97]/50 bg-[#F8FBFA] group-data-[checked]:border-[#006B4E] group-data-[checked]:bg-[#006B4E] transition-colors">
                      <span className="size-1.5 rounded-full bg-white opacity-0 group-data-[checked]:opacity-100 transition-opacity" />
                    </span>
                    <span className="text-sm text-gray-700 group-data-[checked]:text-[#006B4E] group-data-[checked]:font-medium">
                      {opt.label}
                    </span>
                  </Radio>
                ))}
              </RadioGroup>
            </fieldset>

            <Field>
              <Label className="block text-sm/6 font-medium text-gray-700">
                Household Type <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <div className="relative mt-1">
                <Select
                  id="householdType"
                  value={householdType}
                  onChange={(e) => setHouseholdType(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-[#649E97]/35 bg-[#F8FBFA] px-3 py-1.5 text-sm/6 text-gray-900 shadow-sm backdrop-blur-sm focus:outline-2 focus:-outline-offset-2 focus:outline-[#006B4E]/40 *:text-black"
                >
                  <option value="">Select household type…</option>
                  {HOUSEHOLD_TYPES.map((h) => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </Select>
                <ChevronDown className="pointer-events-none absolute top-2.5 right-2.5 size-4 text-[#649E97]/60" aria-hidden="true" />
              </div>
            </Field>
          </div>

          {/* Property Preferences */}
          <div className="mt-6">
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
                        ? "bg-[#006B4E]/8 border-[#006B4E]/60 text-[#006B4E] hover:bg-[#006B4E]/12"
                        : "bg-white/60 border-[#649E97]/35 text-gray-700 hover:bg-white/80 hover:border-[#649E97]/50"
                    )}
                  >
                    {p}
                  </ShadcnButton>
                );
              })}
            </div>
          </div>

          {/* Commute Mode */}
          <div className="mt-6">
            <p className="block text-sm font-medium text-gray-700">
              Commute Mode{" "}
              <span className="font-normal">(optional)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMUTE_MODES.map((m) => {
                const selected = commuteMode === m;
                return (
                  <ShadcnButton
                    key={m}
                    type="button"
                    onClick={() => setCommuteMode(selected ? "" : m)}
                    size="sm"
                    variant="outline"
                    className={cn(
                      "rounded-full border backdrop-blur-sm transition-colors",
                      selected
                        ? "bg-[#006B4E]/8 border-[#006B4E]/60 text-[#006B4E] hover:bg-[#006B4E]/12"
                        : "bg-white/60 border-[#649E97]/35 text-gray-700 hover:bg-white/80 hover:border-[#649E97]/50"
                    )}
                  >
                    {m}
                  </ShadcnButton>
                );
              })}
            </div>
          </div>

          {/* Interests */}
          <div className="mt-6">
            <p className="block text-sm font-medium text-gray-700">
              I like to…{" "}
              <span className="font-normal">(optional · pick as many as you want)</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const selected = interests.includes(i);
                return (
                  <ShadcnButton
                    key={i}
                    type="button"
                    onClick={() =>
                      setInterests((prev) =>
                        prev.includes(i)
                          ? prev.filter((x) => x !== i)
                          : [...prev, i]
                      )
                    }
                    size="sm"
                    variant="outline"
                    className={cn(
                      "rounded-full border backdrop-blur-sm transition-colors",
                      selected
                        ? "bg-[#006B4E]/8 border-[#006B4E]/60 text-[#006B4E] hover:bg-[#006B4E]/12"
                        : "bg-white/60 border-[#649E97]/35 text-gray-700 hover:bg-white/80 hover:border-[#649E97]/50"
                    )}
                  >
                    {i}
                  </ShadcnButton>
                );
              })}
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-[#006B4E] bg-[#006B4E] px-5 py-2 text-sm/6 font-semibold text-white shadow-sm hover:bg-[#006B4E]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : "Save & Continue"}
          </button>
        </div>

      </div>
    </div>
  );
}
