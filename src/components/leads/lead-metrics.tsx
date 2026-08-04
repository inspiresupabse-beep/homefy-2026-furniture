import { cn } from "@/lib/utils";
import { getInteractionIcon } from "@/lib/leads";
import { useInteractionTypes } from "@/lib/leads/interaction-types-context";
import { getInteractionMeta } from "@/lib/leads/interaction-types";
import {
  getLeadTemperatureConfig,
  type LeadTemperature,
} from "@/lib/types/database";

export function TemperatureBadge({
  temperature,
  className,
}: {
  temperature: LeadTemperature;
  className?: string;
}) {
  const config = getLeadTemperatureConfig(temperature);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.badge,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function InteractionBadge({
  interaction,
  showLabel = false,
  className,
}: {
  interaction: string;
  showLabel?: boolean;
  className?: string;
}) {
  const types = useInteractionTypes();
  const meta = getInteractionMeta(interaction, types);
  const icon = getInteractionIcon(interaction, types);
  const label = meta.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-700",
        className
      )}
      title={label}
    >
      <span aria-hidden>{icon}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}

export function ProbabilityBar({
  value,
  showLabel = true,
  size = "md",
}: {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-stone-500">Probability</span>
          <span className="font-medium text-stone-700">{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-stone-100",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            clamped >= 70 ? "bg-emerald-500" : clamped >= 40 ? "bg-amber-500" : "bg-stone-400"
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
