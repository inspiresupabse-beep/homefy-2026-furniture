"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canConvertLeadToOrder } from "@/lib/leads";
import type { CreateLeadInput, LeadActionResult } from "@/lib/leads/actions-types";
import {
  isSchemaMismatchError,
  SCHEMA_MIGRATION_HINT,
  toLegacyLeadStatus,
} from "@/lib/leads/schema";
import type { Lead, LeadStatus } from "@/lib/types/database";

export async function createLead(input: CreateLeadInput): Promise<LeadActionResult> {
  try {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const fullPayload = {
    customer_name: input.customer_name,
    phone: input.phone,
    email: input.email || null,
    source: input.source || null,
    notes: input.notes || null,
    assigned_to: input.assigned_to || null,
    assigned_staff: input.assigned_staff || null,
    created_by: user.id,
    temperature: input.temperature ?? "warm",
    conversion_probability: input.conversion_probability ?? 0,
    interaction_type: input.interaction_type ?? "whatsapp",
    visit_status: input.visit_status ?? "not_applicable",
    site_visit_date: input.site_visit_date || null,
    narration: input.narration || null,
    address_line1: input.address_line1 || null,
    address_line2: input.address_line2 || null,
    city: input.city || null,
    district: input.district || null,
    state: input.state || null,
    pin_code: input.pin_code || null,
    status: "new_inquiry" as LeadStatus,
  };

  let { error } = await supabase.from("leads").insert(fullPayload);

  if (error && isSchemaMismatchError(error.message, error.code)) {
    const legacyPayload = {
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email || null,
      source: input.source || null,
      notes: [input.notes, input.narration].filter(Boolean).join("\n\n") || null,
      assigned_to: input.assigned_to || input.assigned_staff || null,
      created_by: user.id,
      status: toLegacyLeadStatus("new_inquiry"),
    };

    const legacy = await supabase.from("leads").insert(legacyPayload);
    if (legacy.error) return { error: legacy.error.message };

    revalidatePath("/leads");
    return {
      success: true,
      warning: `Lead created with basic fields only. ${SCHEMA_MIGRATION_HINT}`,
    };
  }

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/insights");
  return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create lead.",
    };
  }
}

export async function convertLeadToOrder(leadId: string): Promise<LeadActionResult> {
  try {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) return { error: "Lead not found." };

  if (!canConvertLeadToOrder(lead as Lead)) {
    return {
      error:
        "Visit status must be Completed for Site or Shop leads before conversion.",
    };
  }

  const { data: orderId, error: rpcError } = await supabase.rpc(
    "convert_lead_to_order",
    { p_lead_id: leadId, p_created_by: user.id }
  );

  if (rpcError) {
    if (
      rpcError.message.includes("Could not find the function") ||
      rpcError.code === "PGRST202"
    ) {
      return { error: `Conversion not available yet. ${SCHEMA_MIGRATION_HINT}` };
    }
    return { error: rpcError.message };
  }

  revalidatePath("/leads");
  revalidatePath("/orders");
  revalidatePath("/insights");
  revalidatePath("/");

  return { success: true, orderId: orderId as string };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to convert lead.",
    };
  }
}

const LEGACY_UPDATE_FIELDS = new Set([
  "customer_name",
  "phone",
  "email",
  "notes",
  "source",
  "assigned_to",
  "status",
]);

export async function updateLeadFields(
  leadId: string,
  fields: Record<string, unknown>
): Promise<LeadActionResult> {
  try {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in." };

  const payload = { ...fields };
  if (typeof payload.status === "string") {
    payload.status = payload.status as LeadStatus;
  }

  let { error } = await supabase.from("leads").update(payload).eq("id", leadId);

  if (error && isSchemaMismatchError(error.message, error.code)) {
    const legacy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key === "status" && typeof value === "string") {
        legacy.status = toLegacyLeadStatus(value as LeadStatus);
      } else if (LEGACY_UPDATE_FIELDS.has(key)) {
        legacy[key] = value;
      } else if (key === "narration" && value) {
        legacy.notes = fields.notes
          ? `${fields.notes}\n\n${value}`
          : value;
      }
    }

    if (Object.keys(legacy).length === 0) {
      return { error: `Cannot save these fields yet. ${SCHEMA_MIGRATION_HINT}` };
    }

    const legacyResult = await supabase.from("leads").update(legacy).eq("id", leadId);
    if (legacyResult.error) return { error: legacyResult.error.message };

    revalidatePath("/leads");
    return {
      success: true,
      warning: `Some fields saved to notes only. ${SCHEMA_MIGRATION_HINT}`,
    };
  }

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/insights");
  return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to update lead.",
    };
  }
}
