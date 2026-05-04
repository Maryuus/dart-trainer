"use client";

import { useEffect } from "react";
import { ExternalLink, LogOut, Monitor, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAuthUrl } from "@/lib/autodarts";
import { useAutodartsSettings } from "@/hooks/useAutodarts";

export default function SettingsPage() {
  const { token, boards, selectedBoardId, loadingBoards, selectBoard, logout } = useAutodartsSettings();

  const CLIENT_ID = process.env.NEXT_PUBLIC_AUTODARTS_CLIENT_ID;
  const hasClientId = !!CLIENT_ID;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Paramètres</h1>
        <p className="text-white/40 text-sm mt-1">Configure ta connexion Autodarts</p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Autodarts connection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle>Autodarts</CardTitle>
                  <CardDescription>Connexion à ton board</CardDescription>
                </div>
              </div>
              <Badge variant={token ? "success" : "secondary"}>
                {token ? "Connecté" : "Déconnecté"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!hasClientId && (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-300">
                <p className="font-semibold mb-1">Variable d&apos;environnement manquante</p>
                <p className="text-amber-300/70">
                  Ajoute <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_AUTODARTS_CLIENT_ID</code> dans ton fichier <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> pour activer l&apos;authentification Autodarts.
                </p>
              </div>
            )}

            {!token ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-white/50">
                  Connecte-toi avec ton compte Autodarts pour recevoir les lancers en temps réel via WebSocket.
                </p>
                <Button
                  onClick={() => { window.location.href = getAuthUrl(); }}
                  disabled={!hasClientId}
                  className="w-fit"
                >
                  <ExternalLink className="w-4 h-4" />
                  Se connecter à Autodarts
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-emerald-400 font-medium">✓ Authentifié avec succès</p>
                  <Button variant="ghost" size="sm" onClick={logout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </Button>
                </div>

                {/* Board selection */}
                <div>
                  <label className="text-sm font-medium text-white/70 block mb-2">
                    <Monitor className="w-3.5 h-3.5 inline mr-1.5" />
                    Sélectionner ton board
                  </label>
                  {loadingBoards ? (
                    <div className="flex items-center gap-2 text-sm text-white/40">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Chargement des boards…
                    </div>
                  ) : boards.length === 0 ? (
                    <p className="text-sm text-white/40">Aucun board trouvé sur ce compte.</p>
                  ) : (
                    <Select value={selectedBoardId ?? ""} onValueChange={selectBoard}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un board…" />
                      </SelectTrigger>
                      <SelectContent>
                        {boards.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.name}
                            <Badge variant={board.status === "online" ? "success" : "secondary"} className="ml-2 text-xs">
                              {board.status}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedBoardId && (
                  <p className="text-xs text-emerald-400/70">
                    ✓ Board sélectionné — les lancers seront détectés automatiquement pendant les sessions.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual mode info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <CardTitle>Mode manuel</CardTitle>
                <CardDescription>Sans connexion Autodarts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50">
              Sans Autodarts configuré, tu peux utiliser l&apos;application en mode manuel : des boutons <strong className="text-white">Touché / Raté</strong> s&apos;affichent pendant les sessions pour suivre ta progression manuellement.
            </p>
          </CardContent>
        </Card>

        {/* Setup guide */}
        <Card>
          <CardHeader>
            <CardTitle>Guide de configuration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/50 flex flex-col gap-2">
            <p>1. Crée un compte développeur sur <strong className="text-white">autodarts.io</strong></p>
            <p>2. Génère un <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">client_id</code> OAuth dans les paramètres développeur</p>
            <p>3. Ajoute l&apos;URI de redirection : <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">{typeof window !== "undefined" ? window.location.origin : "https://ton-app.vercel.app"}/settings</code></p>
            <p>4. Crée un fichier <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> avec <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_AUTODARTS_CLIENT_ID=xxx</code></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
