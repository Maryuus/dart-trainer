"use client";

import { useState } from "react";
import { Save, Trash2, Wifi, WifiOff, KeyRound, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAutodartsSettings } from "@/hooks/useAutodarts";

export default function SettingsPage() {
  const { apiKey, boardId, saved, save, logout } = useAutodartsSettings();

  const [keyInput, setKeyInput] = useState(apiKey);
  const [idInput, setIdInput] = useState(boardId);

  // Sync inputs when credentials load from localStorage
  const [synced, setSynced] = useState(false);
  if (!synced && apiKey) {
    setKeyInput(apiKey);
    setIdInput(boardId);
    setSynced(true);
  }

  const canSave = keyInput.trim().length > 0 && idInput.trim().length > 0;

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
                  <CardDescription>API Key + Board ID</CardDescription>
                </div>
              </div>
              <Badge variant={saved ? "success" : "secondary"}>
                {saved ? "Configuré" : "Non configuré"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {/* Where to find the values */}
            <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/60 flex flex-col gap-1.5">
              <p className="font-semibold text-white/80 mb-1">Où trouver ces infos ?</p>
              <p>1. Connecte-toi sur <strong className="text-white">autodarts.io</strong></p>
              <p>2. Va dans <strong className="text-white">Paramètres → API</strong></p>
              <p>3. Copie ton <strong className="text-white">API Key</strong> et ton <strong className="text-white">Board ID</strong></p>
            </div>

            {/* API Key input */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                <KeyRound className="w-3.5 h-3.5" />
                API Key
              </label>
              <Input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
            </div>

            {/* Board ID input */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-white/70 mb-2">
                <Hash className="w-3.5 h-3.5" />
                Board ID
              </label>
              <Input
                value={idInput}
                onChange={(e) => setIdInput(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => save(keyInput, idInput)}
                disabled={!canSave}
                className="flex-1"
              >
                <Save className="w-4 h-4" />
                {saved ? "Mettre à jour" : "Enregistrer"}
              </Button>
              {saved && (
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              )}
            </div>

            {saved && (
              <p className="text-xs text-emerald-400/80">
                ✓ Credentials enregistrés — les lancers seront détectés automatiquement pendant les sessions.
              </p>
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
              Sans Autodarts configuré, des boutons <strong className="text-white">Touché / Raté</strong> s&apos;affichent pendant les sessions pour saisir ta progression manuellement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
