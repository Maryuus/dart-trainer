import { NextRequest, NextResponse } from "next/server";

const KEYCLOAK_URL =
  "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "autodarts-app",
    username,
    password,
  });

  try {
    const res = await fetch(KEYCLOAK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error_description ?? "Authentification échouée" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    });
  } catch {
    return NextResponse.json({ error: "Erreur réseau" }, { status: 500 });
  }
}
