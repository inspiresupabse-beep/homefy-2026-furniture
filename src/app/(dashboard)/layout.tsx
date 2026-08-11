import { getImpersonationMetaFromCookies } from "@/lib/auth/impersonation.server";
import { requireProfile } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, impersonationMeta] = await Promise.all([
    requireProfile(),
    getImpersonationMetaFromCookies(),
  ]);

  return (
    <DashboardShell
      key={profile.id}
      profile={profile}
      impersonationMeta={impersonationMeta}
    >
      {children}
    </DashboardShell>
  );
}
