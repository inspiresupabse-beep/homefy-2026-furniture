import { DashboardShell } from "@/components/layout/dashboard-shell";
import type { ImpersonationMeta } from "@/lib/auth/impersonation";
import type { Profile } from "@/lib/types/database";

export function DashboardLayoutClient({
  profile,
  impersonationMeta,
  children,
}: {
  profile: Profile;
  impersonationMeta: ImpersonationMeta | null;
  children: React.ReactNode;
}) {
  return (
    <DashboardShell profile={profile} impersonationMeta={impersonationMeta}>
      {children}
    </DashboardShell>
  );
}
