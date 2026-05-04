import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DartSegment, RoutineStep } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function segmentLabel(segment: DartSegment): string {
  switch (segment.type) {
    case "single": return `${segment.value}`;
    case "double": return `D${segment.value}`;
    case "triple": return `T${segment.value}`;
    case "bull": return "Bull";
    case "bullseye": return "Bullseye";
  }
}

export function segmentScore(segment: DartSegment): number {
  switch (segment.type) {
    case "single": return segment.value;
    case "double": return segment.value * 2;
    case "triple": return segment.value * 3;
    case "bull": return 25;
    case "bullseye": return 50;
  }
}

export function segmentFullLabel(segment: DartSegment): string {
  switch (segment.type) {
    case "single": return `Simple ${segment.value}`;
    case "double": return `Double ${segment.value}`;
    case "triple": return `Triple ${segment.value}`;
    case "bull": return "Bull (25)";
    case "bullseye": return "Bullseye (50)";
  }
}

export function stepHitRate(results: { hit: boolean; stepIndex: number }[], stepIndex: number): number {
  const stepResults = results.filter((r) => r.stepIndex === stepIndex);
  if (stepResults.length === 0) return 0;
  const hits = stepResults.filter((r) => r.hit).length;
  return Math.round((hits / stepResults.length) * 100);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function defaultStepLabel(step: Omit<RoutineStep, "id" | "label">): string {
  return `${segmentFullLabel(step.segment)} × ${step.throws}`;
}
