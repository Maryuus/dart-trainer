import { NextRequest, NextResponse } from "next/server";

const AUTODARTS_BOARDS_URL = "https://api.autodarts.io/bs/v0/boards";

export async function POST(req: NextRequest) {
  const { token, boardId } = await req.json();

  if (!token || !boardId) {
    return NextResponse.json({ error: "Missing token or boardId" }, { status: 400 });
  }

  try {
    const res = await fetch(`${AUTODARTS_BOARDS_URL}/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ valid: false, error: "Token expiré ou invalide" }, { status: 401 });
    }

    if (!res.ok) {
      return NextResponse.json({ valid: false, error: "Board introuvable" }, { status: res.status });
    }

    const board = await res.json();
    return NextResponse.json({ valid: true, board });
  } catch {
    return NextResponse.json({ error: "Erreur réseau" }, { status: 500 });
  }
}
