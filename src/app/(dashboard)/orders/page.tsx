import { requireProfile } from "@/lib/auth/session";
import { canEditData } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import OrdersPageClient from "./orders-client";

export default async function OrdersPage() {
  const profile = await requireProfile();

  return (
    <OrdersPageClient
      canEdit={canEditData(profile)}
      canDelete={isAdminRole(profile.role)}
    />
  );
}
