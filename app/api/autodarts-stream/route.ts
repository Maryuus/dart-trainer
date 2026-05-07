import { NextRequest } from "next/server";
import WebSocket from "ws";

export const runtime = "nodejs";
export const maxDuration = 60;

const WS_URL = "wss://api.autodarts.io/ms/v0/subscribe";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const boardId = searchParams.get("boardId");

  if (!token || !boardId) {
    return new Response("Missing token or boardId", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (line: string) => {
        try { controller.enqueue(encoder.encode(line)); } catch { /* stream closed */ }
      };

      // Retry rapide pour minimiser le gap lors des reconnexions automatiques
      send("retry: 1000\n\n");

      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      // Keepalive toutes les 20s pour éviter le timeout Vercel sur streaming
      const keepalive = setInterval(() => send(": keepalive\n\n"), 20_000);

      ws.on("open", () => {
        ws.send(JSON.stringify({
          channel: "autodarts.boards",
          type: "subscribe",
          data: { boardId },
        }));
        send("event: connected\ndata: {}\n\n");
      });

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg?.data?.throws) {
            send(`event: throw\ndata: ${JSON.stringify(msg.data)}\n\n`);
          }
        } catch { /* ignore malformed messages */ }
      });

      ws.on("close", (code, reason) => {
        clearInterval(keepalive);
        console.warn(`[autodarts-stream] WS closed — code: ${code}, reason: ${reason}`);
        send("event: disconnected\ndata: {}\n\n");
        try { controller.close(); } catch { /* already closed */ }
      });

      ws.on("error", (err) => {
        clearInterval(keepalive);
        console.error("[autodarts-stream] WS error:", err.message);
        send("event: error\ndata: {}\n\n");
        try { controller.close(); } catch { /* already closed */ }
      });

      // Nettoyage quand le client se déconnecte
      req.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        ws.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
