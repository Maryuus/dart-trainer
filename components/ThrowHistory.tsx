"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { segmentLabel } from "@/lib/utils";
import type { ThrowResult } from "@/lib/types";

interface Props {
  results: ThrowResult[];
  totalThrows: number;
}

export function ThrowHistory({ results, totalThrows }: Props) {
  const slots = Array.from({ length: totalThrows });

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {slots.map((_, i) => {
        const result = results[i];
        if (!result) {
          return (
            <div
              key={i}
              className="w-9 h-9 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center"
            >
              <span className="text-xs text-white/20">{i + 1}</span>
            </div>
          );
        }
        return (
          <div
            key={i}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              result.hit
                ? "bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400"
                : "bg-red-500/10 border-2 border-red-500/50 text-red-400"
            )}
            title={result.segment ? segmentLabel(result.segment) : "Manqué"}
          >
            {result.hit ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </div>
        );
      })}
    </div>
  );
}
