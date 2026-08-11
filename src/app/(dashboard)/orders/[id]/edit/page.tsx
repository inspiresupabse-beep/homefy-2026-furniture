import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/layout/page-header";
import type { Order } from "@/lib/types/database";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        title={`Edit ${order.order_number}`}
        description="Update customer details, products, payment and delivery"
      />
      <OrderForm order={order as Order} />
    </div>
  );
}
