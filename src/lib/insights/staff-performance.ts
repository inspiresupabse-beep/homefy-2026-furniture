import { STAFF_ROLES } from "@/lib/roles";
import { formatStaffPower, getStaffPower } from "@/lib/permissions";
import type { Profile, StaffPerformanceRow, UserRole } from "@/lib/types/database";

type LeadRow = {
  id: string;
  assigned_staff: string | null;
  assigned_to: string | null;
  interaction_type: string | null;
  visit_status: string | null;
  status: string;
};

type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  staff_power?: string | null;
};

type OrderRow = {
  id: string;
  assigned_staff: string | null;
  total: number;
  status: string;
};

export function buildStaffPerformanceRows(
  leads: LeadRow[],
  profiles: ProfileRow[],
  orders: OrderRow[]
): StaffPerformanceRow[] {
  const staffList = profiles.filter((p) =>
    STAFF_ROLES.includes(p.role as (typeof STAFF_ROLES)[number])
  );

  return staffList
    .map((staff) => {
      const staffLeads = leads.filter(
        (l) => l.assigned_staff === staff.id || l.assigned_to === staff.id
      );

      let siteVisits = 0;
      let shopVisits = 0;
      let conversions = 0;
      let activeLeads = 0;

      for (const lead of staffLeads) {
        if (lead.status !== "converted") activeLeads += 1;
        if (lead.status === "converted") conversions += 1;
        if (lead.visit_status === "completed") {
          if (lead.interaction_type === "site") siteVisits += 1;
          if (lead.interaction_type === "shop") shopVisits += 1;
        }
      }

      const staffOrders = orders.filter((o) => o.assigned_staff === staff.id);
      const totalSales = staffOrders
        .filter((o) => o.status === "delivered")
        .reduce((sum, o) => sum + Number(o.total), 0);

      const totalVisits = siteVisits + shopVisits;
      const power = getStaffPower(staff as Pick<Profile, "role" | "staff_power">);

      return {
        staffId: staff.id,
        staffName: staff.full_name,
        role: staff.role,
        staffPower: power,
        staffPowerLabel: formatStaffPower(power),
        siteVisits,
        shopVisits,
        totalVisits,
        conversions,
        activeLeads,
        totalOrders: staffOrders.length,
        totalSales,
        efficiency: totalVisits > 0 ? Math.round((conversions / totalVisits) * 100) : 0,
      };
    })
    .sort((a, b) => b.conversions - a.conversions || b.totalVisits - a.totalVisits);
}
