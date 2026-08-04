"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { dispatchOpenLead } from "@/lib/events";
import { playReminderSound } from "@/lib/notifications/sound";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import type { LeadReminder } from "@/lib/types/database";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationContextValue {
  reminders: LeadReminder[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

export function NotificationProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabaseRef = useRef(createClient());
  const ackedPopupIds = useRef(new Set<string>());

  const [reminders, setReminders] = useState<LeadReminder[]>([]);
  const [activePopup, setActivePopup] = useState<LeadReminder | null>(null);

  useBodyScrollLock(!!activePopup);

  const refresh = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("lead_reminders")
      .select("*, lead:leads(id, customer_name, phone)")
      .eq("user_id", userId)
      .order("remind_at", { ascending: true });

    setReminders((data as LeadReminder[]) ?? []);
  }, [userId]);

  const markPopupShown = useCallback(async (id: string) => {
    ackedPopupIds.current.add(id);
    const now = new Date().toISOString();

    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, popup_shown_at: now } : r))
    );

    await supabaseRef.current
      .from("lead_reminders")
      .update({ popup_shown_at: now })
      .eq("id", id);
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();
      ackedPopupIds.current.add(id);

      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, read_at: now, popup_shown_at: r.popup_shown_at ?? now } : r
        )
      );

      await supabaseRef.current
        .from("lead_reminders")
        .update({ read_at: now, popup_shown_at: now })
        .eq("id", id);
    },
    []
  );

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (activePopup) return;

    const due = reminders.find(
      (r) =>
        !r.popup_shown_at &&
        !ackedPopupIds.current.has(r.id) &&
        new Date(r.remind_at) <= new Date()
    );

    if (!due) return;

    setActivePopup(due);
    playReminderSound();
    void markPopupShown(due.id);
  }, [reminders, activePopup, markPopupShown]);

  const unreadCount = useMemo(
    () => reminders.filter((r) => !r.read_at).length,
    [reminders]
  );

  function closePopup() {
    setActivePopup(null);
  }

  function handlePopupDismiss() {
    closePopup();
  }

  async function handlePopupView() {
    if (!activePopup) return;
    const leadId = activePopup.lead_id;
    const reminderId = activePopup.id;

    closePopup();
    await markRead(reminderId);

    if (pathname === "/leads") {
      dispatchOpenLead(leadId);
    } else {
      router.push(`/leads?open=${leadId}`);
    }
  }

  return (
    <NotificationContext.Provider value={{ reminders, unreadCount, refresh, markRead }}>
      {children}
      {activePopup && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center overscroll-contain bg-black/50 p-4 supports-[height:100dvh]:min-h-[100dvh]"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Bell className="h-5 w-5 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-stone-900">{activePopup.title}</h3>
                <p className="mt-1 text-sm text-stone-600">
                  {activePopup.lead?.customer_name ?? "Lead reminder"}
                </p>
                {activePopup.message && (
                  <p className="mt-2 text-sm text-stone-500">{activePopup.message}</p>
                )}
                <p className="mt-1 text-xs text-stone-400">
                  {new Date(activePopup.remind_at).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePopupDismiss}
                className="text-stone-400 hover:text-stone-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={handlePopupDismiss}
              >
                Dismiss
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => void handlePopupView()}
              >
                View Lead
              </Button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
