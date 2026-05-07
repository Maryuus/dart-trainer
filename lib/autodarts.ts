import type { AutodartsThrow, DartSegment } from "./types";

const WS_URL = "wss://api.autodarts.io/ms/v0/subscribe";

// --- Persistence ---

export function saveCredentials(token: string, boardId: string, expiresIn: number): void {
  localStorage.setItem("autodarts_token", token);
  localStorage.setItem("autodarts_board_id", boardId);
  localStorage.setItem("autodarts_token_expires", String(Date.now() + expiresIn * 1000));
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
  if (expires && Date.now() > expires) return null; // token expiré
  return { token, boardId };
}

export function clearCredentials(): void {
  localStorage.removeItem("autodarts_token");
  localStorage.removeItem("autodarts_board_id");
  localStorage.removeItem("autodarts_token_expires");
}

// backward compat
export function loadToken(): string | null {
  return loadCredentials()?.token ?? null;
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

// --- Token validation via server proxy ---

export async function validateToken(
  token: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) return { valid: false, error: data.error };
    return { valid: true };
  } catch {
    // En cas d'erreur réseau, on laisse tenter la connexion WebSocket
    return { valid: true };
  }
}

// --- Segment parsing ---

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

// --- WebSocket ---

export type ThrowCallback = (thrown: DartSegment | null, raw: AutodartsThrow) => void;

const CONNECTION_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_ATTEMPTS = 3;

export class AutodartsSocket {
  private ws: WebSocket | null = null;
  private boardId: string;
  private token: string;
  private onThrow: ThrowCallback;
  private onStatusChange: (status: "connected" | "disconnected" | "error") => void;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private reconnectAttempts = 0;

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

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  connect(): void {
    if (this.ws) this.ws.close();

    // Timeout de connexion : si le handshake ne réussit pas en 10s → erreur
    this.connectionTimer = setTimeout(() => {
      this.connectionTimer = null;
      if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
        this.shouldReconnect = false;
        this.ws.close();
        this.onStatusChange("error");
      }
    }, CONNECTION_TIMEOUT_MS);

    try {
      this.ws = new WebSocket(`${WS_URL}?token=${this.token}`);

      this.ws.onopen = () => {
        this.clearConnectionTimer();
        this.reconnectAttempts = 0;
        this.onStatusChange("connected");
        this.ws?.send(
          JSON.stringify({
            channel: "autodarts.boards",
            type: "subscribe",
            data: { boardId: this.boardId },
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg?.data?.throws) {
            const lastThrow: AutodartsThrow = msg.data.throws[msg.data.throws.length - 1];
            if (lastThrow) this.onThrow(parseThrowToSegment(lastThrow), lastThrow);
          }
        } catch { /* ignore */ }
      };

      this.ws.onerror = () => {
        this.clearConnectionTimer();
        this.onStatusChange("error");
      };

      this.ws.onclose = () => {
        this.clearConnectionTimer();
        if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          this.onStatusChange("disconnected");
          this.reconnectTimer = setTimeout(() => this.connect(), 5000);
        } else {
          // Échec définitif après MAX_RECONNECT_ATTEMPTS tentatives
          this.onStatusChange("error");
        }
      };
    } catch {
      this.clearConnectionTimer();
      this.onStatusChange("error");
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.clearConnectionTimer();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
