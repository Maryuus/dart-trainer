"use client";

import { useEffect, useState } from "react";
import { LogOut, Wifi, WifiOff, Hash, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { saveCredentials, loadRefreshToken, clearCredentials } from "@/lib/autodarts";

const SNIPPET = `(function(){var found=false;Object.keys(localStorage).forEach(function(k){try{var d=JSON.parse(localStorage[k]);if(d&&d.refresh_token){console.log('%cCLE: '+k,'color:gray');console.log('%cREFRESH TOKEN - copie tout ce texte :','color:lime;font-weight:bold;font-size:14px');console.log(d.refresh_token);found=true;}}catch(e){}});if(!found){console.log('%cAucun refresh token trouve. Es-tu bien connecte sur play.autodarts.io ?','color:orange');}})();`;

export default function SettingsPage() {
  const [refreshToken, setRefreshToken] = useState("");
  const [boardId, setBoardId] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedBoardId = localStorage.getItem("autodarts_board_id");
    const storedRefresh = loadRefreshToken();
    if (storedBoardId) setBoardId(storedBoardId);
    if (storedRefresh) { setRefreshToken(storedRefresh); setSaved(true); }
  }, []);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!refreshToken.trim() || !boardId.trim()) return;
    saveCredentials("", boardId.trim(), 0, refreshToken.trim());
    localStorage.setItem("autodarts_board_id", boardId.trim());
    setSaved(true);
  };

  const handleLogout = () => {
    clearCredentials();
    setRefreshToken("");
    setBoardId("");
    setSaved(false);
  };

  const canSave = refreshToken.trim().length > 20 && boardId.trim().length > 10;

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
                  <CardDescription>Refresh token — valable 30 jours</CardDescription>
                </div>
              </div>
              <Badge variant={saved ? "success" : "secondary"}>
                {saved ? "Connecté" : "Non configuré"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {/* Étapes */}
            <div className="flex flex-col gap-3">

              {/* Étape 1 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-white">
                  <span className="text-emerald-400 mr-2">①</span>
                  Ouvre play.autodarts.io et connecte-toi
                </p>
                <a
                  href="https://play.autodarts.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 underline w-fit"
                >
                  <ExternalLink className="w-3 h-3" />
                  play.autodarts.io
                </a>
              </div>

              {/* Étape 2 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-white">
                  <span className="text-emerald-400 mr-2">②</span>
                  Ouvre la console (F12 → Console) et colle ce code
                </p>
                <div className="relative">
                  <pre className="text-xs text-white/50 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                    {SNIPPET}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 px-2 text-white/40 hover:text-white"
                    onClick={handleCopySnippet}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-white/40">
                  Appuie sur <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">Entrée</kbd> — le refresh token s&apos;affiche en vert dans la console.
                </p>
              </div>

              {/* Étape 3 */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-white">
                  <span className="text-emerald-400 mr-2">③</span>
                  Colle le refresh token ci-dessous
                </p>
                <textarea
                  value={refreshToken}
                  onChange={(e) => { setRefreshToken(e.target.value); setSaved(false); }}
                  placeholder="eyJhbGciOiJIUzUxMiIsInR5cCIgOiAiSldUIi..."
                  rows={3}
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-xs text-white font-mono placeholder:text-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none"
                />
              </div>

              {/* Board ID */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
                <p className="text-sm font-semibold text-white">
                  <span className="text-emerald-400 mr-2">④</span>
                  Entre ton Board ID
                </p>
                <Input
                  value={boardId}
                  onChange={(e) => { setBoardId(e.target.value); setSaved(false); }}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="font-mono text-xs"
                />
                <p className="text-xs text-white/30">
                  Disponible dans autodarts.io → Paramètres → ton board
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={!canSave} className="flex-1">
                <Wifi className="w-4 h-4" />
                {saved ? "Mis à jour" : "Enregistrer"}
              </Button>
              {saved && (
                <Button variant="ghost" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" />
                  Déconnecter
                </Button>
              )}
            </div>

            {saved && (
              <p className="text-xs text-emerald-400/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connecté — l&apos;access token est renouvelé automatiquement à chaque session.
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
              Les boutons <strong className="text-white">Touché / Raté</strong> sont toujours visibles
              pendant les sessions, même si Autodarts est connecté.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
