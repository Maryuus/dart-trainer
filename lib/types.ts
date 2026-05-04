export type DartSegment =
  | { type: "single"; value: number }
  | { type: "double"; value: number }
  | { type: "triple"; value: number }
  | { type: "bull" }
  | { type: "bullseye" };

export interface RoutineStep {
  id: string;
  segment: DartSegment;
  throws: number;
  label: string;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  steps: RoutineStep[];
  createdAt: string;
  updatedAt: string;
}

export interface ThrowResult {
  stepIndex: number;
  throwIndex: number;
  hit: boolean;
  segment: DartSegment | null;
  score: number;
  timestamp: number;
}

export interface SessionState {
  routineId: string;
  currentStepIndex: number;
  currentThrowIndex: number;
  results: ThrowResult[];
  startedAt: number;
  status: "idle" | "active" | "step_complete" | "done";
}

export interface AutodartsThrow {
  segment: string;
  multiplier: number;
  points: number;
}

export interface AutodartsBoard {
  id: string;
  name: string;
  status: "online" | "offline" | "playing";
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
