import type { AutodartsBoard, AutodartsThrow, DartSegment } from "./types";

const BASE_URL = "https://api.autodarts.io";
const AUTH_URL = "https://login.autodarts.io";
const WS_URL = "wss://api.autodarts.io/ms/v0/subscribe";

const CLIENT_ID = process.env.NEXT_PUBLIC_AUTODARTS_CLIENT_ID ?? "";
const REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/settings`
    : "";

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "token",
    scope: "openid",
  });
  return `${AUTH_URL}/realms/autodarts/protocol/openid-connect/auth?${params}`;
}

export function parseTokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace("#", ""));
  return params.get("access_token");
}

export function saveToken(token: string, expiresIn: number): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem("autodarts_token", token);
  localStorage.setItem("autodarts_token_expires", String(expiresAt));
}

export function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("autodarts_token");
  const expiresAt = Number(localStorage.getItem("autodarts_token_expires") ?? 0);
  if (!token || Date.now() > expiresAt) return null;
  return token;
}

export function clearToken(): void {
  localStorage.removeItem("autodarts_token");
  localStorage.removeItem("autodarts_token_expires");
  localStorage.removeItem("autodarts_board_id");
}

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Autodarts API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchBoards(token: string): Promise<AutodartsBoard[]> {
  try {
    const data = await apiFetch<{ items?: AutodartsBoard[] }>("/as/v0/boards", token);
    return data.items ?? [];
  } catch {
    return [];
  }
}

// Maps an autodarts throw event to a DartSegment
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
    (target.type === "single" ||
      target.type === "double" ||
      target.type === "triple") &&
    (thrown.type === "single" ||
      thrown.type === "double" ||
      thrown.type === "triple")
  ) {
    return target.value === thrown.value;
  }
  return false;
}

export type ThrowCallback = (thrown: DartSegment | null, raw: AutodartsThrow) => void;

export class AutodartsSocket {
  private ws: WebSocket | null = null;
  private boardId: string;
  private token: string;
  private onThrow: ThrowCallback;
  private onStatusChange: (status: "connected" | "disconnected" | "error") => void;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;

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
    if (this.ws) this.ws.close();

    try {
      this.ws = new WebSocket(`${WS_URL}?token=${this.token}`);

      this.ws.onopen = () => {
        this.onStatusChange("connected");
        // Subscribe to board throw events
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
            if (lastThrow) {
              this.onThrow(parseThrowToSegment(lastThrow), lastThrow);
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      this.ws.onerror = () => {
        this.onStatusChange("error");
      };

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
