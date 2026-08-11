"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ORDER_STATUSES, type Logistics, type Order, type ProductLineItem } from "@/lib/types/database";
import { ArrowLeft, FileText, Pencil, Trash2, Truck } from "lucide-react";

export function OrderDetail({
  order,
  canEdit = true,
  canDelete = false,
  saved = false,
}: {
  order: Order;
  canEdit?: boolean;
  canDelete?: boolean;
  saved?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const logistics = (Array.isArray(order.logistics) ? order.logistics[0] : order.logistics) as Logistics | null;

  const [transport, setTransport] = useState({
    transport_cost: logistics?.transport_cost ?? 0,
    company_share: logistics?.company_share ?? 0,
    customer_share: logistics?.customer_share ?? 0,
    vehicle_number: logistics?.vehicle_number ?? "",
    driver_name: logistics?.driver_name ?? "",
    dispatch_date: logistics?.dispatch_date ?? "",
    notes: logistics?.notes ?? "",
  });

  const products = (order.product_details as ProductLineItem[]) ?? [];

  function handleTransportCostChange(cost: number) {
    setTransport((prev) => ({
      ...prev,
      transport_cost: cost,
      company_share: prev.company_share,
      customer_share: cost - prev.company_share,
    }));
  }

  function handleCompanyShareChange(share: number) {
    setTransport((prev) => ({
      ...prev,
      company_share: share,
      customer_share: prev.transport_cost - share,
    }));
  }

  async function saveLogistics() {
    setSaving(true);
    const payload = {
      order_id: order.id,
      transport_cost: transport.transport_cost,
      company_share: transport.company_share,
      customer_share: transport.customer_share,
      vehicle_number: transport.vehicle_number || null,
      driver_name: transport.driver_name || null,
      dispatch_date: transport.dispatch_date || null,
      notes: transport.notes || null,
    };

    if (logistics) {
      await supabase.from("logistics").update(payload).eq("id", logistics.id);
    } else {
      await supabase.from("logistics").insert(payload);
    }

    setSaving(false);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `Delete order ${order.order_number} for ${order.customer_name}? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleting(true);
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/orders");
    router.refresh();
  }

  const statusLabel = ORDER_STATUSES.find((s) => s.value === order.status)?.label;

  return (
    <div className="space-y-4 sm:space-y-6">
      {saved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Order saved successfully.
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link href="/orders" className="self-start">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-stone-900 sm:text-2xl">
              {order.order_number}
            </h1>
            <p className="truncate text-sm text-stone-500 sm:text-base">
              {order.customer_name} · {statusLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {canEdit && (
            <Link href={`/orders/${order.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="mr-1 h-4 w-4" /> Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          )}
          <Link href={`/orders/${order.id}/invoice`}>
            <Button variant="secondary" size="sm">
              <FileText className="mr-1 h-4 w-4" /> Sales Order / Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-stone-900">Order Summary</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-stone-400">Phone</p>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div>
                <p className="text-stone-400">Delivery Date</p>
                <p className="font-medium">
                  {order.delivery_date
                    ? new Date(order.delivery_date).toLocaleDateString("en-IN")
                    : "Not set"}
                </p>
              </div>
              {order.site_visit_date && (
                <div>
                  <p className="text-stone-400">Site / shop visit date</p>
                  <p className="font-medium">
                    {new Date(order.site_visit_date).toLocaleDateString("en-IN")}
                  </p>
                </div>
              )}
              {order.staff_agent && (
                <div>
                  <p className="text-stone-400">Assigned staff</p>
                  <p className="font-medium">{order.staff_agent.full_name}</p>
                </div>
              )}
              {order.address && (
                <div className="col-span-2">
                  <p className="text-stone-400">Address</p>
                  <p className="font-medium">{order.address}</p>
                </div>
              )}
              {order.narration && (
                <div className="col-span-2">
                  <p className="text-stone-400">Visit narration</p>
                  <p className="whitespace-pre-wrap font-medium text-stone-700">
                    {order.narration}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-stone-100 pt-4">
              <h3 className="mb-2 text-sm font-medium text-stone-700">Products</h3>
              <div className="space-y-2">
                {products.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{p.name} × {p.quantity}</span>
                    <span>{formatCurrency(p.quantity * p.unit_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 border-t border-stone-100 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Discount</span>
                <span className="text-red-600">−{formatCurrency(Number(order.discount))}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Advance Paid</span>
                <span className="text-emerald-600">{formatCurrency(Number(order.advance_payment))}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Balance Due</span>
                <span className="text-amber-700">{formatCurrency(Number(order.balance))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-amber-700" />
              <h2 className="font-semibold text-stone-900">Logistics</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Transport Cost (₹)</Label>
              <Input
                type="number"
                min={0}
                value={transport.transport_cost || ""}
                onChange={(e) => handleTransportCostChange(Number(e.target.value))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Company Share (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  max={transport.transport_cost}
                  value={transport.company_share || ""}
                  onChange={(e) => handleCompanyShareChange(Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Customer Share (₹)</Label>
                <Input
                  type="number"
                  value={transport.customer_share || ""}
                  disabled
                  className="bg-stone-50"
                />
              </div>
            </div>
            <div className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
              Company + Customer shares must equal total transport cost
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Vehicle Number</Label>
                <Input
                  placeholder="MH 12 AB 1234"
                  value={transport.vehicle_number}
                  onChange={(e) => setTransport({ ...transport, vehicle_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Driver Name</Label>
                <Input
                  value={transport.driver_name}
                  onChange={(e) => setTransport({ ...transport, driver_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Dispatch Date</Label>
              <Input
                type="date"
                value={transport.dispatch_date}
                onChange={(e) => setTransport({ ...transport, dispatch_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={transport.notes}
                onChange={(e) => setTransport({ ...transport, notes: e.target.value })}
              />
            </div>
            <Button onClick={saveLogistics} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Logistics"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
