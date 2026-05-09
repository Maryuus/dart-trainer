import type { ThrowResult, DartSegment } from "./types";
import { segmentLabel } from "./utils";
import { generateId } from "./utils";

const STORAGE_KEY = "dart_sessions";
const MAX_SESSIONS = 200;

// --- Types ---

export interface SavedSession {
  id: string;
  routineId: string;
  routineName: string;
  completedAt: number;
  duration: number; // ms
  results: ThrowResult[];
}

export interface SegmentStat {
  segment: DartSegment;
  label: string;
  throws: number;
  hits: number;
  rate: number; // 0-100
}

// --- Persistence ---

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function loadSessions(): SavedSession[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSession[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(session: Omit<SavedSession, "id">): SavedSession {
  const saved: SavedSession = { ...session, id: generateId() };
  if (!isClient()) return saved;
  try {
    const existing = loadSessions();
    // Garder seulement les MAX_SESSIONS dernières sessions
    const updated = [saved, ...existing].slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
  return saved;
}

export function clearSessions(): void {
  if (!isClient()) return;
  localStorage.removeItem(STORAGE_KEY);
}

// --- Calculs stats ---

export function computeOverallStats(sessions: SavedSession[]) {
  const allResults = sessions.flatMap((s) => s.results);
  const totalThrows = allResults.length;
  const totalHits = allResults.filter((r) => r.hit).length;
  const rate = totalThrows > 0 ? Math.round((totalHits / totalThrows) * 100) : 0;
  return { totalSessions: sessions.length, totalThrows, totalHits, rate };
}

export function computeSegmentStats(sessions: SavedSession[]): SegmentStat[] {
  const map = new Map<string, { segment: DartSegment; throws: number; hits: number }>();

  for (const session of sessions) {
    for (const result of session.results) {
      if (!result.segment) continue;
      const key = segmentLabel(result.segment);
      const existing = map.get(key);
      if (existing) {
        existing.throws++;
        if (result.hit) existing.hits++;
      } else {
        map.set(key, { segment: result.segment, throws: 1, hits: result.hit ? 1 : 0 });
      }
    }
  }

  return Array.from(map.entries())
    .map(([label, { segment, throws, hits }]) => ({
      segment,
      label,
      throws,
      hits,
      rate: Math.round((hits / throws) * 100),
    }))
    .sort((a, b) => b.throws - a.throws); // les plus joués en premier
}

export function computeRoutineStats(sessions: SavedSession[]) {
  const map = new Map<string, { name: string; sessions: number; totalRate: number }>();

  for (const s of sessions) {
    const allResults = s.results;
    const hits = allResults.filter((r) => r.hit).length;
    const rate = allResults.length > 0 ? (hits / allResults.length) * 100 : 0;

    const existing = map.get(s.routineId);
    if (existing) {
      existing.sessions++;
      existing.totalRate += rate;
    } else {
      map.set(s.routineId, { name: s.routineName, sessions: 1, totalRate: rate });
    }
  }

  return Array.from(map.values())
    .map(({ name, sessions, totalRate }) => ({
      name,
      sessions,
      avgRate: Math.round(totalRate / sessions),
    }))
    .sort((a, b) => b.sessions - a.sessions);
}
