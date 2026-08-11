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

      <div className="space-y-3 md:hidden">
        {orderList.map((order) => (
          <Card key={order.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="font-semibold text-amber-700 hover:underline"
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
              <div className="flex flex-wrap gap-2 pt-1">
                {canEdit && (
                  <Link href={`/orders/${order.id}/edit`}>
                    <Button type="button" size="sm" variant="secondary" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </Link>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    className="gap-1.5"
                    onClick={() => handleDelete(order)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {orderList.length === 0 && (
          <p className="py-12 text-center text-sm text-stone-400">
            No orders yet. Create your first order to get started.
          </p>
        )}
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-left text-stone-500">
                  <th className="px-4 py-3 font-medium lg:px-6">Order #</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Customer</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Total</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Advance</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Balance</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Delivery</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Status</th>
                  <th className="px-4 py-3 font-medium lg:px-6">Agent</th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3 font-medium lg:px-6">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {orderList.map((order) => (
                  <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                    <td className="px-4 py-4 lg:px-6">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-amber-700 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <div>{order.customer_name}</div>
                      <div className="text-xs text-stone-400">{order.phone}</div>
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      {formatCurrency(Number(order.total))}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      {formatCurrency(Number(order.advance_payment))}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
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
                    <td className="px-4 py-4 text-stone-500 lg:px-6">
                      {order.delivery_date
                        ? new Date(order.delivery_date).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-4 py-4 lg:px-6">
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs capitalize">
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-stone-500 lg:px-6">
                      {(order.assigned_agent as { full_name: string } | null)?.full_name ?? "—"}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-4 lg:px-6">
                        <div className="flex flex-wrap gap-2">
                          {canEdit && (
                            <Link href={`/orders/${order.id}/edit`}>
                              <Button type="button" size="sm" variant="secondary" className="gap-1.5">
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            </Link>
                          )}
                          {canDelete && (
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              className="gap-1.5"
                              onClick={() => handleDelete(order)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
