"use client";

import { Input, Label, Textarea } from "@/components/ui/input";
import { METRIC_FIELDS } from "@/lib/daily-report/metric-fields";
import type { DailyReportMetrics } from "@/lib/daily-report/types";

type ReportMetricsFormProps = {
  metrics: DailyReportMetrics;
  notes: string;
  onMetricsChange: (metrics: DailyReportMetrics) => void;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
};

export function ReportMetricsForm({
  metrics,
  notes,
  onMetricsChange,
  onNotesChange,
  disabled = false,
}: ReportMetricsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {METRIC_FIELDS.map(({ key, label, icon, step }) => (
          <div key={key}>
            <Label htmlFor={key}>
              {icon} {label}
            </Label>
            <Input
              id={key}
              type="number"
              min={0}
              step={step ?? "1"}
              value={metrics[key]}
              disabled={disabled}
              onChange={(e) =>
                onMetricsChange({
                  ...metrics,
                  [key]: step
                    ? Number(e.target.value) || 0
                    : Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
            />
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          rows={3}
          value={notes}
          disabled={disabled}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any extra details for the boss..."
        />
      </div>
    </div>
  );
}
