import { isOnReportDate } from "@/lib/daily-report/dates";
import type { DailyReportMetrics } from "@/lib/daily-report/types";
import type { Lead, Order } from "@/lib/types/database";

type LeadRow = Pick<
  Lead,
  | "id"
  | "status"
  | "temperature"
  | "conversion_probability"
  | "visit_status"
  | "site_visit_date"
  | "assigned_to"
  | "assigned_staff"
  | "created_by"
  | "created_at"
  | "updated_at"
>;

type OrderRow = Pick<
  Order,
  "id" | "lead_id" | "advance_payment" | "assigned_to" | "assigned_staff" | "created_at" | "updated_at"
>;

function isStaffLead(lead: LeadRow, userId: string): boolean {
  return (
    lead.assigned_to === userId ||
    lead.assigned_staff === userId ||
    lead.created_by === userId
  );
}

function isStaffOrder(order: OrderRow, userId: string): boolean {
  return order.assigned_to === userId || order.assigned_staff === userId;
}

export function computeDailyMetrics(
  leads: LeadRow[],
  orders: OrderRow[],
  userId: string,
  reportDate: string
): DailyReportMetrics {
  const myLeads = leads.filter((l) => isStaffLead(l, userId));
  const myOrders = orders.filter((o) => isStaffOrder(o, userId));

  const leadsAssigned = myLeads.filter((l) => isOnReportDate(l.created_at, reportDate)).length;

  const leadsContacted = myLeads.filter(
    (l) =>
      isOnReportDate(l.updated_at, reportDate) &&
      l.status !== "new_inquiry" &&
      l.updated_at !== l.created_at
  ).length;

  const interestedCustomers = myLeads.filter(
    (l) =>
      isOnReportDate(l.updated_at, reportDate) &&
      ["qualified", "proposal_sent", "decision_pending"].includes(l.status)
  ).length;

  const shopVisitsPlanned = myLeads.filter(
    (l) =>
      l.visit_status === "scheduled" &&
      (isOnReportDate(l.updated_at, reportDate) ||
        (l.site_visit_date && l.site_visit_date >= reportDate))
  ).length;

  const ordersConfirmed = myOrders.filter((o) => isOnReportDate(o.created_at, reportDate)).length;

  const notInterested = myLeads.filter(
    (l) =>
      isOnReportDate(l.updated_at, reportDate) &&
      l.temperature === "cold" &&
      ["new_inquiry", "discovery"].includes(l.status) &&
      l.conversion_probability <= 15
  ).length;

  const noResponse = myLeads.filter(
    (l) =>
      isOnReportDate(l.updated_at, reportDate) &&
      l.status === "new_inquiry" &&
      l.temperature === "cold" &&
      l.updated_at === l.created_at
  ).length;

  const pendingFollowUp = myLeads.filter(
    (l) =>
      l.status !== "converted" &&
      (l.status === "decision_pending" ||
        l.visit_status === "pending" ||
        (l.status === "new_inquiry" && !isOnReportDate(l.created_at, reportDate)))
  ).length;

  const advanceReceived = myOrders
    .filter(
      (o) =>
        Number(o.advance_payment) > 0 &&
        (isOnReportDate(o.created_at, reportDate) || isOnReportDate(o.updated_at, reportDate))
    )
    .reduce((sum, o) => sum + Number(o.advance_payment), 0);

  return {
    leads_assigned: leadsAssigned,
    leads_contacted: leadsContacted,
    interested_customers: interestedCustomers,
    shop_visits_planned: shopVisitsPlanned,
    orders_confirmed: ordersConfirmed,
    not_interested: notInterested,
    no_response: noResponse,
    pending_follow_up: pendingFollowUp,
    advance_received: advanceReceived,
  };
}
