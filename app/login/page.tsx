"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UniqueForm from "@/components/ui/creat-account-form";



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
    <div className="flex min-h-screen items-center justify-center">
      <UniqueForm
        mode={isSignUp ? "signup" : "signin"}
        onSubmit={handleSubmit}
        onToggleMode={handleToggleMode}
        error={error}
        success={success}
        loading={loading}
      />
    </div>
  );
}
