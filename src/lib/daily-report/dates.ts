import { DAILY_REPORT_TIMEZONE } from "@/lib/daily-report/constants";

export function getReportDateIso(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function formatReportDateLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export function isOnReportDate(isoTimestamp: string, reportDate: string): boolean {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_REPORT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoTimestamp));
  return day === reportDate;
}
