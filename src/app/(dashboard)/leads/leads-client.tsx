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
  const columnRefs = useRef<Map<LeadStatus, HTMLDivElement>>(new Map());
  const kanbanScrollRef = useRef<HTMLDivElement>(null);
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

  const scrollToStage = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, LEAD_STATUSES.length - 1));
    const status = LEAD_STATUSES[clamped]?.value;
    if (!status) return;

    const column = columnRefs.current.get(status);
    column?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveStageIndex(clamped);
  }, []);

  useEffect(() => {
    const root = kanbanScrollRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (!top) return;
        const status = top.target.getAttribute("data-status") as LeadStatus | null;
        if (!status) return;
        const index = LEAD_STATUSES.findIndex((s) => s.value === status);
        if (index >= 0) setActiveStageIndex(index);
      },
      { root, threshold: [0.35, 0.5, 0.65] }
    );

    for (const status of LEAD_STATUSES) {
      const el = columnRefs.current.get(status.value);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [loading, filteredLeads.length]);

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
        onSelect={scrollToStage}
        onPrev={() => scrollToStage(activeStageIndex - 1)}
        onNext={() => scrollToStage(activeStageIndex + 1)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={kanbanScrollRef}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:-mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0 xl:grid-cols-6"
        >
          {LEAD_STATUSES.map((status) => (
            <div
              key={status.value}
              ref={(el) => {
                if (el) columnRefs.current.set(status.value, el);
                else columnRefs.current.delete(status.value);
              }}
              data-status={status.value}
              className="w-[min(85vw,260px)] shrink-0 snap-center lg:w-auto lg:shrink"
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
