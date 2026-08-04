"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  InteractionBadge,
  ProbabilityBar,
  TemperatureBadge,
} from "@/components/leads/lead-metrics";
import {
  canConvertLeadToOrder,
  defaultVisitStatusForInteraction,
  getConvertBlockedReason,
  requiresVisitCompletion,
} from "@/lib/leads";
import {
  INTERACTION_TYPES,
  LEAD_TEMPERATURES,
  VISIT_STATUSES,
  getLeadStatusLabel,
  type InteractionType,
  type Lead,
  type LeadTemperature,
  type Profile,
  type VisitStatus,
} from "@/lib/types/database";
import { LeadRemindersSection } from "@/components/leads/lead-reminders-section";
import { LeadAddressFields } from "@/components/leads/lead-address-fields";
import { formatLeadAddress, leadAddressFromLead } from "@/lib/address";
import { Phone, MapPin, X, FileText } from "lucide-react";

interface LeadDetailModalProps {
  lead: Lead;
  agents: Profile[];
  orderId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function LeadDetailModal({
  lead,
  agents,
  orderId,
  onClose,
  onSaved,
}: LeadDetailModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [temperature, setTemperature] = useState<LeadTemperature>(lead.temperature ?? "warm");
  const [probability, setProbability] = useState(lead.conversion_probability ?? 0);
  const [interactionType, setInteractionType] = useState<InteractionType>(
    lead.interaction_type ?? "phone"
  );
  const [visitStatus, setVisitStatus] = useState<VisitStatus>(
    lead.visit_status ?? "not_applicable"
  );
  const [siteVisitDate, setSiteVisitDate] = useState(lead.site_visit_date ?? "");
  const [assignedStaff, setAssignedStaff] = useState(lead.assigned_staff ?? "");
  const [narration, setNarration] = useState(lead.narration ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to ?? "");
  const [address, setAddress] = useState(leadAddressFromLead(lead));

  const draftLead: Lead = {
    ...lead,
    temperature,
    conversion_probability: probability,
    interaction_type: interactionType,
    visit_status: visitStatus,
    site_visit_date: siteVisitDate || null,
    assigned_staff: assignedStaff || null,
    narration: narration || null,
  };

  const canConvert = canConvertLeadToOrder(draftLead);
  const convertBlockedReason = getConvertBlockedReason(draftLead);

  function handleInteractionChange(value: InteractionType) {
    setInteractionType(value);
    if (!requiresVisitCompletion(value)) {
      setVisitStatus("not_applicable");
    } else if (visitStatus === "not_applicable") {
      setVisitStatus(defaultVisitStatusForInteraction(value));
    }
  }

  async function saveLeadFields() {
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        temperature,
        conversion_probability: probability,
        interaction_type: interactionType,
        visit_status: visitStatus,
        site_visit_date: siteVisitDate || null,
        assigned_staff: assignedStaff || null,
        narration: narration || null,
        notes: notes || null,
        assigned_to: assignedTo || null,
        address_line1: address.address_line1 || null,
        address_line2: address.address_line2 || null,
        city: address.city || null,
        district: address.district || null,
        state: address.state || null,
        pin_code: address.pin_code || null,
      })
      .eq("id", lead.id);

    return updateError;
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    const updateError = await saveLeadFields();

    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleConvert() {
    setConverting(true);
    setError(null);

    const updateError = await saveLeadFields();
    if (updateError) {
      setConverting(false);
      setError(updateError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setConverting(false);
      setError("You must be signed in.");
      return;
    }

    const { data: orderId, error: rpcError } = await supabase.rpc(
      "convert_lead_to_order",
      { p_lead_id: lead.id, p_created_by: user.id }
    );

    setConverting(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    onSaved();
    onClose();
    if (orderId) {
      router.push(`/orders/${orderId}`);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-xl bg-white shadow-xl sm:max-w-xl sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-stone-900">
              {lead.customer_name}
            </h2>
            <p className="text-sm text-stone-500">Lead details & conversion</p>
          </div>
          <button onClick={onClose} className="shrink-0 text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <TemperatureBadge temperature={temperature} />
            <InteractionBadge interaction={interactionType} showLabel />
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
              {getLeadStatusLabel(lead.status)}
            </span>
          </div>

          <ProbabilityBar value={probability} />

          <div className="space-y-2 rounded-lg border border-stone-100 bg-stone-50 p-4 text-sm">
            <div className="flex items-center gap-2 text-stone-600">
              <Phone className="h-4 w-4" />
              {lead.phone}
            </div>
            {lead.email && <p className="text-stone-600">{lead.email}</p>}
            {formatLeadAddress(address) && (
              <div className="flex items-start gap-2 text-stone-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="whitespace-pre-line">{formatLeadAddress(address)}</span>
              </div>
            )}
          </div>

          <LeadAddressFields value={address} onChange={setAddress} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Select
                id="temperature"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as LeadTemperature)}
              >
                {LEAD_TEMPERATURES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min={0}
                max={100}
                value={probability}
                onChange={(e) => setProbability(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="interaction">Interaction type</Label>
              <Select
                id="interaction"
                value={interactionType}
                onChange={(e) => handleInteractionChange(e.target.value as InteractionType)}
              >
                {INTERACTION_TYPES.map(({ value, label, icon }) => (
                  <option key={value} value={value}>
                    {icon} {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="visit_status">Visit status</Label>
              <Select
                id="visit_status"
                value={visitStatus}
                onChange={(e) => setVisitStatus(e.target.value as VisitStatus)}
                disabled={!requiresVisitCompletion(interactionType)}
              >
                {VISIT_STATUSES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="site_visit_date">Site / shop visit date</Label>
              <Input
                id="site_visit_date"
                type="date"
                value={siteVisitDate}
                onChange={(e) => setSiteVisitDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="assigned_staff">Assigned staff (visit owner)</Label>
              <Select
                id="assigned_staff"
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="narration">Visit narration *</Label>
            <Textarea
              id="narration"
              rows={4}
              placeholder="Record visit outcomes, customer preferences, measurements..."
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
            />
            <p className="mt-1 text-xs text-stone-400">
              Copied to the order when converted. Update after every site/shop visit.
            </p>
          </div>

          <div>
            <Label htmlFor="assigned">Lead owner</Label>
            <Select
              id="assigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <LeadRemindersSection
            leadId={lead.id}
            agents={agents}
            defaultUserId={assignedTo || assignedStaff}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {convertBlockedReason && lead.status !== "converted" && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {convertBlockedReason}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-between">
            {lead.status === "converted" && orderId ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push(`/orders/${orderId}/invoice`)}
                className="w-full sm:w-auto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Sales Order
              </Button>
            ) : lead.status !== "converted" ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleConvert}
                disabled={!canConvert || converting || loading}
                className="w-full sm:w-auto"
              >
                {converting ? "Converting..." : "Convert to Order"}
              </Button>
            ) : (
              <span className="text-sm text-violet-700">Converted — no order linked yet</span>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={loading || converting}>
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
