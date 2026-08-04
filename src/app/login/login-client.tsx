"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordResetOtp, type ResetMethod } from "@/app/login/actions";
import { AddToHomeScreen } from "@/components/layout/add-to-home-screen";
import { HomefyLogo } from "@/components/layout/homefy-logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Mode = "signin" | "forgot" | "otp";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetMethod, setResetMethod] = useState<ResetMethod>("email");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [otpTarget, setOtpTarget] = useState<{ email?: string; phone?: string }>({});
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
    setOtp("");
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

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    let result;
    try {
      result = await requestPasswordResetOtp(resetIdentifier, resetMethod);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (!("success" in result) || !result.success) return;

    setOtpTarget(
      result.channel === "email"
        ? { email: result.email }
        : { phone: result.phone }
    );
    setMessage(
      result.channel === "email"
        ? "OTP sent to your email. Check your inbox."
        : "OTP sent to your mobile number via SMS."
    );
    setMode("otp");
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const token = otp.trim();

    if (token.length < 6) {
      setLoading(false);
      setError("Enter the 6-digit OTP.");
      return;
    }

    const verifyPayload = otpTarget.phone
      ? { phone: otpTarget.phone, token, type: "sms" as const }
      : { email: otpTarget.email!, token, type: "email" as const };

    const { error: verifyError } = await supabase.auth.verifyOtp(verifyPayload);

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/login/reset-password");
    router.refresh();
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
                {mode === "signin" && "Sign in to manage leads & orders"}
                {mode === "forgot" && "Verify your account to reset password"}
                {mode === "otp" && "Enter the OTP we sent you"}
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
                    Forgot password or email?
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
          ) : mode === "forgot" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <p className="text-sm text-stone-600">
                Enter your email or mobile number — only one is needed. We&apos;ll send an OTP to
                verify your account.
              </p>
              <div className="flex gap-2 rounded-lg bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod("email");
                    setResetIdentifier("");
                    setError(null);
                  }}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    resetMethod === "email"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod("phone");
                    setResetIdentifier("");
                    setError(null);
                  }}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    resetMethod === "phone"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Mobile
                </button>
              </div>
              {resetMethod === "email" ? (
                <div>
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="you@homefy.com"
                    required
                    autoComplete="email"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="forgot-phone">Mobile Number</Label>
                  <Input
                    id="forgot-phone"
                    type="tel"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="9876543210"
                    inputMode="numeric"
                    required
                    autoComplete="tel"
                  />
                </div>
              )}
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
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
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {message && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              )}
              <div>
                <Label htmlFor="otp">6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  required
                  autoComplete="one-time-code"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <p className="text-center text-sm text-stone-500">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="font-medium text-amber-700 hover:underline"
                >
                  Resend OTP
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
