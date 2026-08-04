"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DailyReportMetrics } from "@/lib/daily-report/types";

export type DailyReportInput = DailyReportMetrics & {
  report_date: string;
  notes?: string | null;
};

export async function upsertDailyReport(input: DailyReportInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
