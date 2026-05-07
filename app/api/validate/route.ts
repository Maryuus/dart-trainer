import { NextRequest, NextResponse } from "next/server";

// Endpoint utilisateur — ne nécessite qu'un token valide, pas de board ID
const AUTODARTS_USER_URL = "https://api.autodarts.io/us/v0/users/me";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const res = await fetch(AUTODARTS_USER_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ valid: false, error: "Token expiré ou invalide" }, { status: 401 });
    }

    // Tout autre erreur (404, 500...) = on laisse passer, le token est peut-être valide
    return NextResponse.json({ valid: true });
  } catch {
    // Erreur réseau = on laisse passer pour ne pas bloquer l'utilisateur
    return NextResponse.json({ valid: true });
  }
}
