import { Suspense } from "react";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { AdminStaffPerformancePanel } from "@/components/dashboard/admin-staff-performance";
import { HotLeadsWidget } from "@/components/dashboard/hot-leads-widget";
import { PageHeader } from "@/components/layout/page-header";
import { getStaffPerformanceData } from "@/lib/insights/staff-performance.server";
import { TrendingUp, Users, CreditCard, Package } from "lucide-react";
import { STAFF_ROLES } from "@/lib/roles";
import type { DashboardStats } from "@/lib/types/database";

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ data: orders }, { data: leads }, { data: profiles }] = await Promise.all([
    supabase.from("orders").select("total, advance_payment, balance, created_at, status"),
    supabase.from("leads").select("id, assigned_to, status"),
    supabase.from("profiles").select("id, full_name, role"),
  ]);

  const deliveredOrders = (orders ?? []).filter((o) => o.status === "delivered");
  const totalSales = deliveredOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingPayments = (orders ?? [])
    .filter((o) => o.status !== "cancelled" && o.status !== "delivered")
    .reduce((sum, o) => sum + Number(o.balance), 0);
  const activeLeads = (leads ?? []).filter((l) => l.status !== "converted").length;

  const agentMap = new Map(
    (profiles ?? [])
      .filter((p) => STAFF_ROLES.includes(p.role))
      .map((p) => [p.id, p.full_name])
  );

  const leadsByAgentMap = new Map<string, number>();
  for (const lead of leads ?? []) {
    if (lead.assigned_to && agentMap.has(lead.assigned_to)) {
      const name = agentMap.get(lead.assigned_to)!;
      leadsByAgentMap.set(name, (leadsByAgentMap.get(name) ?? 0) + 1);
    }
  }

  const leadsByAgent = Array.from(leadsByAgentMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const monthMap = new Map<string, number>();
  for (const order of deliveredOrders) {
    const month = new Date(order.created_at).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
    monthMap.set(month, (monthMap.get(month) ?? 0) + Number(order.total));
  }

  const salesByMonth = Array.from(monthMap.entries()).map(([month, sales]) => ({
    month,
    sales,
  }));

  return {
    totalSales,
    totalOrders: orders?.length ?? 0,
    pendingPayments,
    activeLeads,
    leadsByAgent,
    salesByMonth,
  };
}

export default async function DashboardPage() {
  const profile = await getProfile();

  if (profile?.role === "admin") {
    const staffRows = await getStaffPerformanceData();

    return (
      <div className="space-y-6 sm:space-y-8">
        <PageHeader
          title="Admin Dashboard"
          description="Monitor staff performance — assign power levels in Users"
        />
        <AdminStaffPerformancePanel rows={staffRows} />
      </div>
    );
  }

  const stats = await getDashboardStats();

  const statCards = [
    {
      label: "Total Sales",
      value: formatCurrency(stats.totalSales),
      icon: TrendingUp,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Active Leads",
      value: stats.activeLeads.toString(),
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending Payments",
      value: formatCurrency(stats.pendingPayments),
      icon: CreditCard,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: Package,
      color: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <div className="min-w-0 flex-1 space-y-6 sm:space-y-8">
        <PageHeader
          title="Dashboard"
          description="Overview of Homefy sales & operations"
        />

        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-stone-100 lg:sticky lg:top-6" />}>
          <HotLeadsWidget />
        </Suspense>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6">
                <div className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-stone-500 sm:text-sm">{label}</p>
                  <p className="truncate text-lg font-bold text-stone-900 sm:text-2xl">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DashboardCharts
          leadsByAgent={stats.leadsByAgent}
          salesByMonth={stats.salesByMonth}
        />
      </div>

      <aside className="hidden w-full shrink-0 lg:block lg:w-80 xl:w-96">
        <Suspense fallback={<div className="h-80 animate-pulse rounded-xl bg-stone-100" />}>
          <HotLeadsWidget />
        </Suspense>
      </aside>
    </div>
  );
}
