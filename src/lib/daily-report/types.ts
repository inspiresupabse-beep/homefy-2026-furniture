export interface DailyReportMetrics {
  leads_assigned: number;
  leads_contacted: number;
  interested_customers: number;
  shop_visits_planned: number;
  orders_confirmed: number;
  not_interested: number;
  no_response: number;
  pending_follow_up: number;
  advance_received: number;
}

export interface DailyStaffReport extends DailyReportMetrics {
  id?: string;
  user_id: string;
  report_date: string;
  notes: string | null;
  sent_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export const EMPTY_DAILY_METRICS: DailyReportMetrics = {
  leads_assigned: 0,
  leads_contacted: 0,
  interested_customers: 0,
  shop_visits_planned: 0,
  orders_confirmed: 0,
  not_interested: 0,
  no_response: 0,
  pending_follow_up: 0,
  advance_received: 0,
};
