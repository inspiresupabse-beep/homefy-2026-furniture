import { Suspense } from "react";
import { getProfile } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/roles";
import DailyReportPageClient from "./daily-report-client";

export default async function DailyReportPage() {
  const profile = await getProfile();

  return (
    <Suspense fallback={<div className="py-20 text-center text-stone-400">Loading report...</div>}>
      <DailyReportPageClient isAdmin={profile ? isAdminRole(profile.role) : false} />
    </Suspense>
  );
}
