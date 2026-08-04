"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CreateUserForm } from "@/components/users/create-user-form";
import { UsersList } from "@/components/users/users-list";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

const PANELS = [
  { id: "add", label: "Add User" },
  { id: "team", label: "Team Members" },
] as const;

export default function UsersPageClient() {
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const panelsRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [activePanel, setActivePanel] = useState(0);

  const fetchUsers = useCallback(async () => {
    const supabase = supabaseRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: profile }, { data: team }] = await Promise.all([
      supabase.from("profiles").select("role, id").eq("id", user.id).single(),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);

    if (profile?.role !== "admin") {
      setDenied(true);
      setLoading(false);
      return;
    }

    setCurrentUserId(user.id);
    setUsers((team as Profile[]) ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (denied) router.replace("/");
  }, [denied, router]);

  const scrollToPanel = useCallback((index: number) => {
    const next = Math.min(PANELS.length - 1, Math.max(0, index));
    setActivePanel(next);
    const container = panelsRef.current;
    const panel = container?.children[next] as HTMLElement | undefined;
    panel?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, []);

  useEffect(() => {
    const container = panelsRef.current;
    if (!container) return;

    const onScroll = () => {
      const width = container.clientWidth;
      if (width <= 0) return;
      const index = Math.round(container.scrollLeft / width);
      setActivePanel(Math.min(PANELS.length - 1, Math.max(0, index)));
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [loading]);

  if (loading) return <DashboardPageSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="User Management"
        description="Add, edit, and delete team accounts"
      />

      {/* Mobile: swipe between Add User and Team Members */}
      <div className="space-y-3 lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToPanel(activePanel - 1)}
            disabled={activePanel === 0}
            aria-label="Previous section"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PANELS.map((panel, index) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => scrollToPanel(index)}
                className={cn(
                  "shrink-0 snap-center whitespace-nowrap rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  index === activePanel
                    ? "border-amber-600 text-amber-800 shadow-sm"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                )}
              >
                {panel.label}
                {panel.id === "team" ? ` (${users.length})` : ""}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollToPanel(activePanel + 1)}
            disabled={activePanel >= PANELS.length - 1}
            aria-label="Next section"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={panelsRef}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-full shrink-0 snap-start pr-2">
            <CreateUserForm onCreated={fetchUsers} />
          </div>
          <div className="w-full shrink-0 snap-start pl-2">
            <UsersList
              users={users}
              currentUserId={currentUserId}
              onChanged={fetchUsers}
            />
          </div>
        </div>
      </div>

      {/* Desktop: side by side */}
      <div className="hidden grid-cols-1 gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
        <CreateUserForm onCreated={fetchUsers} />
        <UsersList
          users={users}
          currentUserId={currentUserId}
          onChanged={fetchUsers}
        />
      </div>
    </div>
  );
}
