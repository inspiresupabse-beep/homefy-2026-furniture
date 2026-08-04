"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AddToHomeScreen } from "@/components/layout/add-to-home-screen";
import { HomefyLogo } from "@/components/layout/homefy-logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Mode = "signin" | "forgot";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth_callback"
      ? "Reset link expired or invalid. Request a new one."
      : null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/login/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Password reset link sent. Check your email inbox.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50 to-stone-200 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <HomefyLogo size="lg" className="rounded-xl" />
            <div>
              <h1 className="text-xl font-bold text-stone-900">Homefy CRM</h1>
              <p className="text-sm text-stone-500">
                {mode === "signin"
                  ? "Sign in to manage leads & orders"
                  : "Reset your password"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@homefy.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs font-medium text-amber-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-stone-600">
                Enter your account email and we&apos;ll send you a link to reset your password.
              </p>
              <div>
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@homefy.com"
                  required
                  autoComplete="email"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-stone-500">
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="font-medium text-amber-700 hover:underline"
                >
                  Back to sign in
                </button>
              </p>
            </form>
          )}
          {mode === "signin" && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <AddToHomeScreen />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
