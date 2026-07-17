"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { KanbanColumn } from "@/components/leads/kanban-column";
import { LeadCard } from "@/components/leads/lead-card";
import { LeadDetailModal } from "@/components/leads/lead-detail-modal";
import { LeadFormModal } from "@/components/leads/lead-form-modal";
import { PipelineSearch } from "@/components/leads/pipeline-search";
import { PipelineStageNav } from "@/components/leads/pipeline-stage-nav";
import { PageHeader } from "@/components/layout/page-header";
import { STAFF_ROLES } from "@/lib/roles";
import { normalizeLead } from "@/lib/leads/schema";
import { OPEN_LEAD_EVENT } from "@/lib/events";
import { LEAD_STATUSES, type Lead, type LeadStatus, type Profile } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function LeadsPageClient() {
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [orderByLeadId, setOrderByLeadId] = useState<Map<string, string>>(new Map());
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const supabaseRef = useRef(createClient());

  const fetchData = useCallback(async () => {
    const supabase = supabaseRef.current;
    const [{ data: leadsData }, { data: agentsData }, { data: ordersData }] = await Promise.all([
      supabase
        .from("leads")
        .select("*, assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, role, phone, created_at, updated_at)")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").in("role", STAFF_ROLES),
      supabase.from("orders").select("id, lead_id").not("lead_id", "is", null),
    ]);

    setLeads(((leadsData ?? []) as Record<string, unknown>[]).map(normalizeLead));
    setAgents((agentsData as Profile[]) ?? []);

    const map = new Map<string, string>();
    for (const o of ordersData ?? []) {
      if (o.lead_id) map.set(o.lead_id, o.id);
    }
    setOrderByLeadId(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const leadId = searchParams.get("open") ?? searchParams.get("lead");
    if (!leadId) return;

    const found = leads.find((l) => l.id === leadId);
    if (found) {
      setDetailLead(found);
      window.history.replaceState({}, "", "/leads");
      return;
    }

    if (!loading) {
      void supabaseRef.current
        .from("leads")
        .select("*, assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, role, phone, created_at, updated_at)")
        .eq("id", leadId)
        .single()
        .then(({ data }) => {
          if (data) {
            setDetailLead(normalizeLead(data as Record<string, unknown>));
            window.history.replaceState({}, "", "/leads");
          }
        });
    }
  }, [searchParams, leads, loading]);

  useEffect(() => {
    function onOpenLead(e: Event) {
      const leadId = (e as CustomEvent<{ leadId: string }>).detail.leadId;
      const found = leads.find((l) => l.id === leadId);
      if (found) {
        setDetailLead(found);
        return;
      }
      void supabaseRef.current
        .from("leads")
        .select("*, assigned_agent:profiles!leads_assigned_to_fkey(id, full_name, email, role, phone, created_at, updated_at)")
        .eq("id", leadId)
        .single()
        .then(({ data }) => {
          if (data) setDetailLead(normalizeLead(data as Record<string, unknown>));
        });
    }

    window.addEventListener(OPEN_LEAD_EVENT, onOpenLead);
    return () => window.removeEventListener(OPEN_LEAD_EVENT, onOpenLead);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const agentName = l.assigned_agent?.full_name?.toLowerCase() ?? "";
      return (
        l.customer_name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.email?.toLowerCase().includes(q) ?? false) ||
        (l.narration?.toLowerCase().includes(q) ?? false) ||
        (l.notes?.toLowerCase().includes(q) ?? false) ||
        l.temperature.includes(q) ||
        l.interaction_type.includes(q) ||
        agentName.includes(q)
      );
    });
  }, [leads, search]);

  const stageCounts = useMemo(() => {
    const counts = {} as Record<LeadStatus, number>;
    for (const status of LEAD_STATUSES) {
      counts[status.value] = filteredLeads.filter((l) => l.status === status.value).length;
    }
    return counts;
  }, [filteredLeads]);

  const selectStage = useCallback((index: number) => {
    setActiveStageIndex(Math.max(0, Math.min(index, LEAD_STATUSES.length - 1)));
  }, []);

  function handlePipelineTouchStart(clientX: number) {
    touchStartX.current = clientX;
  }

  function handlePipelineTouchEnd(clientX: number) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const delta = clientX - start;
    if (delta > 60) selectStage(activeStageIndex - 1);
    else if (delta < -60) selectStage(activeStageIndex + 1);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getLeadsByStatus(status: LeadStatus) {
    const tempOrder: Record<string, number> = { hot: 0, warm: 1, cold: 2 };
    return filteredLeads
      .filter((l) => l.status === status)
      .sort((a, b) => {
        const ta = tempOrder[a.temperature ?? "warm"] ?? 1;
        const tb = tempOrder[b.temperature ?? "warm"] ?? 1;
        if (ta !== tb) return ta - tb;
        return (b.conversion_probability ?? 0) - (a.conversion_probability ?? 0);
      });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    const { error } = await supabaseRef.current
      .from("leads")
      .update({ status: newStatus })
      .eq("id", leadId);

    if (error) fetchData();
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  async function handleAssign(leadId: string, agentId: string | null) {
    const { error } = await supabaseRef.current
      .from("leads")
      .update({ assigned_to: agentId })
      .eq("id", leadId);

    if (!error) fetchData();
  }

  if (loading) {
    return <div className="py-20 text-center text-stone-400">Loading leads...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Leads Pipeline"
        description="Drag leads through stages · Set temperature & conversion probability"
        action={
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        }
      />

      <div className="space-y-3">
        <PipelineSearch
          value={search}
          onChange={setSearch}
          resultCount={filteredLeads.length}
          totalCount={leads.length}
        />

        <PipelineStageNav
          stages={LEAD_STATUSES}
          counts={stageCounts}
          activeIndex={activeStageIndex}
          onSelect={selectStage}
          onPrev={() => selectStage(activeStageIndex - 1)}
          onNext={() => selectStage(activeStageIndex + 1)}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="lg:-mx-0 lg:grid lg:grid-cols-3 lg:gap-4 xl:grid-cols-6"
          onTouchStart={(e) => handlePipelineTouchStart(e.changedTouches[0]?.clientX ?? 0)}
          onTouchEnd={(e) => handlePipelineTouchEnd(e.changedTouches[0]?.clientX ?? 0)}
        >
          {LEAD_STATUSES.map((status, index) => (
            <div
              key={status.value}
              className={cn(
                "w-full",
                index !== activeStageIndex && "hidden lg:block"
              )}
            >
              <KanbanColumn
                status={status}
                leads={getLeadsByStatus(status.value)}
                agents={agents}
                orderByLeadId={orderByLeadId}
                onAssign={handleAssign}
                onOpenLead={setDetailLead}
              />
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeLead ? (
            <LeadCard
              lead={activeLead}
              agents={agents}
              orderId={orderByLeadId.get(activeLead.id)}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {showForm && (
        <LeadFormModal
          agents={agents}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}

      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          agents={agents}
          orderId={orderByLeadId.get(detailLead.id)}
          onClose={() => setDetailLead(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
