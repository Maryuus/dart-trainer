"use client";

import { useEffect, useState } from "react";
import { LogOut, Wifi, WifiOff, Hash, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveCredentials, clearCredentials, loginAutodarts } from "@/lib/autodarts";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [boardId, setBoardId] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedBoardId = localStorage.getItem("autodarts_board_id");
    const hasRefresh = !!localStorage.getItem("autodarts_refresh_token");
    if (storedBoardId) setBoardId(storedBoardId);
    if (hasRefresh) setSaved(true);
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim() || !boardId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await loginAutodarts(email.trim(), password.trim());
      saveCredentials(data.access_token, boardId.trim(), data.expires_in, data.refresh_token);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion échouée");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearCredentials();
    setEmail("");
    setPassword("");
    setSaved(false);
    setError("");
  };

  const canLogin = email.trim().length > 3 && password.trim().length > 0 && boardId.trim().length > 10;

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
                  <CardDescription>Tes identifiants autodarts.io</CardDescription>
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
                {/* Avertissement 2FA */}
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm">
                  <p className="font-semibold text-amber-300 mb-1">⚠️ Prérequis</p>
                  <p className="text-white/60">
                    Cette connexion utilise ton <strong className="text-white">email + mot de passe</strong> Autodarts.
                    Si tu te connectes uniquement via Google, tu dois d&apos;abord{" "}
                    <strong className="text-white">définir un mot de passe</strong> dans ton profil Autodarts
                    et <strong className="text-white">désactiver la 2FA</strong>.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    Mot de passe
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && canLogin && handleLogin()}
                  />
                </div>

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

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <Button onClick={handleLogin} disabled={!canLogin || loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {loading ? "Connexion…" : "Se connecter"}
                </Button>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Authentifié — l&apos;accès est renouvelé automatiquement à chaque session.
                  </p>
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
              pendant les sessions, même si Autodarts est connecté — utile comme fallback.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
