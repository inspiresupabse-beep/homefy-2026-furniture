"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useNotifications } from "@/components/notifications/notification-provider";
import type { LeadReminder, Profile } from "@/lib/types/database";
import { Bell, Trash2 } from "lucide-react";

export function LeadRemindersSection({
  leadId,
  agents,
  defaultUserId,
}: {
  leadId: string;
  agents: Profile[];
  defaultUserId?: string | null;
}) {
  const supabase = createClient();
  const { refresh: refreshNotifications } = useNotifications();
  const [reminders, setReminders] = useState<LeadReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "Follow up call",
    message: "",
    remind_at: "",
    user_id: defaultUserId ?? "",
  });

  const loadReminders = useCallback(async () => {
    const { data } = await supabase
      .from("lead_reminders")
      .select("*")
      .eq("lead_id", leadId)
      .order("remind_at", { ascending: true });
    setReminders((data as LeadReminder[]) ?? []);
  }, [supabase, leadId]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.remind_at || !form.user_id) return;

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("lead_reminders").insert({
      lead_id: leadId,
      user_id: form.user_id,
      title: form.title,
      message: form.message || null,
      remind_at: new Date(form.remind_at).toISOString(),
      created_by: user?.id ?? null,
    });

    setLoading(false);
    if (!error) {
      setForm((f) => ({ ...f, message: "", remind_at: "" }));
      await loadReminders();
      await refreshNotifications();
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("lead_reminders").delete().eq("id", id);
    await loadReminders();
    await refreshNotifications();
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-700" />
        <h3 className="text-sm font-semibold text-stone-900">Reminders</h3>
      </div>

      <form onSubmit={handleAdd} className="space-y-3">
        <div>
          <Label>Title</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Date & time</Label>
            <Input
              type="datetime-local"
              value={form.remind_at}
              onChange={(e) => setForm({ ...form, remind_at: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Notify</Label>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base sm:py-2 sm:text-sm"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              required
            >
              <option value="">Select staff</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Message (optional)</Label>
          <Textarea
            rows={2}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Adding..." : "Add Reminder"}
        </Button>
      </form>

      {reminders.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-stone-200 pt-3">
          {reminders.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-stone-800">{r.title}</p>
                <p className="text-xs text-stone-500">
                  {new Date(r.remind_at).toLocaleString("en-IN")}
                </p>
                {r.message && <p className="text-xs text-stone-400">{r.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                className="text-stone-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
