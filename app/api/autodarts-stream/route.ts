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

      send("retry: 1000\n\n");

      // ✅ Fix 1 : token dans le header Authorization, pas dans l'URL
      const ws = new WebSocket(WS_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const keepalive = setInterval(() => send(": keepalive\n\n"), 20_000);

      ws.on("open", () => {
        console.log("[autodarts-stream] WS connected ✓");

        // ✅ Fix 2 : bon format d'abonnement (topic, pas data.boardId)
        ws.send(JSON.stringify({
          type: "subscribe",
          channel: "autodarts.boards",
          topic: `${boardId}.events`,
        }));
        send("event: connected\ndata: {}\n\n");
      });

      ws.on("message", (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          console.log("[autodarts-stream] msg:", JSON.stringify(msg).slice(0, 200));

          // Ignorer le message d'info initial
          if (msg?.topic === "info") return;

          // Format board events : { topic: "<boardId>.events", data: { event: "Throw detected", segment: {...} } }
          if (msg?.data?.event === "Throw detected") {
            send(`event: throw\ndata: ${JSON.stringify(msg.data)}\n\n`);
            return;
          }

          // Fallback : ancien format avec tableau throws
          if (msg?.data?.throws) {
            send(`event: throw\ndata: ${JSON.stringify(msg.data)}\n\n`);
          }
        } catch { /* ignore */ }
      });

      ws.on("close", (code, reason) => {
        clearInterval(keepalive);
        console.warn(`[autodarts-stream] closed — code: ${code}, reason: ${reason.toString()}`);
        send("event: disconnected\ndata: {}\n\n");
        try { controller.close(); } catch { /* already closed */ }
      });

      ws.on("error", (err) => {
        clearInterval(keepalive);
        console.error("[autodarts-stream] error:", err.message);
        send("event: error\ndata: {}\n\n");
        try { controller.close(); } catch { /* already closed */ }
      });

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
