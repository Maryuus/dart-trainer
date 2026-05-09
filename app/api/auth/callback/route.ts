import { NextRequest, NextResponse } from "next/server";

const KEYCLOAK_TOKEN_URL =
  "https://login.autodarts.io/realms/autodarts/protocol/openid-connect/token";
const CLIENT_ID = "autodarts-play";

export async function POST(req: NextRequest) {
  const { code, code_verifier, redirect_uri } = await req.json();

  if (!code || !code_verifier || !redirect_uri) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri,
    code_verifier,
  });

  try {
    const res = await fetch(KEYCLOAK_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error_description ?? "Échange de code échoué" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
      refresh_expires_in: data.refresh_expires_in,
    });
  } catch {
    return NextResponse.json({ error: "Erreur réseau" }, { status: 500 });
  }
}
