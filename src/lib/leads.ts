import type { LeadInteractionType } from "@/lib/leads/interaction-types";
import type {
  InteractionType,
  Lead,
  VisitStatus,
} from "@/lib/types/database";

const LEGACY_VISIT_TYPES = new Set(["site", "shop", "direct_shop_visit"]);

/** Shop/site visits require completed status before conversion */
export function canConvertLeadToOrder(
  lead: Lead,
  types?: LeadInteractionType[]
): boolean {
  if (lead.status === "converted") return false;
  return !requiresVisitCompletion(lead.interaction_type, types) || lead.visit_status === "completed";
}

export function getConvertBlockedReason(
  lead: Lead,
  types?: LeadInteractionType[]
): string | null {
  if (lead.status === "converted") return "This lead is already converted.";

  if (
    requiresVisitCompletion(lead.interaction_type, types) &&
    lead.visit_status !== "completed"
  ) {
    return "Complete the shop visit before converting to an order.";
  }

  return null;
}

export function requiresVisitCompletion(
  interaction: string,
  types?: LeadInteractionType[]
): boolean {
  const fromDb = types?.find((t) => t.value === interaction)?.requires_visit;
  if (fromDb !== undefined) return fromDb;
  return LEGACY_VISIT_TYPES.has(interaction);
}

export function defaultVisitStatusForInteraction(
  interaction: string,
  types?: LeadInteractionType[]
): VisitStatus {
  return requiresVisitCompletion(interaction, types) ? "pending" : "not_applicable";
}

export function getInteractionIcon(
  interaction: string,
  types?: LeadInteractionType[]
): string {
  const fromDb = types?.find((t) => t.value === interaction)?.icon;
  if (fromDb) return fromDb;

  switch (interaction as InteractionType) {
    case "whatsapp":
      return "💬";
    case "facebook":
      return "📘";
    case "instagram":
      return "📸";
    case "meta_ads":
      return "📣";
    case "google_lead":
      return "🔍";
    case "direct_shop_visit":
      return "🛒";
    case "referral":
      return "🤝";
    case "other":
      return "📋";
    case "site":
      return "🏠";
    case "shop":
      return "🛒";
    case "phone":
      return "📞";
    case "online":
      return "💻";
    default:
      return "📋";
  }
}
