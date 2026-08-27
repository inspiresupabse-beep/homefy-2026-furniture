"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  IMPERSONATION_BACKUP_COOKIE,
  IMPERSONATION_META_COOKIE,
} from "@/lib/auth/impersonation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatActionError, isRoleEnumError, supabaseErrorText } from "@/lib/action-error";
import { formatPhoneDisplay, isValidIndianMobile, phonesMatch, toE164Phone } from "@/lib/phone";
import type { StaffPower, UserRole } from "@/lib/types/database";

const IMPERSONATION_COOKIE_MAX_AGE = 60 * 60 * 8;

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    String((error as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." as const, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can manage users." as const, user: null };
  }

  return { error: null, user };
}

async function applyProfileRole(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  fullName: string,
  email: string,
  role: UserRole,
  staffPower?: StaffPower,
  phone?: string | null
) {
  const power: StaffPower =
    role === "admin" ? "full_access" : (staffPower ?? "leads_and_orders");

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        role,
        email,
        phone: phone ?? null,
        staff_power: power,
      },
      { onConflict: "id" }
    );

  if (!profileError) return null;

  const msg = supabaseErrorText(profileError) || JSON.stringify(profileError);

  if (isRoleEnumError(msg)) {
    return formatActionError(msg);
  }

  return formatActionError(msg);
}

async function findStaffFieldConflict(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  phoneRaw: string,
  excludeUserId?: string
): Promise<string | null> {
  let emailQuery = admin.from("profiles").select("id, full_name, email").eq("email", email);
  if (excludeUserId) emailQuery = emailQuery.neq("id", excludeUserId);

  const { data: emailMatch } = await emailQuery.maybeSingle();
  if (emailMatch) {
    return `This email is already used by ${emailMatch.full_name} (${emailMatch.email}).`;
  }

  const { data: phoneRows } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .not("phone", "is", null);

  const phoneMatch = phoneRows?.find(
    (row) =>
      row.id !== excludeUserId &&
      row.phone &&
      phonesMatch(row.phone, phoneRaw)
  );

  if (phoneMatch) {
    const displayPhone = phoneMatch.phone ? formatPhoneDisplay(phoneMatch.phone) : "";
    return `This mobile number is already used by ${phoneMatch.full_name}${displayPhone ? ` (${displayPhone})` : ""}.`;
  }

  return null;
}

export async function createTeamUser(formData: FormData) {
  const session = await requireAdminSession();
  if (session.error) return { error: session.error };

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phoneRaw = (formData.get("phone") as string)?.trim();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) || "sales_executive";
  const staffPower = (formData.get("staff_power") as StaffPower) || "leads_and_orders";

  if (!fullName || !email || !password || !phoneRaw) {
    return { error: "Name, email, phone, and password are required." };
  }

  if (!isValidIndianMobile(phoneRaw)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  const phone = toE164Phone(phoneRaw);

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const admin = createAdminClient();

    const conflict = await findStaffFieldConflict(admin, email, phoneRaw);
    if (conflict) return { error: conflict };

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      phone,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "sales_agent" },
    });

    if (error) return { error: formatActionError(error) };
    if (!data.user) return { error: "User was not created. Please try again." };

    const profileError = await applyProfileRole(
      admin,
      data.user.id,
      fullName,
      email,
      role,
      staffPower,
      phone
    );

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return { error: profileError };
    }

    await admin.auth.admin.updateUserById(data.user.id, {
      user_metadata: { full_name: fullName, role },
    });

    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { error: formatActionError(err) };
  }
}

