import { Suspense } from "react";
import DailyReportPageClient from "./daily-report-client";

export default function DailyReportPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-stone-400">Loading report...</div>}>
      <DailyReportPageClient />
    </Suspense>
  );
}
