"use client";

import DailyReportAdminClient from "./daily-report-admin-client";
import DailyReportStaffClient from "./daily-report-staff-client";

type DailyReportPageClientProps = {
  isAdmin: boolean;
};

export default function DailyReportPageClient({ isAdmin }: DailyReportPageClientProps) {
  if (isAdmin) return <DailyReportAdminClient />;
  return <DailyReportStaffClient />;
}
