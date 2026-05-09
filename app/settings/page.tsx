"use client";

import { useEffect, useState } from "react";
import { LogOut, Wifi, WifiOff, Hash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clearCredentials } from "@/lib/autodarts";
import { generateCodeVerifier, generateCodeChallenge, generateState, KEYCLOAK_BASE, CLIENT_ID } from "@/lib/pkce";

export default function SettingsPage() {
  const [boardId, setBoardId] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedBoardId = localStorage.getItem("autodarts_board_id");
    const hasRefresh = !!localStorage.getItem("autodarts_refresh_token");
    if (storedBoardId) setBoardId(storedBoardId);
    if (hasRefresh) setSaved(true);
  }, []);

  const handleConnect = async () => {
    if (!boardId.trim()) return;
    setLoading(true);

    // Sauvegarde le board ID et prépare le PKCE
    localStorage.setItem("autodarts_board_id", boardId.trim());
    sessionStorage.setItem("pending_board_id", boardId.trim());

    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    const state = generateState();

    sessionStorage.setItem("code_verifier", verifier);
    sessionStorage.setItem("oauth_state", state);

    const redirectUri = `${window.location.origin}/auth/callback`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });

    window.location.href = `${KEYCLOAK_BASE}/auth?${params.toString()}`;
  };

  const handleLogout = () => {
    clearCredentials();
    setBoardId("");
    setSaved(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        <p className="text-white/40 text-sm mt-1">Configure ta connexion Autodarts</p>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Connexion Autodarts</CardTitle>
                  <CardDescription>OAuth via ton compte Autodarts</CardDescription>
                </div>
              </div>
              <Badge variant={saved ? "success" : "secondary"}>
                {saved ? "Connecté" : "Non configuré"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {!saved ? (
              <>
                {/* Board ID */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                    <Hash className="w-3.5 h-3.5" />
                    Board ID
                  </label>
                  <Input
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-white/30 mt-1">
                    Disponible dans autodarts.io → Paramètres → ton board
                  </p>
                </div>

                <Button
                  onClick={handleConnect}
                  disabled={boardId.trim().length < 10 || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Wifi className="w-4 h-4" />
                  }
                  Se connecter avec Autodarts
                </Button>

                <p className="text-xs text-white/30 text-center">
                  Tu seras redirigé vers la page de connexion Autodarts (Google ou email).
                </p>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Authentifié — l&apos;accès est renouvelé automatiquement.
                  </p>
                  {boardId && (
                    <p className="text-xs text-white/30 mt-2 font-mono">{boardId}</p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <CardTitle>Mode manuel</CardTitle>
                <CardDescription>Toujours disponible</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50">
              Les boutons <strong className="text-white">Touché / Raté</strong> sont toujours visibles
              pendant les sessions, même si Autodarts est connecté.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
