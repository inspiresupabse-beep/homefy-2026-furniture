import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth/session";
import { canEditData } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import { OrderDetail } from "@/components/orders/order-detail";
import type { Order } from "@/lib/types/database";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supabase, profile] = await Promise.all([createClient(), requireProfile()]);

  const { data: order } = await supabase
    .from("orders")
    .select("*, logistics(*), assigned_agent:profiles!orders_assigned_to_fkey(*), staff_agent:profiles!orders_assigned_staff_fkey(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  return (
    <OrderDetail
      order={order as Order}
      canEdit={canEditData(profile)}
      canDelete={isAdminRole(profile.role)}
    />
  );
}