export async function updateTeamUser(formData: FormData) {
  const session = await requireAdminSession();
  if (session.error) return { error: session.error };

  const userId = formData.get("user_id") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phoneRaw = (formData.get("phone") as string)?.trim();
  const role = formData.get("role") as UserRole;
  const staffPower = (formData.get("staff_power") as StaffPower) || "leads_and_orders";
  const password = (formData.get("password") as string)?.trim();

  if (!userId || !fullName || !email || !role || !phoneRaw) {
    return { error: "Name, email, phone, and role are required." };
  }

  if (!isValidIndianMobile(phoneRaw)) {
    return { error: "Enter a valid 10-digit mobile number." };
  }

  const phone = toE164Phone(phoneRaw);

  if (password && password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const admin = createAdminClient();

    const conflict = await findStaffFieldConflict(admin, email, phoneRaw, userId);
    if (conflict) return { error: conflict };

    const updatePayload: {
      email: string;
      phone: string;
      phone_confirm: boolean;
      user_metadata: { full_name: string; role: UserRole };
      password?: string;
    } = {
      email,
      phone,
      phone_confirm: true,
      user_metadata: { full_name: fullName, role },
    };

    if (password) {
      updatePayload.password = password;
    }

    const { error: authError } = await admin.auth.admin.updateUserById(
      userId,
      updatePayload
    );

    if (authError) return { error: formatActionError(authError) };

    const profileError = await applyProfileRole(
      admin,
      userId,
      fullName,
      email,
      role,
      staffPower,
      phone
    );

    if (profileError) return { error: profileError };

    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { error: formatActionError(err) };
  }
}

export async function switchToUser(userId: string) {
  const session = await requireAdminSession();
  if (session.error) return { error: session.error };

  if (userId === session.user!.id) {
    return { error: "You are already signed in as this user." };
  }

  const supabase = await createClient();
  const {
    data: { session: adminSession },
  } = await supabase.auth.getSession();

  if (!adminSession) {
    return { error: "Session expired. Sign in again." };
  }

  try {
    const admin = createAdminClient();

    const [{ data: targetProfile }, { data: adminProfile }] = await Promise.all([
      admin.from("profiles").select("email, full_name, role").eq("id", userId).single(),
      admin.from("profiles").select("full_name").eq("id", session.user!.id).single(),
    ]);

    if (!targetProfile?.email) {
      return { error: "User not found." };
    }

    if (targetProfile.role === "admin") {
      return { error: "Cannot switch into another admin account." };
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: targetProfile.email,
    });

    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      return { error: linkError?.message ?? "Could not start user switch." };
    }

    const cookieStore = await cookies();
    const cookieOptions = {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: IMPERSONATION_COOKIE_MAX_AGE,
    };

    cookieStore.set(
      IMPERSONATION_BACKUP_COOKIE,
      JSON.stringify({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
        admin_id: session.user!.id,
      }),
      { ...cookieOptions, httpOnly: true }
    );

    cookieStore.set(
      IMPERSONATION_META_COOKIE,
      JSON.stringify({
        adminName: adminProfile?.full_name ?? "Admin",
        staffName: targetProfile.full_name,
      }),
      { ...cookieOptions, httpOnly: false }
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });

    if (verifyError) {
      cookieStore.delete(IMPERSONATION_BACKUP_COOKIE);
      cookieStore.delete(IMPERSONATION_META_COOKIE);
      return { error: verifyError.message };
    }

    revalidatePath("/", "layout");
    redirect("/");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    return { error: formatActionError(err) };
  }
}

export async function switchBackToAdmin() {
  const cookieStore = await cookies();
  const backupRaw = cookieStore.get(IMPERSONATION_BACKUP_COOKIE)?.value;

  if (!backupRaw) {
    return { error: "No admin session to restore." };
  }

  let backup: { access_token: string; refresh_token: string };
  try {
    backup = JSON.parse(backupRaw);
  } catch {
    return { error: "Invalid backup session." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: backup.access_token,
    refresh_token: backup.refresh_token,
  });

  if (error) {
    return { error: error.message };
  }

  cookieStore.delete(IMPERSONATION_BACKUP_COOKIE);
  cookieStore.delete(IMPERSONATION_META_COOKIE);

  revalidatePath("/", "layout");
  revalidatePath("/");

  redirect("/");
}

export async function deleteTeamUser(userId: string) {
  const session = await requireAdminSession();
  if (session.error) return { error: session.error };
  if (userId === session.user!.id) {
    return { error: "You cannot delete your own account." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: formatActionError(error) };

    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { error: formatActionError(err) };
  }
}
