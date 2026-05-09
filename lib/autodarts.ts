import type { AutodartsThrow, DartSegment } from "./types";

// --- Persistence ---

export function saveCredentials(
  token: string,
  boardId: string,
  expiresIn: number,
  refreshToken?: string
): void {
  localStorage.setItem("autodarts_token", token);
  localStorage.setItem("autodarts_board_id", boardId);
  localStorage.setItem("autodarts_token_expires", String(Date.now() + expiresIn * 1000));
  if (refreshToken) localStorage.setItem("autodarts_refresh_token", refreshToken);
}

export function saveRefreshToken(refreshToken: string): void {
  localStorage.setItem("autodarts_refresh_token", refreshToken);
}

export function saveBoardId(boardId: string): void {
  localStorage.setItem("autodarts_board_id", boardId);
}

export function loadCredentials(): { token: string; boardId: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("autodarts_token");
  const boardId = localStorage.getItem("autodarts_board_id");
  const expires = Number(localStorage.getItem("autodarts_token_expires") ?? 0);
  if (!token || !boardId) return null;
  if (!token.startsWith("eyJ")) return null; // pas un vrai JWT
  if (expires && Date.now() > expires) return null; // token expiré
  return { token, boardId };
}

export function loadRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("autodarts_refresh_token");
}

export function clearCredentials(): void {
  localStorage.removeItem("autodarts_token");
  localStorage.removeItem("autodarts_board_id");
  localStorage.removeItem("autodarts_token_expires");
  localStorage.removeItem("autodarts_refresh_token");
}

// backward compat
export function loadToken(): string | null {
  return loadCredentials()?.token ?? null;
}

// --- Refresh token → nouvel access token ---

export async function refreshAccessToken(
  refreshToken: string,
  boardId: string
): Promise<{ token: string; boardId: string } | null> {
  try {
    const res = await fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    saveCredentials(data.access_token, boardId, data.expires_in, data.refresh_token);
    return { token: data.access_token, boardId };
  } catch {
    return null;
  }
}

// Retourne les credentials valides (refresh auto si token absent/expiré)
export async function getValidCredentials(): Promise<{ token: string; boardId: string } | null> {
  if (typeof window === "undefined") return null;

  // Si on a un access token encore valide, on l'utilise directement
  const creds = loadCredentials();
  if (creds) return creds;

  // Token absent ou expiré → on rafraîchit via le refresh token
  const boardId = localStorage.getItem("autodarts_board_id");
  const refreshToken = loadRefreshToken();
  if (!boardId || !refreshToken) return null;

  return refreshAccessToken(refreshToken, boardId);
}

// --- Auth via Next.js API proxy ---

export async function loginAutodarts(
  username: string,
  password: string
): Promise<{ access_token: string; expires_in: number; refresh_token: string }> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Authentification échouée");
  return data;
}

// --- Token validation (décodage JWT local, sans appel réseau) ---

export function validateToken(token: string): { valid: boolean; error?: string } {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return { valid: true };
    if (Date.now() / 1000 > payload.exp) {
      return { valid: false, error: "Token expiré" };
    }
    return { valid: true };
  } catch {
    // Si on ne peut pas décoder le JWT, on laisse tenter la connexion
    return { valid: true };
  }
}

// --- Segment parsing ---

// Ancien format : { segment: "20", multiplier: 3, points: 60 }
export function parseThrowToSegment(t: AutodartsThrow): DartSegment | null {
  const seg = t.segment?.toUpperCase();
  if (!seg) return null;
  if (seg === "BULL" && t.multiplier === 2) return { type: "bullseye" };
  if (seg === "BULL") return { type: "bull" };
  const value = parseInt(seg, 10);
  if (isNaN(value)) return null;
  if (t.multiplier === 3) return { type: "triple", value };
  if (t.multiplier === 2) return { type: "double", value };
  return { type: "single", value };
}

// Nouveau format board events : { segment: { name: "T20", number: 20, bed: "triple", multiplier: 3 } }
export function parseBoardEventToSegment(data: Record<string, unknown>): DartSegment | null {
  // Nouveau format (API officielle)
  const seg = data.segment as Record<string, unknown> | undefined;
  if (seg && typeof seg === "object") {
    const bed = seg.bed as string;
    const num = seg.number as number;
    if (bed === "bullseye") return { type: "bullseye" };
    if (bed === "bull") return { type: "bull" };
    if (bed === "triple" && num) return { type: "triple", value: num };
    if (bed === "double" && num) return { type: "double", value: num };
    if (bed === "single" && num) return { type: "single", value: num };
  }
  // Ancien format fallback : tableau throws
  const throws = data.throws as AutodartsThrow[] | undefined;
  if (throws?.length) return parseThrowToSegment(throws[throws.length - 1]);
  return null;
}

export function segmentsMatch(target: DartSegment, thrown: DartSegment): boolean {
  if (target.type !== thrown.type) return false;
  if (target.type === "bull" || target.type === "bullseye") return true;
  if (
    (target.type === "single" || target.type === "double" || target.type === "triple") &&
    (thrown.type === "single" || thrown.type === "double" || thrown.type === "triple")
  ) {
    return target.value === thrown.value;
  }
  return false;
}

// --- SSE proxy (remplace WebSocket direct bloqué par l'Origin Autodarts) ---

export type ThrowCallback = (thrown: DartSegment | null, raw: AutodartsThrow) => void;

export class AutodartsSSE {
  private es: EventSource | null = null;
  private boardId: string;
  private token: string;
  private onThrow: ThrowCallback;
  private onStatusChange: (status: "connected" | "disconnected" | "error") => void;

  constructor(
    boardId: string,
    token: string,
    onThrow: ThrowCallback,
    onStatusChange: (status: "connected" | "disconnected" | "error") => void
  ) {
    this.boardId = boardId;
    this.token = token;
    this.onThrow = onThrow;
    this.onStatusChange = onStatusChange;
  }

  connect(): void {
    const url = `/api/autodarts-stream?token=${encodeURIComponent(this.token)}&boardId=${encodeURIComponent(this.boardId)}`;
    this.es = new EventSource(url);

    this.es.addEventListener("connected", () => {
      this.onStatusChange("connected");
    });

    this.es.addEventListener("throw", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        const segment = parseBoardEventToSegment(data);
        // Reconstitue un AutodartsThrow minimal pour la compatibilité
        const raw: AutodartsThrow = {
          segment: String((data.segment as Record<string, unknown>)?.number ?? "0"),
          multiplier: Number((data.segment as Record<string, unknown>)?.multiplier ?? 1),
          points: Number((data.segment as Record<string, unknown>)?.points ?? 0),
        };
        this.onThrow(segment, raw);
      } catch { /* ignore */ }
    });

    this.es.addEventListener("disconnected", () => {
      this.onStatusChange("disconnected");
    });

    this.es.addEventListener("error", () => {
      this.onStatusChange("error");
    });

    // onerror de l'EventSource lui-même (problème réseau / reconnexion)
    this.es.onerror = () => {
      if (this.es?.readyState === EventSource.CLOSED) {
        this.onStatusChange("error");
      }
    };
  }

  disconnect(): void {
    this.es?.close();
    this.es = null;
  }
}

// Alias pour compatibilité
export { AutodartsSSE as AutodartsSocket };
