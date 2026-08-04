"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DailyReportMetrics } from "@/lib/daily-report/types";
import { isAdminRole } from "@/lib/roles";

export type DailyReportInput = DailyReportMetrics & {
  report_date: string;
  notes?: string | null;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function upsertDailyReport(input: DailyReportInput) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const payload = {
    user_id: user.id,
    report_date: input.report_date,
    leads_assigned: input.leads_assigned,
    leads_contacted: input.leads_contacted,
    interested_customers: input.interested_customers,
    shop_visits_planned: input.shop_visits_planned,
    orders_confirmed: input.orders_confirmed,
    not_interested: input.not_interested,
    no_response: input.no_response,
    pending_follow_up: input.pending_follow_up,
    advance_received: input.advance_received,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from("daily_staff_reports")
    .upsert(payload, { onConflict: "user_id,report_date" })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("daily_staff_reports")) {
      return { error: "Run migration 017_daily_staff_reports.sql in Supabase first." };
    }
    return { error: error.message };
  }

  revalidatePath("/daily-report");
  return { data };
}

export async function markDailyReportSent(reportDate: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("daily_staff_reports")
    .update({ sent_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("report_date", reportDate);

  if (error) return { error: error.message };

  revalidatePath("/daily-report");
  return { success: true as const };
}

export async function adminUpsertDailyReport(
  input: DailyReportInput & { user_id: string; sent_at?: string | null }
) {
  const profile = await getProfile();
  if (!profile || !isAdminRole(profile.role)) {
    return { error: "Only admins can manage staff reports." };
  }

  const supabase = await createClient();
  const payload = {
    user_id: input.user_id,
    report_date: input.report_date,
    leads_assigned: input.leads_assigned,
    leads_contacted: input.leads_contacted,
    interested_customers: input.interested_customers,
    shop_visits_planned: input.shop_visits_planned,
    orders_confirmed: input.orders_confirmed,
    not_interested: input.not_interested,
    no_response: input.no_response,
    pending_follow_up: input.pending_follow_up,
    advance_received: input.advance_received,
    notes: input.notes?.trim() || null,
    ...(input.sent_at !== undefined ? { sent_at: input.sent_at } : {}),
  };

  const { data, error } = await supabase
    .from("daily_staff_reports")
    .upsert(payload, { onConflict: "user_id,report_date" })
    .select("*")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/daily-report");
  return { data };
}

export async function adminDeleteDailyReport(reportId: string) {
  const profile = await getProfile();
  if (!profile || !isAdminRole(profile.role)) {
    return { error: "Only admins can delete staff reports." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("daily_staff_reports").delete().eq("id", reportId);

  if (error) return { error: error.message };

  revalidatePath("/daily-report");
  return { success: true as const };
}
