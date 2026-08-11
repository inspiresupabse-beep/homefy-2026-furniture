"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardPageSkeleton } from "@/components/layout/dashboard-page-skeleton";
import type { Profile } from "@/lib/types/database";

export function DashboardAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (!data) {
        router.replace("/login");
        return;
      }

      setProfile(data as Profile);
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-stone-50">
        <div className="hidden w-64 shrink-0 border-r border-stone-200 bg-stone-950 lg:block" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="h-14 border-b border-stone-200 bg-white" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <DashboardPageSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
