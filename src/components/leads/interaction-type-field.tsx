"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import {
  mergeInteractionTypeOptions,
  slugifyInteractionLabel,
  type LeadInteractionType,
} from "@/lib/leads/interaction-types";
import { Plus, X } from "lucide-react";

interface InteractionTypeFieldProps {
  id?: string;
  value: string;
  types: LeadInteractionType[];
  onChange: (value: string, requiresVisit: boolean) => void;
  onTypesChange: (types: LeadInteractionType[]) => void;
}

export function InteractionTypeField({
  id = "interaction",
  value,
  types,
  onChange,
  onTypesChange,
}: InteractionTypeFieldProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [requiresVisit, setRequiresVisit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = mergeInteractionTypeOptions(types, value);

  async function handleAdd() {
    const label = newLabel.trim();
    if (!label) {
      setError("Enter a name.");
      return;
    }

    const slug = slugifyInteractionLabel(label);
    if (!slug) {
      setError("Use letters or numbers in the name.");
      return;
    }

    if (types.some((t) => t.value === slug || t.label.toLowerCase() === label.toLowerCase())) {
      setError("This interaction type already exists.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("lead_interaction_types")
      .insert({
        value: slug,
        label,
        icon: "📋",
        requires_visit: requiresVisit,
        sort_order: types.length + 1,
      })
      .select("id, value, label, icon, requires_visit, sort_order")
      .single();

    setSaving(false);

    if (insertError) {
      setError(
        insertError.message.includes("lead_interaction_types")
          ? "Run migration 016_lead_interaction_types.sql in Supabase first."
          : insertError.message
      );
      return;
    }

    const created: LeadInteractionType = {
      id: String(data.id),
      value: data.value,
      label: data.label,
      icon: data.icon ?? "📋",
      requires_visit: Boolean(data.requires_visit),
      sort_order: data.sort_order ?? types.length + 1,
    };

    const nextTypes = [...types, created];
    onTypesChange(nextTypes);
    onChange(created.value, created.requires_visit);
    setNewLabel("");
    setRequiresVisit(false);
    setAdding(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Label htmlFor={id}>Interaction type</Label>
          <Select
            id={id}
            value={value}
            onChange={(e) => {
              const next = options.find((t) => t.value === e.target.value);
              onChange(e.target.value, next?.requires_visit ?? false);
            }}
          >
            {options.map(({ value: optionValue, label, icon }) => (
              <option key={optionValue} value={optionValue}>
                {icon} {label}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mb-0.5 shrink-0 px-2.5"
          onClick={() => {
            setAdding((open) => !open);
            setError(null);
          }}
          title="Add interaction type"
          aria-label="Add interaction type"
        >
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {adding && (
        <div className="space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div>
            <Label htmlFor={`${id}-new`}>New interaction type</Label>
            <Input
              id={`${id}-new`}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Walk-in, Exhibition"
              autoFocus={false}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={requiresVisit}
              onChange={(e) => setRequiresVisit(e.target.checked)}
              className="rounded border-stone-300"
            />
            Requires shop visit before order
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setNewLabel("");
                setRequiresVisit(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={handleAdd}>
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
