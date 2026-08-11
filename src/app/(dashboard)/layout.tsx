import { getImpersonationMeta } from "@/lib/auth/impersonation.server";
import { requireProfile } from "@/lib/auth/session";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, impersonationMeta] = await Promise.all([
    requireProfile(),
    getImpersonationMeta(),
  ]);

  return (
    <DashboardLayoutClient profile={profile} impersonationMeta={impersonationMeta}>
      {children}
    </DashboardLayoutClient>
  );
}
