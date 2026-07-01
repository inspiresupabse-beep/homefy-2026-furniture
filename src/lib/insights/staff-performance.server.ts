import { createClient } from "@/lib/supabase/server";
import { STAFF_ROLES } from "@/lib/roles";
import type { StaffPerformanceRow } from "@/lib/types/database";
import { buildStaffPerformanceRows } from "@/lib/insights/staff-performance";

export async function getStaffPerformanceData(): Promise<StaffPerformanceRow[]> {
  const supabase = await createClient();

  const [{ data: leads }, { data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("leads").select("id, assigned_staff, assigned_to, interaction_type, visit_status, status"),
    supabase.from("profiles").select("id, full_name, role, staff_power").in("role", STAFF_ROLES),
    supabase.from("orders").select("id, assigned_staff, total, status"),
  ]);

  return buildStaffPerformanceRows(leads ?? [], profiles ?? [], orders ?? []);
}
