"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isValidIndianMobile, normalizePhoneDigits, phonesMatch, toE164Phone } from "@/lib/phone";

export type ResetMethod = "email" | "phone";

async function findStaffByEmail(email: string) {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, phone, full_name")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !profile) return null;
  return profile;
}

async function findStaffByPhone(phone: string) {
  const admin = createAdminClient();
  const digits = normalizePhoneDigits(phone);

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, phone, full_name")
    .not("phone", "is", null);

  if (error || !profiles) return null;

  return profiles.find((p) => p.phone && phonesMatch(p.phone, digits)) ?? null;
}

async function sendSupabaseOtp(payload: { email?: string; phone?: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serviceKey || !anonKey) {
    return { error: "Server auth is not configured." };
  }

  const response = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({
      ...payload,
      create_user: false,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    if (body.includes("Phone provider") || body.includes("SMS")) {
      return {
        error: "SMS OTP is not enabled yet. Try recovering with your email instead.",
      };
    }
    return { error: "Could not send OTP. Check your details and try again." };
  }

  return { success: true as const };
}

export async function requestPasswordResetOtp(identifier: string, method: ResetMethod) {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return { error: method === "email" ? "Enter your email." : "Enter your mobile number." };
  }

  if (method === "phone" && !isValidIndianMobile(trimmed)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  const profile =
    method === "email"
      ? await findStaffByEmail(trimmed)
      : await findStaffByPhone(trimmed);

  if (!profile) {
    return {
      error:
        method === "email"
          ? "No account found with this email."
          : "No account found with this mobile number.",
    };
  }

  const admin = createAdminClient();

  if (method === "email") {
    const email = profile.email.trim().toLowerCase();
    const result = await sendSupabaseOtp({ email });
    if (result.error) return result;
    return { success: true as const, channel: "email" as const, email };
  }

  if (!profile.phone) {
    return { error: "This account has no mobile number. Use email recovery or contact admin." };
  }

  const e164 = toE164Phone(trimmed);
  const { error: syncError } = await admin.auth.admin.updateUserById(profile.id, {
    phone: e164,
    phone_confirm: true,
  });

  if (syncError) {
    return { error: "Could not verify account. Contact your admin." };
  }

  const result = await sendSupabaseOtp({ phone: e164 });
  if (result.error) return result;
  return { success: true as const, channel: "phone" as const, phone: e164 };
}
