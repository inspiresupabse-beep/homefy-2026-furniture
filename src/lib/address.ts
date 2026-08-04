export interface LeadAddress {
  address_line1: string;
  address_line2: string;
  city: string;
  district: string;
  state: string;
  pin_code: string;
}

export const EMPTY_LEAD_ADDRESS: LeadAddress = {
  address_line1: "",
  address_line2: "",
  city: "",
  district: "",
  state: "Kerala",
  pin_code: "",
};

export const INDIAN_STATES = [
  "Kerala",
  "Tamil Nadu",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Gujarat",
  "Rajasthan",
  "Delhi",
  "West Bengal",
  "Other",
] as const;

export const KERALA_DISTRICTS = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
] as const;

export function formatLeadAddress(address: Partial<LeadAddress>): string | null {
  const line1 = address.address_line1?.trim();
  const line2 = address.address_line2?.trim();
  const city = address.city?.trim();
  const district = address.district?.trim();
  const state = address.state?.trim();
  const pin = address.pin_code?.trim();

  if (!line1 && !city && !district) return null;

  const parts = [
    line1,
    line2,
    [city, district].filter(Boolean).join(", "),
    [state, pin].filter(Boolean).join(pin ? " - " : ", "),
  ].filter(Boolean);

  return parts.join("\n") || null;
}

export function leadAddressFromLead(lead: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pin_code?: string | null;
}): LeadAddress {
  return {
    address_line1: lead.address_line1 ?? "",
    address_line2: lead.address_line2 ?? "",
    city: lead.city ?? "",
    district: lead.district ?? "",
    state: lead.state ?? "Kerala",
    pin_code: lead.pin_code ?? "",
  };
}
