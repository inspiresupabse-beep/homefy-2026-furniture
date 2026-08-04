import type {
  InteractionType,
  LeadTemperature,
  VisitStatus,
} from "@/lib/types/database";

export interface CreateLeadInput {
  customer_name: string;
  phone: string;
  email?: string;
  source?: string;
  notes?: string;
  assigned_to?: string;
  assigned_staff?: string;
  temperature?: LeadTemperature;
  conversion_probability?: number;
  interaction_type?: InteractionType;
  visit_status?: VisitStatus;
  site_visit_date?: string;
  narration?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  state?: string;
  pin_code?: string;
}

export type LeadActionResult = {
  success?: boolean;
  error?: string;
  warning?: string;
  orderId?: string;
};
