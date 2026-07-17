"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types/database";

type Stage = { value: LeadStatus; label: string; color: string };

export function PipelineStageNav({
  stages,
  counts,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
}: {
  stages: Stage[];
  counts: Record<LeadStatus, number>;
  activeIndex: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = pillsRef.current;
    const activeBtn = container?.querySelector<HTMLButtonElement>(`[data-stage-index="${activeIndex}"]`);
    activeBtn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        disabled={activeIndex === 0}
        aria-label="Previous pipeline stage"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div
        ref={pillsRef}
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto py-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {stages.map((stage, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={stage.value}
              type="button"
              data-stage-index={index}
              onClick={() => onSelect(index)}
              className={cn(
                "shrink-0 snap-center whitespace-nowrap rounded-full border bg-white px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                isActive
                  ? "border-amber-600 text-amber-800 shadow-sm"
                  : "border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-800"
              )}
            >
              {stage.label} ({counts[stage.value] ?? 0})
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={activeIndex >= stages.length - 1}
        aria-label="Next pipeline stage"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-35"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
