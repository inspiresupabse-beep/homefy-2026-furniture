"use client";

import { useRouter } from "next/navigation";
import { Phone, User, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  InteractionBadge,
  ProbabilityBar,
  TemperatureBadge,
} from "@/components/leads/lead-metrics";
import type { Lead, Profile } from "@/lib/types/database";

interface LeadCardProps {
  lead: Lead;
  agents: Profile[];
  orderId?: string | null;
  onAssign?: (leadId: string, agentId: string | null) => void;
  onOpen?: (lead: Lead) => void;
  isDragging?: boolean;
}

export function LeadCard({
  lead,
  agents,
  orderId,
  onAssign,
  onOpen,
  isDragging,
}: LeadCardProps) {
  const router = useRouter();
  const temperature = lead.temperature ?? "warm";
  const probability = lead.conversion_probability ?? 0;
  const interaction = lead.interaction_type ?? "phone";
  const isConverted = lead.status === "converted";

  return (
    <div
      className={cn(
        "cursor-grab rounded-lg border border-stone-200 bg-white p-3 shadow-sm active:cursor-grabbing sm:p-4",
        isDragging && "rotate-2 shadow-lg",
        isConverted && "border-violet-200 bg-violet-50/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-stone-900">{lead.customer_name}</h3>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <TemperatureBadge temperature={temperature} />
          <InteractionBadge interaction={interaction} />
        </div>
      </div>

      <div className="mt-2">
        <ProbabilityBar value={probability} size="sm" />
      </div>

      <div className="mt-2 space-y-1 text-xs text-stone-500">
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 shrink-0" />
          {lead.phone}
        </div>
        {(lead.city || lead.district) && (
          <div className="text-stone-400">
            {[lead.city, lead.district].filter(Boolean).join(", ")}
          </div>
        )}
        {lead.site_visit_date && (
          <div className="text-stone-400">
            Visit: {new Date(lead.site_visit_date).toLocaleDateString("en-IN")}
          </div>
        )}
        {lead.narration && (
          <p className="line-clamp-2 text-stone-400">{lead.narration}</p>
        )}
      </div>

      {isConverted && orderId && (
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/orders/${orderId}/invoice`);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          Sales Order
        </Button>
      )}

      <div className="mt-3 flex items-end justify-between gap-2 border-t border-stone-100 pt-3">
        {onAssign && !isConverted ? (
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
              <User className="h-3 w-3" />
              Assign to
            </div>
            <Select
              className="text-xs"
              value={lead.assigned_to ?? ""}
              onChange={(e) => onAssign(lead.id, e.target.value || null)}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {onOpen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(lead);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-amber-700 hover:text-amber-800"
          >
            Details
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
