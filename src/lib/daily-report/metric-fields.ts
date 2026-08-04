import type { DailyReportMetrics } from "@/lib/daily-report/types";

export const METRIC_FIELDS: {
  key: keyof DailyReportMetrics;
  label: string;
  icon: string;
  step?: string;
}[] = [
  { key: "leads_assigned", label: "Leads Assigned", icon: "📋" },
  { key: "leads_contacted", label: "Leads Contacted", icon: "📞" },
  { key: "interested_customers", label: "Interested Customers", icon: "💚" },
  { key: "shop_visits_planned", label: "Shop Visits Planned", icon: "🏢" },
  { key: "orders_confirmed", label: "Orders Confirmed", icon: "🛍️" },
  { key: "not_interested", label: "Not Interested", icon: "❌" },
  { key: "no_response", label: "No Response", icon: "📵" },
  { key: "pending_follow_up", label: "Pending for Follow-up", icon: "⏳" },
  { key: "advance_received", label: "Advance Received (₹)", icon: "💰", step: "0.01" },
];
