"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Contact,
  UserCog,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { canAccessLeads, canAccessOrders, canManageUsers } from "@/lib/permissions";
import type { Profile } from "@/lib/types/database";

const allNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { href: "/leads", label: "Leads", icon: Contact, key: "leads" as const },
  { href: "/orders", label: "Orders", icon: ShoppingBag, key: "orders" as const },
  { href: "/whatsapp", label: "WhatsApp", icon: WhatsAppIcon, key: "whatsapp" as const },
];

const adminNavItems = [
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/users", label: "Users", icon: UserCog },
];

function getNavItems(profile: Profile) {
  return allNavItems.filter((item) => {
    if (item.key === "leads") return canAccessLeads(profile);
    if (item.key === "orders") return canAccessOrders(profile);
    if (item.key === "whatsapp") return canAccessLeads(profile) || canAccessOrders(profile);
    return true;
  });
}

export function SidebarNav({
  profile,
  onNavigate,
  className,
}: {
  profile: Profile;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const navItems = getNavItems(profile);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-amber-700/20 text-amber-400"
        : "text-stone-400 hover:bg-stone-900 hover:text-stone-200"
    );

  return (
    <nav className={cn("flex-1 space-y-1 px-3 py-4", className)}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} onClick={onNavigate} className={linkClass(active)}>
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
      {canManageUsers(profile.role) &&
        adminNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={onNavigate} className={linkClass(active)}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
    </nav>
  );
}

export function MobileBottomNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const items = [
    ...getNavItems(profile),
    ...(canManageUsers(profile.role) ? adminNavItems : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-stretch justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium sm:text-xs",
                active ? "text-amber-700" : "text-stone-500"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-amber-700")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
