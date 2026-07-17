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
  const activeStage = stages[activeIndex];

  useEffect(() => {
    const container = pillsRef.current;
    const activeBtn = container?.querySelector<HTMLButtonElement>(`[data-stage-index="${activeIndex}"]`);
    activeBtn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  return (
    <div className="space-y-2 lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Leads pipeline</p>
        <span className="text-xs text-stone-400">
          {activeIndex + 1}/{stages.length}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          disabled={activeIndex === 0}
          aria-label="Previous pipeline stage"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={pillsRef}
          className="flex min-w-0 flex-1 snap-x snap-mandatory gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {stages.map((stage, index) => (
            <button
              key={stage.value}
              type="button"
              data-stage-index={index}
              onClick={() => onSelect(index)}
              className={cn(
                "shrink-0 snap-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs",
                index === activeIndex
                  ? stage.color
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              )}
            >
              {stage.label}
              <span className="ml-1 opacity-70">({counts[stage.value] ?? 0})</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={activeIndex >= stages.length - 1}
          aria-label="Next pipeline stage"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {activeStage && (
        <p className="text-center text-xs text-stone-500">
          Swipe columns or use arrows · <span className="font-medium text-stone-700">{activeStage.label}</span>
        </p>
      )}
    </div>
  );
}
