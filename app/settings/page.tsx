"use client";

import { useState } from "react";
import { LogOut, Wifi, WifiOff, KeyRound, Hash, User, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAutodartsSettings } from "@/hooks/useAutodarts";

export default function SettingsPage() {
  const { token, boardId, loading, error, isConfigured, login, logout } = useAutodartsSettings();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [boardInput, setBoardInput] = useState(boardId);

  // sync boardId once loaded
  if (boardId && boardInput !== boardId && !boardInput) setBoardInput(boardId);

  const canLogin = username.trim() && password.trim() && boardInput.trim();

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
                  <CardDescription>Login + Board ID</CardDescription>
                </div>
              </div>
              <Badge variant={isConfigured ? "success" : "secondary"}>
                {isConfigured ? "Connecté" : "Non configuré"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {!isConfigured ? (
              <>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/60 flex flex-col gap-1.5">
                  <p className="font-semibold text-white/80 mb-1">Infos nécessaires</p>
                  <p>• <strong className="text-white">Email / mot de passe</strong> de ton compte autodarts.io</p>
                  <p>• <strong className="text-white">Board ID</strong> : dans autodarts.io → Paramètres → ton board</p>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                    <User className="w-3.5 h-3.5" /> Email autodarts
                  </label>
                  <Input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ton@email.com"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                    <Lock className="w-3.5 h-3.5" /> Mot de passe
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                    <Hash className="w-3.5 h-3.5" /> Board ID
                  </label>
                  <Input
                    value={boardInput}
                    onChange={(e) => setBoardInput(e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="font-mono text-xs"
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => login(username, password, boardInput)}
                  disabled={!canLogin || loading}
                  size="lg"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Connexion…</>
                  ) : (
                    <><Wifi className="w-4 h-4" /> Se connecter</>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-emerald-400 font-medium">
                  ✓ Authentifié — token OAuth actif
                </p>
                <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-xs text-white/40 font-mono">
                  Board : {boardId}
                </div>
                <p className="text-xs text-white/40">
                  Le token expire automatiquement. Si la connexion est perdue, reconnecte-toi.
                </p>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-fit"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </Button>
              </div>
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
                <CardDescription>Sans connexion Autodarts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50">
              Sans Autodarts configuré, des boutons <strong className="text-white">Touché / Raté</strong> sont toujours disponibles pendant les sessions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
