"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isValidIndianMobile, normalizePhoneDigits, phonesMatch, toE164Phone } from "@/lib/phone";

export type ResetOtpChannel = "email" | "phone";

async function findStaffByEmailAndPhone(email: string, phone: string) {
  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const digits = normalizePhoneDigits(phone);

  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, phone, full_name")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !profile) return null;
  if (!profile.phone || !phonesMatch(profile.phone, digits)) return null;

  return profile;
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
        error:
          "SMS OTP is not enabled yet. Enable Phone auth in Supabase, or choose Email OTP.",
      };
    }
    return { error: "Could not send OTP. Check your details and try again." };
  }

  return { success: true as const };
}

export async function requestPasswordResetOtp(
  email: string,
  phone: string,
  channel: ResetOtpChannel
) {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  if (!trimmedEmail || !trimmedPhone) {
    return { error: "Email and phone number are both required." };
  }

  if (!isValidIndianMobile(trimmedPhone)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  const profile = await findStaffByEmailAndPhone(trimmedEmail, trimmedPhone);
  if (!profile) {
    return { error: "No account found with this email and phone number." };
  }

  const admin = createAdminClient();
  const e164 = toE164Phone(trimmedPhone);

  const { error: syncError } = await admin.auth.admin.updateUserById(profile.id, {
    phone: e164,
    phone_confirm: true,
  });

  if (syncError) {
    return { error: "Could not verify account. Contact your admin." };
  }

  if (channel === "email") {
    const result = await sendSupabaseOtp({ email: trimmedEmail });
    if (result.error) return result;
    return { success: true as const, channel: "email" as const, email: trimmedEmail };
  }

  const result = await sendSupabaseOtp({ phone: e164 });
  if (result.error) return result;
  return { success: true as const, channel: "phone" as const, phone: e164 };
}
