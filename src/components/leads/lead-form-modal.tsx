"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { LeadAddressFields } from "@/components/leads/lead-address-fields";
import { EMPTY_LEAD_ADDRESS } from "@/lib/address";
import { defaultVisitStatusForInteraction, requiresVisitCompletion } from "@/lib/leads";
import {
  INTERACTION_TYPES,
  LEAD_TEMPERATURES,
  VISIT_STATUSES,
  type InteractionType,
  type LeadTemperature,
  type Profile,
  type VisitStatus,
} from "@/lib/types/database";
import { X } from "lucide-react";

interface LeadFormModalProps {
  agents: Profile[];
  onClose: () => void;
  onSaved: () => void;
}

export function LeadFormModal({ agents, onClose, onSaved }: LeadFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
    assigned_to: "",
    assigned_staff: "",
    temperature: "warm" as LeadTemperature,
    conversion_probability: 30,
    interaction_type: "phone" as InteractionType,
    visit_status: "not_applicable" as VisitStatus,
    site_visit_date: "",
    narration: "",
    address: { ...EMPTY_LEAD_ADDRESS },
  });

  function setInteraction(type: InteractionType) {
    setForm((prev) => ({
      ...prev,
      interaction_type: type,
      visit_status: requiresVisitCompletion(type)
        ? defaultVisitStatusForInteraction(type)
        : "not_applicable",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("You must be signed in.");
      return;
    }

    const { error: insertError } = await supabase.from("leads").insert({
      customer_name: form.customer_name,
      phone: form.phone,
      email: form.email || null,
      source: form.source || null,
      notes: form.notes || null,
      assigned_to: form.assigned_to || null,
      assigned_staff: form.assigned_staff || null,
      created_by: user.id,
      temperature: form.temperature,
      conversion_probability: form.conversion_probability,
      interaction_type: form.interaction_type,
      visit_status: form.visit_status,
      site_visit_date: form.site_visit_date || null,
      narration: form.narration || null,
      address_line1: form.address.address_line1 || null,
      address_line2: form.address.address_line2 || null,
      city: form.address.city || null,
      district: form.address.district || null,
      state: form.address.state || null,
      pin_code: form.address.pin_code || null,
      status: "new_inquiry",
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-xl bg-white shadow-xl sm:max-w-lg sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">New Lead</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <Label>Customer Name *</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <LeadAddressFields
            value={form.address}
            onChange={(address) => setForm({ ...form, address })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Interaction type</Label>
              <Select
                value={form.interaction_type}
                onChange={(e) => setInteraction(e.target.value as InteractionType)}
              >
                {INTERACTION_TYPES.map(({ value, label, icon }) => (
                  <option key={value} value={value}>{icon} {label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Visit status</Label>
              <Select
                value={form.visit_status}
                onChange={(e) =>
                  setForm({ ...form, visit_status: e.target.value as VisitStatus })
                }
                disabled={!requiresVisitCompletion(form.interaction_type)}
              >
                {VISIT_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Temperature</Label>
              <Select
                value={form.temperature}
                onChange={(e) =>
                  setForm({ ...form, temperature: e.target.value as LeadTemperature })
                }
              >
                {LEAD_TEMPERATURES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Probability (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.conversion_probability}
                onChange={(e) =>
                  setForm({ ...form, conversion_probability: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Assigned staff</Label>
              <Select
                value={form.assigned_staff}
                onChange={(e) => setForm({ ...form, assigned_staff: e.target.value })}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Visit date</Label>
              <Input
                type="date"
                value={form.site_visit_date}
                onChange={(e) => setForm({ ...form, site_visit_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Narration</Label>
            <Textarea
              rows={3}
              value={form.narration}
              onChange={(e) => setForm({ ...form, narration: e.target.value })}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
