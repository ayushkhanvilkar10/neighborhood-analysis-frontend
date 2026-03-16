"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";

interface UniqueFormProps {
  mode: "signin" | "signup";
  onSubmit: (email: string, password: string) => void;
  onToggleMode: () => void;
  error?: string | null;
  success?: string | null;
  loading?: boolean;
}

export default function UniqueForm({
  mode,
  onSubmit,
  onToggleMode,
  error,
  success,
  loading,
}: UniqueFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignUp = mode === "signup";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <Card className="w-full shadow-lg rounded-2xl border border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center text-gray-800">
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </CardTitle>
          <p className="text-center text-sm text-gray-500 mt-1">
            {isSignUp
              ? "Sign up and start exploring features tailored just for you."
              : "Sign in to continue where you left off."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <Mail className="w-4 h-4 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white">
                <Lock className="w-4 h-4 text-gray-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-0 focus-visible:ring-0 focus-visible:outline-none shadow-none"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl hover:cursor-pointer text-white font-medium shadow-md"
            >
              {loading ? "Loading…" : isSignUp ? "Get Started" : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-indigo-600 font-medium cursor-pointer hover:underline"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </CardContent>
    </Card>
  );
}
