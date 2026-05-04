"use client";

import { useState } from "react";
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { segmentFullLabel, generateId } from "@/lib/utils";
import type { DartSegment, RoutineStep } from "@/lib/types";

const SEGMENT_OPTIONS: { label: string; value: string; segment: DartSegment }[] = [
  // Triples
  ...[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((v) => ({
    label: `Triple ${v}`,
    value: `triple-${v}`,
    segment: { type: "triple" as const, value: v },
  })),
  // Doubles
  ...[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((v) => ({
    label: `Double ${v}`,
    value: `double-${v}`,
    segment: { type: "double" as const, value: v },
  })),
  // Singles
  ...[20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((v) => ({
    label: `Simple ${v}`,
    value: `single-${v}`,
    segment: { type: "single" as const, value: v },
  })),
  { label: "Bull (25)", value: "bull", segment: { type: "bull" } },
  { label: "Bullseye (50)", value: "bullseye", segment: { type: "bullseye" } },
];

function segmentToValue(seg: DartSegment): string {
  switch (seg.type) {
    case "triple": return `triple-${seg.value}`;
    case "double": return `double-${seg.value}`;
    case "single": return `single-${seg.value}`;
    case "bull": return "bull";
    case "bullseye": return "bullseye";
  }
}

interface Props {
  steps: RoutineStep[];
  onChange: (steps: RoutineStep[]) => void;
}

export function StepEditor({ steps, onChange }: Props) {
  const updateStep = (index: number, patch: Partial<RoutineStep>) => {
    const updated = steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange(updated);
  };

  const removeStep = (index: number) => {
    onChange(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, dir: -1 | 1) => {
    const newSteps = [...steps];
    const target = index + dir;
    if (target < 0 || target >= newSteps.length) return;
    [newSteps[index], newSteps[target]] = [newSteps[target], newSteps[index]];
    onChange(newSteps);
  };

  const addStep = () => {
    onChange([
      ...steps,
      {
        id: generateId(),
        label: "Triple 20",
        segment: { type: "triple", value: 20 },
        throws: 10,
      },
    ]);
  };

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div
          key={step.id}
          className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
        >
          <GripVertical className="w-4 h-4 text-white/20 shrink-0" />

          <div className="flex-1 grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] gap-2 items-center">
            {/* Step label */}
            <Input
              value={step.label}
              onChange={(e) => updateStep(i, { label: e.target.value })}
              placeholder="Nom de l'étape"
              className="h-9 text-sm sm:w-36"
            />

            {/* Segment select */}
            <Select
              value={segmentToValue(step.segment)}
              onValueChange={(val) => {
                const opt = SEGMENT_OPTIONS.find((o) => o.value === val);
                if (opt) updateStep(i, { segment: opt.segment });
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {SEGMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Throws count */}
            <div className="flex items-center gap-1 shrink-0">
              <Input
                type="number"
                min={1}
                max={100}
                value={step.throws}
                onChange={(e) => updateStep(i, { throws: Math.max(1, Number(e.target.value)) })}
                className="h-9 w-16 text-sm text-center"
              />
              <span className="text-xs text-white/40 whitespace-nowrap">lancers</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={() => moveStep(i, -1)}
              disabled={i === 0}
              className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveStep(i, 1)}
              disabled={i === steps.length - 1}
              className="p-1 rounded text-white/30 hover:text-white disabled:opacity-20 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => removeStep(i)}
            className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      <Button variant="outline" onClick={addStep} className="mt-1">
        + Ajouter une étape
      </Button>
    </div>
  );
}
