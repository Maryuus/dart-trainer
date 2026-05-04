"use client";

import { cn } from "@/lib/utils";
import { segmentLabel } from "@/lib/utils";
import type { DartSegment } from "@/lib/types";

interface Props {
  target: DartSegment;
  hit?: boolean | null;
  className?: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  triple: "from-emerald-500 to-emerald-600",
  double: "from-blue-500 to-blue-600",
  single: "from-white/20 to-white/10",
  bull: "from-amber-500 to-amber-600",
  bullseye: "from-red-500 to-red-600",
};

export function DartBoard({ target, hit, className }: Props) {
  const gradientClass = SEGMENT_COLORS[target.type] ?? "from-white/20 to-white/10";
  const label = segmentLabel(target);

  const typeLabel: Record<string, string> = {
    triple: "TRIPLE",
    double: "DOUBLE",
    single: "SIMPLE",
    bull: "BULL",
    bullseye: "BULLSEYE",
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Main target circle */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            "w-52 h-52 rounded-full flex items-center justify-center",
            "bg-gradient-to-br border-4 transition-all duration-300",
            hit === true
              ? "border-emerald-400 shadow-[0_0_60px_rgba(52,211,153,0.5)]"
              : hit === false
              ? "border-red-400 shadow-[0_0_40px_rgba(239,68,68,0.3)]"
              : "border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]",
            gradientClass
          )}
        >
          {/* Inner circle */}
          <div className="w-36 h-36 rounded-full bg-zinc-950/80 backdrop-blur flex flex-col items-center justify-center gap-1">
            <span className="text-xs font-bold text-white/40 tracking-widest uppercase">
              {typeLabel[target.type]}
            </span>
            <span className="text-6xl font-black text-white leading-none">{label}</span>
          </div>
        </div>

        {/* Hit/Miss overlay */}
        {hit !== null && hit !== undefined && (
          <div
            className={cn(
              "absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold",
              hit
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50"
                : "bg-red-500 text-white shadow-lg shadow-red-500/50"
            )}
          >
            {hit ? "TOUCHÉ !" : "RATÉ"}
          </div>
        )}
      </div>
    </div>
  );
}
