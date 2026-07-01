import { DashboardAuthProvider } from "@/components/layout/dashboard-auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAuthProvider>{children}</DashboardAuthProvider>;
}
