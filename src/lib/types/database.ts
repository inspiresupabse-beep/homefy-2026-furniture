import {
  DEFAULT_INTERACTION_TYPES,
  getInteractionMeta,
  mergeInteractionTypeOptions,
} from "@/lib/leads/interaction-types";

export type LeadTemperature = "hot" | "warm" | "cold";

export type InteractionType = string;

export type VisitStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "not_applicable";

export type LeadStatus =
  | "new_inquiry"
  | "discovery"
  | "qualified"
  | "proposal_sent"
  | "decision_pending"
  | "converted";

export type UserRole =
  | "admin"
  | "sales_agent"
  | "sales_manager"
  | "sales_executive"
  | "leading_staff";

export type OrderStatus =
  | "pending"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";

export type StaffPower =
  | "full_access"
  | "leads_and_orders"
  | "leads_only"
  | "orders_only"
  | "view_only";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  staff_power: StaffPower;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductLineItem {
  name: string;
  quantity: number;
  unit_price: number;
  description?: string;
}

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  conversion_probability: number;
  interaction_type: InteractionType;
  visit_status: VisitStatus;
  site_visit_date: string | null;
  assigned_staff: string | null;
  narration: string | null;
  assigned_to: string | null;
  notes: string | null;
  source: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pin_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent?: Profile | null;
  staff_agent?: Profile | null;
}

export interface Order {
  id: string;
  order_number: string;
  lead_id: string | null;
  customer_name: string;
  phone: string;
  address: string | null;
  product_details: ProductLineItem[];
  subtotal: number;
  discount: number;
  total: number;
  advance_payment: number;
  balance: number;
  delivery_date: string | null;
  status: OrderStatus;
  assigned_to: string | null;
  assigned_staff: string | null;
  narration: string | null;
  site_visit_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent?: Profile | null;
  staff_agent?: Profile | null;
  logistics?: Logistics | null;
}

export interface Logistics {
  id: string;
  order_id: string;
  transport_cost: number;
  company_share: number;
  customer_share: number;
  vehicle_number: string | null;
  driver_name: string | null;
  dispatch_date: string | null;
  notes: string | null;
}

export interface LeadReminder {
  id: string;
  lead_id: string;
  user_id: string;
  title: string;
  message: string | null;
  remind_at: string;
  read_at: string | null;
  popup_shown_at: string | null;
  created_by: string | null;
  created_at: string;
  lead?: Pick<Lead, "id" | "customer_name" | "phone"> | null;
}

export interface StaffConversionInsight {
  staffId: string;
  staffName: string;
  siteVisits: number;
  shopVisits: number;
  totalVisits: number;
  conversions: number;
  efficiency: number;
}

export interface StaffPerformanceRow extends StaffConversionInsight {
  role: UserRole;
  staffPower: StaffPower;
  staffPowerLabel: string;
  activeLeads: number;
  totalOrders: number;
  totalSales: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingPayments: number;
  activeLeads: number;
  leadsByAgent: { name: string; count: number }[];
  salesByMonth: { month: string; sales: number }[];
}

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: "new_inquiry", label: "New Inquiry", color: "bg-sky-100 text-sky-800 border-sky-200" },
  { value: "discovery", label: "Discovery / Genuine Check", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { value: "qualified", label: "Qualified", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "proposal_sent", label: "Proposal Sent", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "decision_pending", label: "Decision Pending", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "converted", label: "Converted", color: "bg-violet-100 text-violet-800 border-violet-200" },
];

export const LEAD_TEMPERATURES: {
  value: LeadTemperature;
  label: string;
  badge: string;
  bar: string;
}[] = [
  { value: "hot", label: "Hot", badge: "bg-red-100 text-red-800 border-red-200", bar: "bg-red-500" },
  { value: "warm", label: "Warm", badge: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-400" },
  { value: "cold", label: "Cold", badge: "bg-blue-100 text-blue-800 border-blue-200", bar: "bg-blue-400" },
];

export const INTERACTION_TYPES = DEFAULT_INTERACTION_TYPES.map(({ value, label, icon }) => ({
  value,
  label,
  icon,
}));

export const VISIT_STATUSES: { value: VisitStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "not_applicable", label: "N/A" },
];

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_production", label: "In Production" },
  { value: "ready", label: "Ready" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function getLeadStatusLabel(status: LeadStatus): string {
  return LEAD_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function getLeadTemperatureConfig(temperature: LeadTemperature) {
  return LEAD_TEMPERATURES.find((t) => t.value === temperature) ?? LEAD_TEMPERATURES[1];
}

export function getInteractionLabel(type: InteractionType): string {
  return getInteractionMeta(type, DEFAULT_INTERACTION_TYPES).label;
}

export function getInteractionTypeOptions(current?: InteractionType) {
  return mergeInteractionTypeOptions(DEFAULT_INTERACTION_TYPES, current).map(
    ({ value, label, icon }) => ({ value, label, icon })
  );
}

export function getVisitStatusLabel(status: VisitStatus): string {
  return VISIT_STATUSES.find((s) => s.value === status)?.label ?? status;
}
