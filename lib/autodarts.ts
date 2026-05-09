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
    console.log("[auth] Appel /api/refresh...");
    const res = await fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[auth] Refresh échoué:", res.status, data);
      return null;
    }
    if (!data.access_token) {
      console.error("[auth] Refresh OK mais access_token absent:", data);
      return null;
    }
    console.log("[auth] Refresh OK ✓ expires_in:", data.expires_in, "s");
    saveCredentials(data.access_token, boardId, data.expires_in, data.refresh_token);
    return { token: data.access_token, boardId };
  } catch (e) {
    console.error("[auth] Erreur réseau refresh:", e);
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

// Parse un objet segment { bed, number } → DartSegment
function parseSegmentObject(seg: Record<string, unknown>): DartSegment | null {
  const bed = String(seg.bed ?? seg.type ?? "").toLowerCase();
  const num = Number(seg.number ?? seg.value ?? 0);
  if (bed === "bullseye" || bed === "double_bull") return { type: "bullseye" };
  if (bed === "bull" || bed === "single_bull") return { type: "bull" };
  if (bed === "triple" && num) return { type: "triple", value: num };
  if (bed === "double" && num) return { type: "double", value: num };
  if ((bed === "single" || bed === "small" || bed === "large") && num) return { type: "single", value: num };
  return null;
}

// Cherche récursivement un objet segment { bed + number } dans n'importe quelle structure
function findSegmentDeep(obj: unknown, depth = 0): DartSegment | null {
  if (depth > 6 || obj === null || obj === undefined) return null;

  if (Array.isArray(obj)) {
    // Priorité au dernier élément (lancer le plus récent)
    for (let i = obj.length - 1; i >= 0; i--) {
      const r = findSegmentDeep(obj[i], depth + 1);
      if (r) return r;
    }
    return null;
  }

  if (typeof obj === "object") {
    const rec = obj as Record<string, unknown>;

    // Si cet objet a "bed" et "number" c'est un segment
    if (("bed" in rec || "type" in rec) && ("number" in rec || "value" in rec)) {
      return parseSegmentObject(rec);
    }

    // Ancien format string : { segment: "20", multiplier: 3 }
    if (typeof rec.segment === "string" && "multiplier" in rec) {
      return parseThrowToSegment(rec as unknown as AutodartsThrow);
    }

    // Clés prioritaires à explorer en premier
    const priority = ["segment", "throws", "data", "currentThrow", "lastThrow"];
    for (const key of priority) {
      if (key in rec) {
        const r = findSegmentDeep(rec[key], depth + 1);
        if (r) return r;
      }
    }

    // Reste des clés (sauf bruit)
    const skip = new Set(["coords", "timestamp", "game_id", "player_id", "board_id", "image"]);
    for (const key of Object.keys(rec)) {
      if (skip.has(key) || priority.includes(key)) continue;
      const r = findSegmentDeep(rec[key], depth + 1);
      if (r) return r;
    }
  }

  return null;
}

export function parseBoardEventToSegment(data: Record<string, unknown>): DartSegment | null {
  const result = findSegmentDeep(data);
  console.log("[parse] brut:", JSON.stringify(data).slice(0, 400));
  console.log("[parse] résultat:", result ? JSON.stringify(result) : "null (Miss)");
  return result;
}

export function segmentsMatch(target: DartSegment, thrown: DartSegment): boolean {
  const match = (() => {
    if (target.type !== thrown.type) return false;
    if (target.type === "bull" || target.type === "bullseye") return true;
    if (
      (target.type === "single" || target.type === "double" || target.type === "triple") &&
      (thrown.type === "single" || thrown.type === "double" || thrown.type === "triple")
    ) {
      return target.value === thrown.value;
    }
    return false;
  })();
  console.log(`[match] cible: ${JSON.stringify(target)} | lancé: ${JSON.stringify(thrown)} | résultat: ${match ? "✓ TOUCHÉ" : "✗ RATÉ"}`);
  return match;
}

// --- SSE proxy (remplace WebSocket direct bloqué par l'Origin Autodarts) ---

export type ThrowCallback = (thrown: DartSegment | null, raw: AutodartsThrow, rawJson?: string) => void;

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
    if (!this.token || !this.token.startsWith("eyJ")) {
      console.error("[SSE] Token invalide, connexion annulée:", this.token?.slice(0, 20));
      this.onStatusChange("error");
      return;
    }
    console.log("[SSE] Connexion SSE... boardId:", this.boardId, "token:", this.token.slice(0, 30) + "...");
    const url = `/api/autodarts-stream?token=${encodeURIComponent(this.token)}&boardId=${encodeURIComponent(this.boardId)}`;
    this.es = new EventSource(url);

    this.es.addEventListener("connected", () => {
      console.log("[SSE] ✓ Connecté à Autodarts");
      this.onStatusChange("connected");
    });

    this.es.addEventListener("throw", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        const segment = parseBoardEventToSegment(data);
        const raw: AutodartsThrow = {
          segment: "0",
          multiplier: 1,
          points: 0,
        };
        this.onThrow(segment, raw, e.data);
      } catch { /* ignore */ }
    });

    this.es.addEventListener("disconnected", () => {
      console.warn("[SSE] event: disconnected reçu");
      this.onStatusChange("disconnected");
    });

    this.es.addEventListener("error", () => {
      console.warn("[SSE] event: error reçu");
      this.onStatusChange("error");
    });

    this.es.onerror = (e) => {
      console.warn("[SSE] onerror readyState:", this.es?.readyState, e);
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
