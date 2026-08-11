"use client";

import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/layout/page-header";

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <PageHeader
        title="New Order"
        description="Create a furniture order with product details & payment"
      />
      <OrderForm />
    </div>
  );
}
