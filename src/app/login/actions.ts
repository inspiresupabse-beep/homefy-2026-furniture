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

/** Verify staff exists and return contact details for client-side OTP (anon key sends OTP email/SMS). */
export async function preparePasswordReset(identifier: string, method: ResetMethod) {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return { error: method === "email" ? "Enter your email." : "Enter your mobile number." };
  }

  if (method === "phone" && !isValidIndianMobile(trimmed)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  const profile =
    method === "email" ? await findStaffByEmail(trimmed) : await findStaffByPhone(trimmed);

  if (!profile) {
    return {
      error:
        method === "email"
          ? "No account found with this email."
          : "No account found with this mobile number.",
    };
  }

  if (method === "email") {
    return {
      success: true as const,
      channel: "email" as const,
      email: profile.email.trim().toLowerCase(),
      userId: profile.id,
    };
  }

  if (!profile.phone) {
    return { error: "This account has no mobile number. Use email recovery or contact admin." };
  }

  const e164 = toE164Phone(trimmed);
  const admin = createAdminClient();
  const { error: syncError } = await admin.auth.admin.updateUserById(profile.id, {
    phone: e164,
    phone_confirm: true,
  });

  if (syncError) {
    return { error: "Could not verify account. Contact your admin." };
  }

  return {
    success: true as const,
    channel: "phone" as const,
    phone: e164,
    userId: profile.id,
  };
}

/** Fallback: update password with service role when client session update fails. */
export async function adminUpdatePassword(userId: string, newPassword: string) {
  if (!userId || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return { error: error.message };
    return { success: true as const };
  } catch {
    return { error: "Could not update password. Try again." };
  }
}
