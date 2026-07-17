"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PipelineSearch({
  value,
  onChange,
  resultCount,
  totalCount,
}: {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <Input
        type="search"
        placeholder="Search by name, phone, narration..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full border-stone-200 py-2.5 pl-10 pr-20 shadow-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-14 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">
        {resultCount}/{totalCount}
      </span>
    </div>
  );
}
