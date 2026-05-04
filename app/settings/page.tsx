"use client";

import { useEffect, useState } from "react";
import { LogOut, Wifi, WifiOff, Hash, Key, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveCredentials, loadCredentials, clearCredentials } from "@/lib/autodarts";

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [boardId, setBoardId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const creds = loadCredentials();
    if (creds) {
      setToken(creds.token);
      setBoardId(creds.boardId);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (!token.trim() || !boardId.trim()) return;
    saveCredentials(token.trim(), boardId.trim(), 3600 * 8);
    setSaved(true);
  };

  const handleLogout = () => {
    clearCredentials();
    setToken("");
    setBoardId("");
    setSaved(false);
  };

  const canSave = token.trim().length > 10 && boardId.trim().length > 10;

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
                  <CardDescription>Token OAuth + Board ID</CardDescription>
                </div>
              </div>
              <Badge variant={saved ? "success" : "secondary"}>
                {saved ? "Configuré" : "Non configuré"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {/* Instructions */}
            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-sm flex flex-col gap-2">
              <p className="font-semibold text-white/80">Comment obtenir ton token :</p>
              <ol className="text-white/60 flex flex-col gap-1 list-decimal list-inside">
                <li>Va sur <strong className="text-white">play.autodarts.io</strong> (connecté avec Google)</li>
                <li>Appuie sur <strong className="text-white">F12</strong> → onglet <strong className="text-white">Réseau</strong></li>
                <li>Clique n&apos;importe où sur la page pour déclencher une requête</li>
                <li>Cherche une requête vers <strong className="text-white">api.autodarts.io</strong></li>
                <li>Clique dessus → <strong className="text-white">En-têtes</strong> → trouve <code className="bg-white/10 px-1 rounded">Authorization: Bearer xxx...</code></li>
                <li>Copie tout ce qui est après <code className="bg-white/10 px-1 rounded">Bearer </code></li>
              </ol>
            </div>

            {/* Token input */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                <Key className="w-3.5 h-3.5" />
                Token OAuth (Bearer)
              </label>
              <textarea
                value={token}
                onChange={(e) => { setToken(e.target.value); setSaved(false); }}
                placeholder="eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIi..."
                rows={3}
                className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs text-white font-mono placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
              />
              <p className="text-xs text-white/30 mt-1">
                Le token expire après quelques heures — reviens ici pour le renouveler si la connexion est perdue.
              </p>
            </div>

            {/* Board ID */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                <Hash className="w-3.5 h-3.5" />
                Board ID
              </label>
              <Input
                value={boardId}
                onChange={(e) => { setBoardId(e.target.value); setSaved(false); }}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
              <p className="text-xs text-white/30 mt-1">
                Disponible dans autodarts.io → Paramètres → ton board
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={!canSave} className="flex-1">
                <Wifi className="w-4 h-4" />
                {saved ? "Mis à jour" : "Enregistrer"}
              </Button>
              {saved && (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Supprimer
                </Button>
              )}
            </div>

            {saved && (
              <p className="text-xs text-emerald-400/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Token enregistré — connexion WebSocket active pendant les sessions.
              </p>
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
              Les boutons <strong className="text-white">Touché / Raté</strong> sont toujours visibles pendant les sessions, même si Autodarts est connecté — utile comme fallback.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
