"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { segmentsMatch } from "@/lib/autodarts";
import type { DartSegment, Routine, SessionState, ThrowResult } from "@/lib/types";

function initSession(routineId: string): SessionState {
  return {
    routineId,
    currentStepIndex: 0,
    currentThrowIndex: 0,
    results: [],
    startedAt: Date.now(),
    status: "idle",
  };
}

export function useRoutineSession(routine: Routine | null) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [lastThrow, setLastThrow] = useState<{ segment: DartSegment | null; hit: boolean } | null>(null);
  const sessionRef = useRef<SessionState | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const start = useCallback(() => {
    if (!routine) return;
    const s = { ...initSession(routine.id), status: "active" as const };
    setSession(s);
    sessionRef.current = s;
    setLastThrow(null);
  }, [routine]);

  const reset = useCallback(() => {
    setSession(null);
    sessionRef.current = null;
    setLastThrow(null);
  }, []);

  const recordThrow = useCallback(
    (thrown: DartSegment | null) => {
      const current = sessionRef.current;
      if (!current || current.status !== "active" || !routine) return;

      const step = routine.steps[current.currentStepIndex];
      if (!step) return;

      const hit = thrown !== null && segmentsMatch(step.segment, thrown);

      const result: ThrowResult = {
        stepIndex: current.currentStepIndex,
        throwIndex: current.currentThrowIndex,
        hit,
        segment: thrown,
        score: 0,
        timestamp: Date.now(),
      };

      setLastThrow({ segment: thrown, hit });

      const newThrowIndex = current.currentThrowIndex + 1;
      const stepDone = newThrowIndex >= step.throws;
      const lastStep = current.currentStepIndex >= routine.steps.length - 1;

      const updated: SessionState = {
        ...current,
        results: [...current.results, result],
        currentThrowIndex: stepDone ? 0 : newThrowIndex,
        currentStepIndex: stepDone
          ? Math.min(current.currentStepIndex + 1, routine.steps.length - 1)
          : current.currentStepIndex,
        status: stepDone && lastStep ? "done" : stepDone ? "step_complete" : "active",
      };

      setSession(updated);
      sessionRef.current = updated;

      // Auto-resume from step_complete after a brief pause
      if (updated.status === "step_complete") {
        setTimeout(() => {
          setSession((prev) => {
            if (!prev || prev.status !== "step_complete") return prev;
            const resumed = { ...prev, status: "active" as const };
            sessionRef.current = resumed;
            return resumed;
          });
        }, 1500);
      }
    },
    [routine]
  );

  // Manual throw recording (for testing without autodarts)
  const manualThrow = useCallback(
    (hit: boolean) => {
      if (!routine || !session) return;
      const step = routine.steps[session.currentStepIndex];
      recordThrow(hit ? step.segment : null);
    },
    [routine, session, recordThrow]
  );

  // Corriger un lancer déjà enregistré (basculer hit ↔ missed)
  const correctThrow = useCallback(
    (stepIndex: number, throwIndex: number) => {
      const current = sessionRef.current;
      if (!current) return;
      const updated: SessionState = {
        ...current,
        results: current.results.map((r) =>
          r.stepIndex === stepIndex && r.throwIndex === throwIndex
            ? { ...r, hit: !r.hit }
            : r
        ),
      };
      setSession(updated);
      sessionRef.current = updated;
    },
    []
  );

  const stepResults = session
    ? session.results.filter((r) => r.stepIndex === session.currentStepIndex)
    : [];

  const totalHits = session ? session.results.filter((r) => r.hit).length : 0;
  const totalThrows = session ? session.results.length : 0;
  const overallRate = totalThrows > 0 ? Math.round((totalHits / totalThrows) * 100) : 0;

  return {
    session,
    lastThrow,
    stepResults,
    totalHits,
    totalThrows,
    overallRate,
    start,
    reset,
    recordThrow,
    manualThrow,
    correctThrow,
  };
}
