import type { Routine } from "./types";
import { generateId } from "./utils";

const STORAGE_KEY = "dart_routines";

export const DEFAULT_WARMUP: Routine = {
  id: "default-warmup",
  name: "Échauffement standard",
  description: "Routine d'échauffement complète avant une partie",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [
    { id: "s1", label: "Triple 20", segment: { type: "triple", value: 20 }, throws: 15 },
    { id: "s2", label: "Triple 19", segment: { type: "triple", value: 19 }, throws: 15 },
    { id: "s3", label: "Triple 18", segment: { type: "triple", value: 18 }, throws: 15 },
    { id: "s4", label: "Bulle", segment: { type: "bull" }, throws: 15 },
    { id: "s5", label: "Double 16", segment: { type: "double", value: 16 }, throws: 15 },
    { id: "s6", label: "Double 20", segment: { type: "double", value: 20 }, throws: 15 },
    { id: "s7", label: "Double 8", segment: { type: "double", value: 8 }, throws: 15 },
  ],
};

export const DEFAULT_DOUBLES: Routine = {
  id: "default-doubles",
  name: "Finitions doubles",
  description: "Entraînement spécifique sur les doubles pour la fin de partie",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [
    { id: "d1", label: "Double 20", segment: { type: "double", value: 20 }, throws: 10 },
    { id: "d2", label: "Double 16", segment: { type: "double", value: 16 }, throws: 10 },
    { id: "d3", label: "Double 10", segment: { type: "double", value: 10 }, throws: 10 },
    { id: "d4", label: "Double 8", segment: { type: "double", value: 8 }, throws: 10 },
    { id: "d5", label: "Double 4", segment: { type: "double", value: 4 }, throws: 10 },
    { id: "d6", label: "Double 2", segment: { type: "double", value: 2 }, throws: 10 },
    { id: "d7", label: "Double 1", segment: { type: "double", value: 1 }, throws: 10 },
    { id: "d8", label: "Bullseye", segment: { type: "bullseye" }, throws: 10 },
  ],
};

export const DEFAULT_TRIPLES: Routine = {
  id: "default-triples",
  name: "Triples scoring",
  description: "Entraînement sur les triples pour maximiser le score",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [
    { id: "t1", label: "Triple 20", segment: { type: "triple", value: 20 }, throws: 10 },
    { id: "t2", label: "Triple 19", segment: { type: "triple", value: 19 }, throws: 10 },
    { id: "t3", label: "Triple 18", segment: { type: "triple", value: 18 }, throws: 10 },
    { id: "t4", label: "Triple 17", segment: { type: "triple", value: 17 }, throws: 10 },
    { id: "t5", label: "Triple 16", segment: { type: "triple", value: 16 }, throws: 10 },
    { id: "t6", label: "Triple 15", segment: { type: "triple", value: 15 }, throws: 10 },
  ],
};

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function loadRoutines(): Routine[] {
  if (!isClient()) return [DEFAULT_WARMUP, DEFAULT_DOUBLES, DEFAULT_TRIPLES];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = [DEFAULT_WARMUP, DEFAULT_DOUBLES, DEFAULT_TRIPLES];
      saveRoutines(defaults);
      return defaults;
    }
    return JSON.parse(raw) as Routine[];
  } catch {
    return [DEFAULT_WARMUP, DEFAULT_DOUBLES, DEFAULT_TRIPLES];
  }
}

export function saveRoutines(routines: Routine[]): void {
  if (!isClient()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
}

export function createRoutine(partial: Omit<Routine, "id" | "createdAt" | "updatedAt">): Routine {
  return {
    ...partial,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function updateRoutine(routines: Routine[], updated: Routine): Routine[] {
  return routines.map((r) =>
    r.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : r
  );
}

export function deleteRoutine(routines: Routine[], id: string): Routine[] {
  return routines.filter((r) => r.id !== id);
}
