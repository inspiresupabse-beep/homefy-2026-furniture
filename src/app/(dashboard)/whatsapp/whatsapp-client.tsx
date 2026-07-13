"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import {
  WhatsAppListenerPanel,
  sendViaListener,
  type ListenerStatus,
} from "@/components/whatsapp/whatsapp-listener-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  buildWhatsAppUrl,
  defaultFollowUpMessage,
  defaultLeadMessage,
  defaultOrderMessage,
} from "@/lib/whatsapp";
import { getLeadStatusLabel, type Lead, type LeadReminder, type Order } from "@/lib/types/database";
import { ExternalLink, Flame, Bell, Package, Send } from "lucide-react";

type DeliveryReminderRow = {
  id: string;
  reminder_type: string;
  scheduled_for: string;
  status: string;
  phone: string;
  message: string;
  order: { order_number: string; customer_name: string } | null;
};

function WhatsAppLinkButton({
  phone,
  message,
  label = "WhatsApp",
  compact,
}: {
  phone: string;
  message?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <a href={buildWhatsAppUrl(phone, message)} target="_blank" rel="noopener noreferrer" className="inline-flex">
      <Button
        type="button"
        size={compact ? "sm" : "md"}
        className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
      >
        <WhatsAppIcon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {label}
        <ExternalLink className="h-3 w-3 opacity-70" />
      </Button>
    </a>
  );
}

function LinkedSendButton({
  phone,
  customerName,
  message,
  listenerReady,
  compact,
}: {
  phone: string;
  customerName: string;
  message: string;
  listenerReady: boolean;
  compact?: boolean;
}) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!listenerReady) return null;

  async function handleSend() {
    setSending(true);
    setFeedback(null);
    const result = await sendViaListener(phone, customerName, message);
    setSending(false);
    setFeedback(result.ok ? "Sent!" : result.error ?? "Failed");
    if (result.ok) setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size={compact ? "sm" : "md"}
        variant="secondary"
        className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
        disabled={sending}
        onClick={handleSend}
      >
        <Send className="h-3.5 w-3.5" />
        {sending ? "Sending…" : "Send via linked WhatsApp"}
      </Button>
      {feedback && (
        <span className={`text-xs ${feedback === "Sent!" ? "text-emerald-600" : "text-red-600"}`}>
          {feedback}
        </span>
      )}
    </div>
  );
}

