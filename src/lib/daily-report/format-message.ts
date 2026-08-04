import { formatReportDateLabel } from "@/lib/daily-report/dates";
import type { DailyReportMetrics } from "@/lib/daily-report/types";
import { formatCurrency } from "@/lib/utils";

export function formatDailyReportMessage({
  reportDate,
  telecallerName,
  metrics,
  notes,
}: {
  reportDate: string;
  telecallerName: string;
  metrics: DailyReportMetrics;
  notes?: string | null;
}): string {
  const dateLabel = formatReportDateLabel(reportDate);
  const lines = [
    "📋 *DAILY FURNITURE AD REPORT*",
    "",
    `📅 Date: ${dateLabel}`,
    `👤 Telecaller: ${telecallerName}`,
    "",
    "🔄 *FOLLOW-UP REPORT*",
    "",
    `📋 Leads Assigned: ${metrics.leads_assigned}`,
    `📞 Leads Contacted: ${metrics.leads_contacted}`,
    `💚 Interested Customers: ${metrics.interested_customers}`,
    `🏢 Shop Visits Planned: ${metrics.shop_visits_planned}`,
    `🛍️ Orders Confirmed: ${metrics.orders_confirmed}`,
    `❌ Not Interested: ${metrics.not_interested}`,
    `📵 No Response: ${metrics.no_response}`,
    `⏳ Pending for Follow-up: ${metrics.pending_follow_up}`,
    "",
    `💰 *Advance Received:* ${formatCurrency(metrics.advance_received)}`,
  ];

  if (notes?.trim()) {
    lines.push("", "📝 *Notes:*", notes.trim());
  }

  lines.push("", "_Sent from Homefy CRM_");
  return lines.join("\n");
}
