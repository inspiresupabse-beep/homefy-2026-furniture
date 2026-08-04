import type { Lead, LeadStatus } from "@/lib/types/database";

const LEGACY_TO_PIPELINE: Record<string, LeadStatus> = {
  new: "new_inquiry",
  qualified: "qualified",
  pending: "decision_pending",
  converted: "converted",
};

const PIPELINE_TO_LEGACY: Record<LeadStatus, string> = {
  new_inquiry: "new",
  discovery: "new",
  qualified: "qualified",
  proposal_sent: "pending",
  decision_pending: "pending",
  converted: "converted",
};

export function normalizeLeadStatus(status: string): LeadStatus {
  if (status in LEGACY_TO_PIPELINE) {
    return LEGACY_TO_PIPELINE[status];
  }
  return status as LeadStatus;
}

export function toLegacyLeadStatus(status: LeadStatus): string {
  return PIPELINE_TO_LEGACY[status] ?? "new";
}

export function normalizeLead(raw: Record<string, unknown>): Lead {
  const base = raw as unknown as Lead;
  return {
    ...base,
    status: normalizeLeadStatus(String(raw.status ?? "new_inquiry")),
    temperature: (raw.temperature as Lead["temperature"]) ?? "warm",
    conversion_probability: Number(raw.conversion_probability ?? 0),
    interaction_type: (raw.interaction_type as Lead["interaction_type"]) ?? "whatsapp",
    visit_status: (raw.visit_status as Lead["visit_status"]) ?? "not_applicable",
    site_visit_date: (raw.site_visit_date as string | null) ?? null,
    assigned_staff: (raw.assigned_staff as string | null) ?? null,
    narration: (raw.narration as string | null) ?? null,
    address_line1: (raw.address_line1 as string | null) ?? null,
    address_line2: (raw.address_line2 as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
    district: (raw.district as string | null) ?? null,
    state: (raw.state as string | null) ?? null,
    pin_code: (raw.pin_code as string | null) ?? null,
  };
}

export function isSchemaMismatchError(message: string, code?: string): boolean {
  if (code === "PGRST204") return true;
  return (
    message.includes("Could not find the") ||
    message.includes("invalid input value for enum lead_status")
  );
}

export const SCHEMA_MIGRATION_HINT =
  "Run supabase/migrations/007_lead_schema_upgrade.sql in the Supabase SQL Editor (Dashboard → SQL).";
