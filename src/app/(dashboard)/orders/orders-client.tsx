"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ORDER_STATUSES, type Order } from "@/lib/types/database";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function OrdersPageClient({
  canEdit,
  canDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
}) {
  const supabaseRef = useRef(createClient());
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const { data: orders } = await supabaseRef.current
      .from("orders")
      .select("*, assigned_agent:profiles!orders_assigned_to_fkey(full_name)")
      .order("created_at", { ascending: false });

    setOrderList((orders as Order[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const statusLabel = (status: string) =>
    ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;

  async function handleDelete(order: Order) {
    if (
      !confirm(
        `Delete order ${order.order_number} for ${order.customer_name}? This cannot be undone.`
      )
    ) {
      return;
    }

    const { error } = await supabaseRef.current.from("orders").delete().eq("id", order.id);
    if (error) {
      alert(error.message);
      return;
    }

    void fetchOrders();
  }

  if (loading) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Orders"
        description="Manage furniture orders, payments & delivery"
        action={
          <Link href="/orders/new" className="block w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        }
      />

      <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white md:hidden">
        {orderList.map((order) => (
          <div key={order.id} className="space-y-2 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-semibold text-amber-700 underline decoration-amber-200 underline-offset-2 hover:decoration-amber-500"
                >
                  {order.order_number}
                </Link>
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs">
                  {statusLabel(order.status)}
                </span>
              </div>
              <div>
                <p className="font-medium text-stone-900">{order.customer_name}</p>
                <p className="text-xs text-stone-500">{order.phone}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-stone-400">Total</p>
                  <p className="font-medium">{formatCurrency(Number(order.total))}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Balance</p>
                  <p
                    className={
                      Number(order.balance) > 0
                        ? "font-medium text-amber-700"
                        : "text-emerald-600"
                    }
                  >
                    {formatCurrency(Number(order.balance))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Advance</p>
                  <p>{formatCurrency(Number(order.advance_payment))}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400">Delivery</p>
                  <p className="text-stone-600">
                    {order.delivery_date
                      ? new Date(order.delivery_date).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-t border-stone-100 pt-2">
                {canEdit && (
                  <Link href={`/orders/${order.id}/edit`}>
                    <Button type="button" size="sm" variant="secondary" className="h-7 gap-1 px-2 text-xs">
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => handleDelete(order)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                )}
              </div>
          </div>
        ))}
        {orderList.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            No orders yet. Create your first order to get started.
          </p>
        )}
      </div>

      <Card className="hidden overflow-hidden border-stone-200 md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="px-3 py-2 font-medium lg:px-4">Order #</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Customer</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Total</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Advance</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Balance</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Delivery</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Status</th>
                  <th className="px-3 py-2 font-medium lg:px-4">Agent</th>
                  {(canEdit || canDelete) && (
                    <th className="px-3 py-2 font-medium lg:px-4">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {orderList.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60">
                    <td className="px-3 py-2 lg:px-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-amber-700 underline decoration-amber-200 underline-offset-2 hover:decoration-amber-500"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2 lg:px-4">
                      <div className="font-medium leading-tight">{order.customer_name}</div>
                      <div className="text-xs leading-tight text-stone-400">{order.phone}</div>
                    </td>
                    <td className="px-3 py-2 lg:px-4">
                      {formatCurrency(Number(order.total))}
                    </td>
                    <td className="px-3 py-2 lg:px-4">
                      {formatCurrency(Number(order.advance_payment))}
                    </td>
                    <td className="px-3 py-2 lg:px-4">
                      <span
                        className={
                          Number(order.balance) > 0
                            ? "font-medium text-amber-700"
                            : "text-emerald-600"
                        }
                      >
                        {formatCurrency(Number(order.balance))}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-stone-500 lg:px-4">
                      {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 lg:px-4">
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs capitalize">
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-stone-500 lg:px-4">
                      {(order.assigned_agent as { full_name: string } | null)?.full_name ?? "—"}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-3 py-2 lg:px-4">
                        <div className="flex items-center gap-1.5">
                          {canEdit && (
                            <Link href={`/orders/${order.id}/edit`}>
                              <Button type="button" size="sm" variant="secondary" className="h-7 gap-1 px-2 text-xs">
                                <Pencil className="h-3 w-3" />
                                Edit
                              </Button>
                            </Link>
                          )}
                          {canDelete && (
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              className="h-7 gap-1 px-2 text-xs"
                              onClick={() => handleDelete(order)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {orderList.length === 0 && (
                  <tr>
                    <td colSpan={canEdit || canDelete ? 9 : 8} className="px-6 py-12 text-center text-stone-400">
                      No orders yet. Create your first order to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
