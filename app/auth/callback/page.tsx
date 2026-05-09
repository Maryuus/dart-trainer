"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { saveCredentials } from "@/lib/autodarts";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setErrorMsg(searchParams.get("error_description") ?? error);
      setStatus("error");
      return;
    }

    if (!code) {
      setErrorMsg("Code d'autorisation manquant.");
      setStatus("error");
      return;
    }

    // Vérification du state anti-CSRF
    const savedState = sessionStorage.getItem("oauth_state");
    if (state !== savedState) {
      setErrorMsg("State invalide — possible attaque CSRF.");
      setStatus("error");
      return;
    }

    const codeVerifier = sessionStorage.getItem("code_verifier");
    const boardId = sessionStorage.getItem("pending_board_id") ?? localStorage.getItem("autodarts_board_id") ?? "";
    const redirectUri = `${window.location.origin}/auth/callback`;

    if (!codeVerifier) {
      setErrorMsg("Code verifier manquant.");
      setStatus("error");
      return;
    }

    // Échange du code contre les tokens (via notre API server-side)
    fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: codeVerifier, redirect_uri: redirectUri }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        saveCredentials(data.access_token, boardId, data.expires_in, data.refresh_token);
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("code_verifier");
        sessionStorage.removeItem("pending_board_id");
        setStatus("success");
        setTimeout(() => router.replace("/settings"), 1500);
      })
      .catch((e) => {
        setErrorMsg(e.message);
        setStatus("error");
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
            <p className="text-white/60">Connexion en cours…</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <p className="text-white font-bold">Connecté !</p>
            <p className="text-white/40 text-sm mt-1">Redirection…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <p className="text-white font-bold mb-2">Erreur de connexion</p>
            <p className="text-red-400/80 text-sm max-w-sm">{errorMsg}</p>
            <button
              onClick={() => router.replace("/settings")}
              className="mt-6 text-sm text-white/40 underline"
            >
              Retour aux paramètres
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
