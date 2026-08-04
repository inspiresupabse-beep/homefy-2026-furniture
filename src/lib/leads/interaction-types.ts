export interface LeadInteractionType {
  id?: string;
  value: string;
  label: string;
  icon: string;
  requires_visit: boolean;
  sort_order?: number;
}

export const DEFAULT_INTERACTION_TYPES: LeadInteractionType[] = [
  { value: "whatsapp", label: "WhatsApp", icon: "💬", requires_visit: false, sort_order: 1 },
  { value: "facebook", label: "Facebook", icon: "📘", requires_visit: false, sort_order: 2 },
  { value: "instagram", label: "Instagram", icon: "📸", requires_visit: false, sort_order: 3 },
  { value: "meta_ads", label: "Meta ads", icon: "📣", requires_visit: false, sort_order: 4 },
  { value: "google_lead", label: "Google lead", icon: "🔍", requires_visit: false, sort_order: 5 },
  {
    value: "direct_shop_visit",
    label: "Direct shop visit",
    icon: "🛒",
    requires_visit: true,
    sort_order: 6,
  },
  { value: "referral", label: "Referral", icon: "🤝", requires_visit: false, sort_order: 7 },
  { value: "other", label: "Other", icon: "📋", requires_visit: false, sort_order: 8 },
];

export function slugifyInteractionLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function getInteractionMeta(
  value: string,
  types: LeadInteractionType[]
): LeadInteractionType {
  return (
    types.find((t) => t.value === value) ?? {
      value,
      label: value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "📋",
      requires_visit: false,
    }
  );
}

export function mergeInteractionTypeOptions(
  types: LeadInteractionType[],
  current?: string
): LeadInteractionType[] {
  if (!current || types.some((t) => t.value === current)) return types;
  return [...types, getInteractionMeta(current, types)];
}

export function sortInteractionTypes(types: LeadInteractionType[]): LeadInteractionType[] {
  return [...types].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
}

export function mapInteractionTypeRows(rows: Record<string, unknown>[]): LeadInteractionType[] {
  return sortInteractionTypes(
    rows.map((row) => ({
      id: String(row.id ?? ""),
      value: String(row.value),
      label: String(row.label),
      icon: String(row.icon ?? "📋"),
      requires_visit: Boolean(row.requires_visit),
      sort_order: Number(row.sort_order ?? 999),
    }))
  );
}
