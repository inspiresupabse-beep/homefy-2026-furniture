"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { markDailyReportSent, upsertDailyReport } from "@/app/(dashboard)/daily-report/actions";
import { ReportMetricsForm } from "@/components/daily-report/report-metrics-form";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DAILY_REPORT_BOSS_PHONE } from "@/lib/daily-report/constants";
import { computeDailyMetrics } from "@/lib/daily-report/compute-metrics";
import { getReportDateIso, formatReportDateLabel } from "@/lib/daily-report/dates";
import { formatDailyReportMessage } from "@/lib/daily-report/format-message";
import { mapReportRow } from "@/lib/daily-report/map-report";
import { EMPTY_DAILY_METRICS } from "@/lib/daily-report/types";
import { canAccessLeads } from "@/lib/permissions";
import { buildWhatsAppUrl, sendMessageViaListener } from "@/lib/whatsapp";
import { getWhatsAppListenerUrl } from "@/lib/whatsapp-listener-config";
import { formatCurrency } from "@/lib/utils";
import type { Lead, Order, Profile } from "@/lib/types/database";
import { CheckCircle2, Circle, ExternalLink, RefreshCw, Send, ClipboardList } from "lucide-react";

type ReportSummary = {
  report_date: string;
  sent_at: string | null;
};

