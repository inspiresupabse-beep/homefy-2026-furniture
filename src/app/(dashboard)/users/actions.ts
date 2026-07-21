"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatActionError, isRoleEnumError } from "@/lib/action-error";
import type { StaffPower, UserRole } from "@/lib/types/database";

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
  staffPower?: StaffPower
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
        staff_power: power,
      },
      { onConflict: "id" }
    );

  if (!profileError) return null;

  const msg = profileError.message || profileError.details || JSON.stringify(profileError);

  if (isRoleEnumError(msg)) {
    return formatActionError(msg);
  }

  return formatActionError(msg);
}

export async function createTeamUser(formData: FormData) {
  const session = await requireAdminSession();
  if (session.error) return { error: session.error };

  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as UserRole) || "sales_executive";
  const staffPower = (formData.get("staff_power") as StaffPower) || "leads_and_orders";

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
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
      staffPower
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
  const role = formData.get("role") as UserRole;
  const staffPower = (formData.get("staff_power") as StaffPower) || "leads_and_orders";
  const password = (formData.get("password") as string)?.trim();

  if (!userId || !fullName || !email || !role) {
    return { error: "Name, email, and role are required." };
  }

  if (password && password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  try {
    const admin = createAdminClient();

    const updatePayload: {
      email: string;
      user_metadata: { full_name: string; role: UserRole };
      password?: string;
    } = {
      email,
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
      staffPower
    );

    if (profileError) return { error: profileError };

    revalidatePath("/users");
    return { success: true };
  } catch (err) {
    return { error: formatActionError(err) };
  }
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
