import type { DailyStaffReport } from "@/lib/daily-report/types";

export function mapReportRow(row: Record<string, unknown>): DailyStaffReport {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    report_date: String(row.report_date),
    leads_assigned: Number(row.leads_assigned ?? 0),
    leads_contacted: Number(row.leads_contacted ?? 0),
    interested_customers: Number(row.interested_customers ?? 0),
    shop_visits_planned: Number(row.shop_visits_planned ?? 0),
    orders_confirmed: Number(row.orders_confirmed ?? 0),
    not_interested: Number(row.not_interested ?? 0),
    no_response: Number(row.no_response ?? 0),
    pending_follow_up: Number(row.pending_follow_up ?? 0),
    advance_received: Number(row.advance_received ?? 0),
    notes: row.notes ? String(row.notes) : null,
    sent_at: row.sent_at ? String(row.sent_at) : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}
