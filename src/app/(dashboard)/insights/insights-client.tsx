"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { buildStaffPerformanceRows } from "@/lib/insights/staff-performance";
import { AdminStaffPerformancePanel } from "@/components/dashboard/admin-staff-performance";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { STAFF_ROLES } from "@/lib/roles";
import type { StaffPerformanceRow } from "@/lib/types/database";

export default function InsightsPageClient() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const [rows, setRows] = useState<StaffPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      router.replace("/");
      return;
    }

    const [{ data: leads }, { data: profiles }, { data: orders }] = await Promise.all([
      supabase
        .from("leads")
        .select("id, assigned_staff, assigned_to, interaction_type, visit_status, status"),
      supabase.from("profiles").select("id, full_name, role, staff_power").in("role", STAFF_ROLES),
      supabase.from("orders").select("id, assigned_staff, total, status"),
    ]);

    setRows(buildStaffPerformanceRows(leads ?? [], profiles ?? [], orders ?? []));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  if (loading) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Insights"
        description="Detailed staff performance breakdown"
      />
      <AdminStaffPerformancePanel
        rows={rows}
        title="Conversion Insights"
        description="Site & shop visits vs conversions by assigned staff"
      />
    </div>
  );
}
