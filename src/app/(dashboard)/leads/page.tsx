import { Suspense } from "react";
import { getProfile } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/roles";
import LeadsPageClient from "./leads-client";

export default async function LeadsPage() {
  const profile = await getProfile();

  return (
    <Suspense fallback={<div className="py-20 text-center text-stone-400">Loading leads...</div>}>
      <LeadsPageClient isAdmin={profile ? isAdminRole(profile.role) : false} />
    </Suspense>
  );
}
