"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAndRedirect() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/preferences`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const prefs = await res.json();
          if (prefs.onboarding_completed === true) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch { /* fall through to onboarding */ }
      router.replace("/onboarding");
    }
    checkAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading…</p>
    </div>
  );
}
