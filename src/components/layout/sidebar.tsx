"use client";

import { LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRole } from "@/lib/roles";
import { AddToHomeScreen } from "@/components/layout/add-to-home-screen";
import { HomefyLogo } from "@/components/layout/homefy-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import type { Profile } from "@/lib/types/database";

export function Sidebar({
  profile,
  onNavigate,
  onClose,
}: {
  profile: Profile;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full max-h-[100dvh] w-full flex-col overflow-hidden border-r border-stone-200 bg-stone-950 text-stone-100">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-800 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <HomefyLogo size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-white">Homefy</p>
            <p className="text-xs text-stone-400">Furniture CRM</p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-900 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="shrink-0 border-b border-stone-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{profile.full_name}</p>
            <p className="truncate text-xs text-stone-400">{formatRole(profile.role)}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-2 text-xs font-medium text-stone-200 transition-colors hover:border-stone-600 hover:bg-stone-800"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>

      <SidebarNav profile={profile} onNavigate={onNavigate} className="min-h-0 flex-1 overflow-y-auto" />

      <div className="shrink-0 border-t border-stone-800 p-3">
        <AddToHomeScreen variant="sidebar" />
      </div>
    </aside>
  );
}

export async function signOutUser() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
