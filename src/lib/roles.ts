import type { UserRole } from "@/lib/types/database";

export const STAFF_ROLES: UserRole[] = [
  "sales_agent",
  "sales_manager",
  "sales_executive",
  "leading_staff",
];

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "sales_executive", label: "Sales Executive" },
  { value: "leading_staff", label: "Leading Staff" },
  { value: "sales_agent", label: "Sales Agent" },
];

export function formatRole(role: UserRole): string {
  return USER_ROLES.find((r) => r.value === role)?.label ?? role.replace(/_/g, " ");
}

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin";
}
