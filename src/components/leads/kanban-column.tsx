"use client";

import { useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableLeadCard } from "@/components/leads/sortable-lead-card";
import type { Lead, LeadStatus, Profile } from "@/lib/types/database";

interface KanbanColumnProps {
  status: { value: LeadStatus; label: string; color: string };
  leads: Lead[];
  agents: Profile[];
  orderByLeadId: Map<string, string>;
  onAssign: (leadId: string, agentId: string | null) => void;
  onOpenLead: (lead: Lead) => void;
}

export function KanbanColumn({ status, leads, agents, orderByLeadId, onAssign, onOpenLead }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.value });
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToLatest() {
    const list = listRef.current;
    if (!list) return;
    list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex max-h-[calc(100dvh-11.5rem)] min-h-[280px] flex-col rounded-xl border bg-stone-50/80 transition-colors sm:max-h-[calc(100dvh-13rem)] lg:max-h-[calc(100dvh-12rem)]",
        isOver ? "border-amber-400 bg-amber-50/50" : "border-stone-200"
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200 px-3 py-2.5 sm:px-4 sm:py-3">
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium sm:text-xs", status.color)}>
          {status.label}
        </span>
        <div className="flex items-center gap-2">
          {leads.length > 5 && (
            <button
              type="button"
              onClick={scrollToLatest}
              className="inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 hover:bg-amber-200 sm:text-xs"
              title="Jump to latest leads"
            >
              Latest
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
          <span className="text-xs font-medium text-stone-400">{leads.length}</span>
        </div>
      </div>
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 [-webkit-overflow-scrolling:touch]"
        >
          {leads.map((lead) => (
            <SortableLeadCard
              key={lead.id}
              lead={lead}
              agents={agents}
              orderId={orderByLeadId.get(lead.id)}
              onAssign={onAssign}
              onOpen={onOpenLead}
            />
          ))}
          {leads.length === 0 && (
            <p className="py-8 text-center text-xs text-stone-400">Drop leads here</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
