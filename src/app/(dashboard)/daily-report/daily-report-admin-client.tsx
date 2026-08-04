"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  adminDeleteDailyReport,
  adminUpsertDailyReport,
} from "@/app/(dashboard)/daily-report/actions";
import { ReportMetricsForm } from "@/components/daily-report/report-metrics-form";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getReportDateIso, formatReportDateLabel } from "@/lib/daily-report/dates";
import { mapReportRow } from "@/lib/daily-report/map-report";
import { EMPTY_DAILY_METRICS, type DailyStaffReport } from "@/lib/daily-report/types";
import { STAFF_ROLES } from "@/lib/roles";
import { formatCurrency } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";
import { CheckCircle2, Circle, Plus, Trash2, User } from "lucide-react";

type StaffMember = Pick<Profile, "id" | "full_name" | "role">;

type ReportWithStaff = DailyStaffReport & {
  staff_name: string;
};

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function DailyReportAdminClient() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());

  const [selectedDate, setSelectedDate] = useState(getReportDateIso());
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [reports, setReports] = useState<ReportWithStaff[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ ...EMPTY_DAILY_METRICS });
  const [notes, setNotes] = useState("");
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newStaffId, setNewStaffId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedReport = useMemo(
    () => reports.find((r) => r.user_id === selectedUserId) ?? null,
    [reports, selectedUserId]
  );

  const selectedStaffName = useMemo(() => {
    if (selectedReport) return selectedReport.staff_name;
    return staff.find((s) => s.id === selectedUserId)?.full_name ?? "";
  }, [selectedReport, selectedUserId, staff]);

  const staffRows = useMemo(() => {
    const reportByUser = new Map(reports.map((r) => [r.user_id, r]));
    return staff.map((member) => {
      const report = reportByUser.get(member.id);
      return {
        ...member,
        report,
        sent: Boolean(report?.sent_at),
      };
    });
  }, [staff, reports]);

  const loadData = useCallback(async () => {
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

    const [{ data: profileData }, { data: staffData }, { data: reportsData }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", STAFF_ROLES)
        .order("full_name"),
      supabase
        .from("daily_staff_reports")
        .select("*, profiles(full_name)")
        .eq("report_date", selectedDate)
        .order("created_at", { ascending: false }),
    ]);

    if (profileData?.role !== "admin") {
      router.replace("/daily-report");
      return;
    }

    const staffList = (staffData ?? []) as StaffMember[];
    setStaff(staffList);

    const mappedReports: ReportWithStaff[] = (reportsData ?? []).map((row) => {
      const report = mapReportRow(row as Record<string, unknown>);
      const profile = row.profiles as { full_name?: string } | null;
      return {
        ...report,
        staff_name: profile?.full_name ?? "Unknown",
      };
    });
    setReports(mappedReports);

    setLoading(false);
  }, [router, selectedDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (addingNew) return;

    if (selectedReport) {
      setReportId(selectedReport.id ?? null);
      setMetrics({
        leads_assigned: selectedReport.leads_assigned,
        leads_contacted: selectedReport.leads_contacted,
        interested_customers: selectedReport.interested_customers,
        shop_visits_planned: selectedReport.shop_visits_planned,
        orders_confirmed: selectedReport.orders_confirmed,
        not_interested: selectedReport.not_interested,
        no_response: selectedReport.no_response,
        pending_follow_up: selectedReport.pending_follow_up,
        advance_received: selectedReport.advance_received,
      });
      setNotes(selectedReport.notes ?? "");
      setSentAt(selectedReport.sent_at);
      return;
    }

    if (selectedUserId) {
      setReportId(null);
      setMetrics({ ...EMPTY_DAILY_METRICS });
      setNotes("");
      setSentAt(null);
    }
  }, [addingNew, selectedReport, selectedUserId]);

  function selectStaff(userId: string) {
    setAddingNew(false);
    setSelectedUserId(userId);
    setMessage(null);
    setError(null);
  }

  function startAddReport() {
    setAddingNew(true);
    setSelectedUserId(null);
    setReportId(null);
    setNewStaffId(staff[0]?.id ?? "");
    setMetrics({ ...EMPTY_DAILY_METRICS });
    setNotes("");
    setSentAt(null);
    setMessage(null);
    setError(null);
  }

  async function handleSave() {
    const userId = addingNew ? newStaffId : selectedUserId;
    if (!userId) {
      setError("Select a staff member.");
      return;
    }

    setSaving(true);
    setError(null);

    const result = await adminUpsertDailyReport({
      user_id: userId,
      report_date: selectedDate,
      notes,
      sent_at: sentAt,
      ...metrics,
    });

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setMessage(addingNew ? "Report added." : "Report updated.");
    setAddingNew(false);
    setSelectedUserId(userId);
    await loadData();
  }

  async function handleDelete() {
    if (!reportId) return;
    if (!window.confirm("Delete this report? This cannot be undone.")) return;

    setDeleting(true);
    setError(null);

    const result = await adminDeleteDailyReport(reportId);
    setDeleting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setMessage("Report deleted.");
    setSelectedUserId(null);
    setReportId(null);
    setAddingNew(false);
    await loadData();
  }

  if (loading) return <DashboardPageSkeleton />;

  const showDetail = addingNew || Boolean(selectedUserId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Daily Reports"
        description="View, add, edit, and delete staff daily ad reports"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <Label htmlFor="report-date">Report date</Label>
          <Input
            id="report-date"
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedUserId(null);
              setAddingNew(false);
              setMessage(null);
              setError(null);
            }}
          />
        </div>
        <Button type="button" onClick={startAddReport} className="gap-2">
          <Plus className="h-4 w-4" />
          Add report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-stone-900">
              Received reports — {formatReportDateLabel(selectedDate)}
            </h2>
            <p className="text-sm text-stone-500">Select a staff member to view details</p>
          </CardHeader>
          <CardContent className="p-0">
            {staffRows.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-stone-500">No staff members found.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {staffRows.map((row) => {
                  const active = !addingNew && selectedUserId === row.id;
                  const hasReport = Boolean(row.report);

                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => selectStaff(row.id)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                          active ? "bg-amber-50" : "hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100">
                            <User className="h-4 w-4 text-stone-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-stone-900">{row.full_name}</p>
                            <p className="text-xs text-stone-500">
                              {hasReport ? (row.sent ? "Report sent" : "Draft saved") : "No report"}
                            </p>
                          </div>
                        </div>
                        {row.sent ? (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        ) : hasReport ? (
                          <Circle className="h-5 w-5 shrink-0 text-amber-500" />
                        ) : (
                          <Circle className="h-5 w-5 shrink-0 text-stone-300" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <h2 className="font-semibold text-stone-900">
              {addingNew
                ? "Add new report"
                : selectedUserId
                  ? `${selectedStaffName}'s report`
                  : "Report details"}
            </h2>
            {!showDetail && (
              <p className="text-sm text-stone-500">Select a staff member from the list</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!showDetail ? (
              <p className="text-sm text-stone-500">
                Choose a staff name to see their full daily report, or add a new one.
              </p>
            ) : (
              <>
                {addingNew && (
                  <div>
                    <Label htmlFor="staff-select">Staff member</Label>
                    <Select
                      id="staff-select"
                      value={newStaffId}
                      onChange={(e) => setNewStaffId(e.target.value)}
                    >
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                {!addingNew && selectedReport && (
                  <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
                    <p>
                      Status:{" "}
                      {sentAt ? (
                        <span className="font-medium text-emerald-700">
                          Sent at {new Date(sentAt).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="font-medium text-amber-700">Not sent yet</span>
                      )}
                    </p>
                    <p className="mt-1">
                      Advance received:{" "}
                      <strong>{formatCurrency(metrics.advance_received)}</strong>
                    </p>
                  </div>
                )}

                <ReportMetricsForm
                  metrics={metrics}
                  notes={notes}
                  onMetricsChange={setMetrics}
                  onNotesChange={setNotes}
                />

                {!addingNew && (
                  <div>
                    <Label htmlFor="sent-at">Sent at (optional)</Label>
                    <Input
                      id="sent-at"
                      type="datetime-local"
                      value={sentAt ? toDatetimeLocalValue(sentAt) : ""}
                      onChange={(e) =>
                        setSentAt(e.target.value ? new Date(e.target.value).toISOString() : null)
                      }
                    />
                    <p className="mt-1 text-xs text-stone-400">
                      Clear the field to mark as not sent.
                    </p>
                  </div>
                )}

                {error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
                )}
                {message && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {message}
                  </p>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : addingNew ? "Add report" : "Save changes"}
                  </Button>
                  {!addingNew && reportId && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2 text-red-700 hover:bg-red-50"
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
