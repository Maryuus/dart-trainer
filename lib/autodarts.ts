import type { AutodartsThrow, DartSegment } from "./types";

const WS_URL = "wss://api.autodarts.io/ms/v0/subscribe";

// --- Persistence ---

export function saveCredentials(apiKey: string, boardId: string): void {
  localStorage.setItem("autodarts_api_key", apiKey);
  localStorage.setItem("autodarts_board_id", boardId);
}

export function loadCredentials(): { apiKey: string; boardId: string } | null {
  if (typeof window === "undefined") return null;
  const apiKey = localStorage.getItem("autodarts_api_key");
  const boardId = localStorage.getItem("autodarts_board_id");
  if (!apiKey || !boardId) return null;
  return { apiKey, boardId };
}

export function clearCredentials(): void {
  localStorage.removeItem("autodarts_api_key");
  localStorage.removeItem("autodarts_board_id");
}

// Kept for backward compat with existing session page
export function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("autodarts_api_key");
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

export class AutodartsSocket {
  private ws: WebSocket | null = null;
  private boardId: string;
  private apiKey: string;
  private onThrow: ThrowCallback;
  private onStatusChange: (status: "connected" | "disconnected" | "error") => void;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

  constructor(
    boardId: string,
    apiKey: string,
    onThrow: ThrowCallback,
    onStatusChange: (status: "connected" | "disconnected" | "error") => void
  ) {
    this.boardId = boardId;
    this.apiKey = apiKey;
    this.onThrow = onThrow;
    this.onStatusChange = onStatusChange;
  }

  connect(): void {
    if (this.ws) this.ws.close();

    try {
      this.ws = new WebSocket(`${WS_URL}?token=${this.apiKey}`);

      this.ws.onopen = () => {
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
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onerror = () => this.onStatusChange("error");

      this.ws.onclose = () => {
        this.onStatusChange("disconnected");
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };
    } catch {
      this.onStatusChange("error");
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
