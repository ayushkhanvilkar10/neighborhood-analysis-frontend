"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UniqueForm from "@/components/ui/creat-account-form";
import { BlurImageCard } from "@/components/blur-image-card";
import { BGPattern } from "@/components/ui/bg-pattern";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Account created! Check your email to confirm your address.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  }

  function handleToggleMode() {
    setIsSignUp((prev) => !prev);
    setError(null);
    setSuccess(null);
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-[55%] relative flex flex-col items-center justify-center gap-8">
        <BGPattern variant="grid" mask="fade-edges" />
        <h1 className="text-5xl font-bold text-gray-800">Find Your Perfect Neighborhood</h1>
        <div className="grid grid-cols-3 gap-4">
          <BlurImageCard src="/images/neighborhoods/north-end.png" alt="North End" title="Boston" subtitle="North End" />
          <BlurImageCard src="/images/neighborhoods/allston.png" alt="Allston" title="Boston" subtitle="Allston" />
          <BlurImageCard src="/images/neighborhoods/fenway-park.png" alt="Fenway Park" title="Boston" subtitle="Fenway Park" />
          <BlurImageCard src="/images/neighborhoods/charlestown.png" alt="Charlestown" title="Boston" subtitle="Charlestown" />
          <BlurImageCard src="/images/neighborhoods/beacon-hill.png" alt="Beacon Hill" title="Boston" subtitle="Beacon Hill" />
          <BlurImageCard src="/images/neighborhoods/back-bay.png" alt="Back Bay" title="Boston" subtitle="Back Bay" />
          <BlurImageCard src="/images/neighborhoods/seaport.png" alt="Seaport" title="Boston" subtitle="Seaport" />
          <BlurImageCard src="/images/neighborhoods/chinatown.png" alt="Chinatown" title="Boston" subtitle="Chinatown" />
          <BlurImageCard src="/images/neighborhoods/huntington-ave.png" alt="Huntington Ave" title="Boston" subtitle="Huntington Ave" />
        </div>
      </div>

      <div className="w-[45%] flex items-center justify-center p-8">
        <UniqueForm
          mode={isSignUp ? "signup" : "signin"}
          onSubmit={handleSubmit}
          onToggleMode={handleToggleMode}
          error={error}
          success={success}
          loading={loading}
        />
      </div>
    </div>
  );
}
