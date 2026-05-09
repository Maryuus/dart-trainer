import { NextRequest, NextResponse } from "next/server";

const KEYCLOAK_URL =
  "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token";

export async function POST(req: NextRequest) {
  const { refresh_token } = await req.json();

  if (!refresh_token) {
    return NextResponse.json({ error: "Missing refresh_token" }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: "autodarts-play",
    refresh_token,
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
        { error: data.error_description ?? "Refresh échoué" },
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