export default function DailyReportStaffClient() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const reportDate = getReportDateIso();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [metrics, setMetrics] = useState({ ...EMPTY_DAILY_METRICS });
  const [notes, setNotes] = useState("");
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [history, setHistory] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [listenerReady, setListenerReady] = useState(false);

  const todaySent = Boolean(sentAt);

  const whatsappMessage = useMemo(() => {
    if (!profile) return "";
    return formatDailyReportMessage({
      reportDate,
      telecallerName: profile.full_name,
      metrics,
      notes,
    });
  }, [profile, reportDate, metrics, notes]);

  const bossWhatsAppUrl = useMemo(
    () => buildWhatsAppUrl(DAILY_REPORT_BOSS_PHONE, whatsappMessage),
    [whatsappMessage]
  );

  const loadReport = useCallback(async () => {
    const supabase = supabaseRef.current;
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: profileData }, { data: leadsData }, { data: ordersData }, { data: reportData }, { data: historyData }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("leads")
          .select(
            "id, status, temperature, conversion_probability, visit_status, site_visit_date, assigned_to, assigned_staff, created_by, created_at, updated_at"
          ),
        supabase
          .from("orders")
          .select("id, lead_id, advance_payment, assigned_to, assigned_staff, created_at, updated_at"),
        supabase
          .from("daily_staff_reports")
          .select("*")
          .eq("user_id", user.id)
          .eq("report_date", reportDate)
          .maybeSingle(),
        supabase
          .from("daily_staff_reports")
          .select("report_date, sent_at")
          .eq("user_id", user.id)
          .order("report_date", { ascending: false })
          .limit(30),
      ]);

    const userProfile = profileData as Profile | null;
    if (!userProfile || !canAccessLeads(userProfile)) {
      router.replace("/");
      return;
    }

    setProfile(userProfile);

    const computed = computeDailyMetrics(
      (leadsData ?? []) as Lead[],
      (ordersData ?? []) as Order[],
      user.id,
      reportDate
    );

    if (reportData) {
      const saved = mapReportRow(reportData as Record<string, unknown>);
      setMetrics({
        leads_assigned: saved.leads_assigned,
        leads_contacted: saved.leads_contacted,
        interested_customers: saved.interested_customers,
        shop_visits_planned: saved.shop_visits_planned,
        orders_confirmed: saved.orders_confirmed,
        not_interested: saved.not_interested,
        no_response: saved.no_response,
        pending_follow_up: saved.pending_follow_up,
        advance_received: saved.advance_received,
      });
      setNotes(saved.notes ?? "");
      setSentAt(saved.sent_at);
    } else {
      setMetrics(computed);
      setNotes("");
      setSentAt(null);
    }

    setHistory(
      (historyData ?? []).map((row) => ({
        report_date: String(row.report_date),
        sent_at: row.sent_at ? String(row.sent_at) : null,
      }))
    );

    setLoading(false);
  }, [reportDate, router]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  useEffect(() => {
    const base = getWhatsAppListenerUrl();
    if (!base) return;

    fetch(`${base}/api/status`)
      .then((r) => r.json())
      .then((data) => setListenerReady(data.status === "ready"))
      .catch(() => setListenerReady(false));
  }, []);

  async function handleSave(showToast = true) {
    setSaving(true);
    setError(null);

    const result = await upsertDailyReport({
      report_date: reportDate,
      notes,
      ...metrics,
    });

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return false;
    }

    if (showToast) setMessage("Report saved.");
    return true;
  }

  async function handleRefreshFromCrm() {
    if (!profile) return;
    setRefreshing(true);
    setError(null);

    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: leadsData }, { data: ordersData }] = await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, status, temperature, conversion_probability, visit_status, site_visit_date, assigned_to, assigned_staff, created_by, created_at, updated_at"
        ),
      supabase
        .from("orders")
        .select("id, lead_id, advance_payment, assigned_to, assigned_staff, created_at, updated_at"),
    ]);

    const computed = computeDailyMetrics(
      (leadsData ?? []) as Lead[],
      (ordersData ?? []) as Order[],
      user.id,
      reportDate
    );

    setMetrics(computed);
    setRefreshing(false);
    setMessage("Numbers refreshed from today's CRM activity.");
  }

  async function handleSendViaListener() {
    setSending(true);
    setError(null);

    const saved = await handleSave(false);
    if (!saved) {
      setSending(false);
      return;
    }

    const result = await sendMessageViaListener(
      DAILY_REPORT_BOSS_PHONE,
      whatsappMessage,
      profile?.full_name,
      profile?.phone
    );
    setSending(false);

    if (!result.ok) {
      setError(result.error ?? "Could not send via linked WhatsApp.");
      return;
    }

    await markDailyReportSent(reportDate);
    setSentAt(new Date().toISOString());
    setMessage("Report sent to boss via linked WhatsApp.");
    void loadReport();
  }

  async function handleOpenWhatsApp() {
    const saved = await handleSave(false);
    if (!saved) return;

    await markDailyReportSent(reportDate);
    setSentAt(new Date().toISOString());
    window.open(bossWhatsAppUrl, "_blank", "noopener,noreferrer");
    setMessage("Opening WhatsApp — tap Send from your phone.");
    void loadReport();
  }

  if (loading || !profile) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Daily Ad Report"
        description="Send your end-of-day summary — only date and sent status are shown here after sending"
      />

      {todaySent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-900">
                Report sent for {formatReportDateLabel(reportDate)}
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                Sent at {new Date(sentAt!).toLocaleString("en-IN")}
              </p>
              <p className="mt-2 text-xs text-emerald-700">
                Your detailed report is stored for admin review only.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Today&apos;s report: {formatReportDateLabel(reportDate)}</p>
            <p className="mt-1 text-amber-800">
              Telecaller: <strong>{profile.full_name}</strong>
              {profile.phone ? ` · Your WhatsApp: ${profile.phone}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold text-stone-900">Report numbers</h2>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleRefreshFromCrm}
                    disabled={refreshing || saving}
                  >
                    <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh from CRM
                  </Button>
                </div>
                <p className="text-sm text-stone-500">
                  Auto-filled from leads & orders you updated today. Edit if needed.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportMetricsForm
                  metrics={metrics}
                  notes={notes}
                  onMetricsChange={setMetrics}
                  onNotesChange={setNotes}
                />

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                )}
                {message && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>
                )}

                <Button type="button" variant="secondary" onClick={() => handleSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save draft"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-semibold text-stone-900">WhatsApp preview</h2>
                <p className="text-sm text-stone-500">
                  Sends to boss: <strong>{DAILY_REPORT_BOSS_PHONE}</strong>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-relaxed text-stone-800">
                  {whatsappMessage}
                </pre>

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
                    onClick={handleOpenWhatsApp}
                    disabled={saving}
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    Send to Boss via WhatsApp
                    <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                  </Button>
                  <p className="text-center text-xs text-stone-500">
                    Opens WhatsApp on your phone — message sends from your number
                  </p>

                  {listenerReady && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full gap-2"
                      onClick={handleSendViaListener}
                      disabled={sending}
                    >
                      <Send className="h-4 w-4" />
                      {sending ? "Sending..." : "Send via linked WhatsApp (PC)"}
                    </Button>
                  )}
                </div>

                <p className="text-xs text-stone-400">
                  Advance total in preview: {formatCurrency(metrics.advance_received)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <ClipboardList className="h-4 w-4 shrink-0" />
                Update leads throughout the day — numbers refresh automatically tomorrow.
              </div>
              <Link href="/leads">
                <Button type="button" variant="secondary" size="sm">
                  Go to Leads
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-stone-900">Your submission history</h2>
          <p className="text-sm text-stone-500">Date and sent status only</p>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-stone-500">No reports yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-500">
                    <th className="pb-2 pr-4 font-medium">Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.report_date} className="border-b border-stone-100 last:border-0">
                      <td className="py-2.5 pr-4 text-stone-800">
                        {formatReportDateLabel(row.report_date)}
                      </td>
                      <td className="py-2.5">
                        {row.sent_at ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-stone-500">
                            <Circle className="h-4 w-4" />
                            Not sent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