export default function WhatsAppPageClient() {
  const supabaseRef = useRef(createClient());
  const [loading, setLoading] = useState(true);
  const [listenerStatus, setListenerStatus] = useState<ListenerStatus>("connecting");
  const [dueReminders, setDueReminders] = useState<LeadReminder[]>([]);
  const [hotLeads, setHotLeads] = useState<Lead[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [deliveryReminders, setDeliveryReminders] = useState<DeliveryReminderRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const listenerReady = listenerStatus === "ready";

  const fetchData = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const admin = profile?.role === "admin";
    setIsAdmin(admin);

    const now = new Date().toISOString();

    const [remindersRes, hotRes, ordersRes] = await Promise.all([
      supabase
        .from("lead_reminders")
        .select("*, lead:leads(id, customer_name, phone)")
        .eq("user_id", user.id)
        .is("read_at", null)
        .lte("remind_at", now)
        .order("remind_at", { ascending: true })
        .limit(20),
      supabase
        .from("leads")
        .select("id, customer_name, phone, status, temperature, conversion_probability")
        .eq("temperature", "hot")
        .neq("status", "converted")
        .order("conversion_probability", { ascending: false })
        .limit(12),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, phone, status, balance, delivery_date")
        .in("status", ["pending", "in_production", "ready"])
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    setDueReminders((remindersRes.data as LeadReminder[]) ?? []);
    setHotLeads((hotRes.data as Lead[]) ?? []);
    setRecentOrders((ordersRes.data as Order[]) ?? []);

    if (admin) {
      const { data: delivery } = await supabase
        .from("delivery_reminders")
        .select(
          "id, reminder_type, scheduled_for, status, phone, message, order:orders(order_number, customer_name)"
        )
        .eq("status", "pending")
        .order("scheduled_for", { ascending: true })
        .limit(20);

      setDeliveryReminders(
        (delivery ?? []).map((row) => {
          const order = Array.isArray(row.order) ? row.order[0] : row.order;
          return { ...row, order: order as DeliveryReminderRow["order"] };
        })
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="WhatsApp"
        description="Link WhatsApp, message customers, and follow up on leads & orders"
      />

      <WhatsAppListenerPanel onStatusChange={setListenerStatus} />

      {dueReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              <h2 className="font-semibold text-stone-900">Due follow-ups</h2>
            </div>
            <p className="text-sm text-stone-500">{dueReminders.length} reminder(s) ready to action</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {dueReminders.map((reminder) => {
              const lead = reminder.lead;
              if (!lead?.phone) return null;
              const msg = defaultFollowUpMessage(lead.customer_name, reminder.title);
              return (
                <div
                  key={reminder.id}
                  className="flex flex-col gap-3 rounded-lg border border-stone-100 bg-stone-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{lead.customer_name}</p>
                    <p className="text-sm text-stone-500">{reminder.title}</p>
                    <p className="text-xs text-stone-400">{lead.phone}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LinkedSendButton
                      phone={lead.phone}
                      customerName={lead.customer_name}
                      message={reminder.title}
                      listenerReady={listenerReady}
                      compact
                    />
                    <WhatsAppLinkButton phone={lead.phone} message={msg} compact />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {hotLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-stone-900">Hot leads</h2>
            </div>
            <p className="text-sm text-stone-500">Priority customers to contact now</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {hotLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col gap-3 rounded-lg border border-red-100 bg-red-50/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-stone-900">{lead.customer_name}</p>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      {lead.conversion_probability ?? 0}%
                    </span>
                  </div>
                  <p className="text-sm text-stone-500">{getLeadStatusLabel(lead.status)}</p>
                  <p className="text-xs text-stone-400">{lead.phone}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkedSendButton
                    phone={lead.phone}
                    customerName={lead.customer_name}
                    message="Following up on your furniture inquiry"
                    listenerReady={listenerReady}
                    compact
                  />
                  <WhatsAppLinkButton
                    phone={lead.phone}
                    message={defaultLeadMessage(lead.customer_name)}
                    compact
                  />
                  <Link href={`/leads?open=${lead.id}`}>
                    <Button variant="secondary" size="sm">
                      View lead
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-700" />
              <h2 className="font-semibold text-stone-900">Active orders</h2>
            </div>
            <p className="text-sm text-stone-500">Message customers about open orders</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-lg border border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">
                    {order.customer_name}{" "}
                    <span className="text-stone-400">· {order.order_number}</span>
                  </p>
                  <p className="text-sm capitalize text-stone-500">{order.status.replace("_", " ")}</p>
                  <p className="text-xs text-stone-400">{order.phone}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkedSendButton
                    phone={order.phone}
                    customerName={order.customer_name}
                    message={`Update on your order ${order.order_number}`}
                    listenerReady={listenerReady}
                    compact
                  />
                  <WhatsAppLinkButton
                    phone={order.phone}
                    message={defaultOrderMessage(order.customer_name, order.order_number)}
                    compact
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isAdmin && deliveryReminders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="font-semibold text-stone-900">Scheduled delivery reminders</h2>
            <p className="text-sm text-stone-500">Auto WhatsApp messages for upcoming deliveries (admin)</p>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {deliveryReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-lg border border-stone-100 bg-stone-50/50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">
                      {reminder.order?.customer_name ?? "Customer"} ·{" "}
                      {reminder.order?.order_number ?? "Order"}
                    </p>
                    <p className="text-sm text-stone-500">
                      {reminder.reminder_type.replace("_", " ")} ·{" "}
                      {new Date(reminder.scheduled_for).toLocaleDateString("en-IN")}
                    </p>
                    <p className="mt-2 text-sm text-stone-600">{reminder.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <LinkedSendButton
                      phone={reminder.phone}
                      customerName={reminder.order?.customer_name ?? "Customer"}
                      message={reminder.message}
                      listenerReady={listenerReady}
                      compact
                    />
                    <WhatsAppLinkButton phone={reminder.phone} message={reminder.message} compact />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {dueReminders.length === 0 &&
        hotLeads.length === 0 &&
        recentOrders.length === 0 &&
        deliveryReminders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-stone-500">
              <WhatsAppIcon className="mx-auto mb-3 h-10 w-10 text-[#25D366]" />
              <p className="font-medium text-stone-700">No contacts ready right now</p>
              <p className="mt-1 text-sm">Link WhatsApp above or add leads to start messaging.</p>
              <Link href="/leads" className="mt-4 inline-block">
                <Button variant="secondary">Go to Leads</Button>
              </Link>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
