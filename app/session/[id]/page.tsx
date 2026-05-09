"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, RotateCcw, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DartBoard } from "@/components/DartBoard";
import { ThrowHistory } from "@/components/ThrowHistory";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { loadRoutines } from "@/lib/routines";
import { loadCredentials, getValidCredentials, AutodartsSocket, parseThrowToSegment } from "@/lib/autodarts";
import { segmentFullLabel, formatDuration } from "@/lib/utils";
import { useRoutineSession } from "@/hooks/useRoutineSession";
import type { Routine, DartSegment, AutodartsThrow } from "@/lib/types";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");

  const {
    session,
    lastThrow,
    stepResults,
    totalHits,
    totalThrows,
    overallRate,
    start,
    reset,
    recordThrow,
    manualThrow,
    correctThrow,
  } = useRoutineSession(routine);

  useEffect(() => {
    const all = loadRoutines();
    const found = all.find((r) => r.id === id);
    if (!found) { router.replace("/"); return; }
    setRoutine(found);
  }, [id, router]);

  // WebSocket connection
  useEffect(() => {
    if (!session || session.status === "done") return;
    // On a besoin au minimum d'un refresh token ou d'un access token valide
    const hasToken = !!(
      loadCredentials() ||
      (typeof window !== "undefined" && localStorage.getItem("autodarts_refresh_token"))
    );
    if (!hasToken) return;

    setWsStatus("connecting");
    let cancelled = false;
    let socket: InstanceType<typeof AutodartsSocket> | null = null;

    getValidCredentials().then((resolved) => {
      if (cancelled || !resolved) {
        if (!cancelled) setWsStatus("error");
        return;
      }
      socket = new AutodartsSocket(
        resolved.boardId,
        resolved.token,
        (segment: DartSegment | null, _raw: AutodartsThrow) => { recordThrow(segment); },
        (status) => {
          setWsStatus(status === "connected" ? "connected" : status === "error" ? "error" : "disconnected");
        }
      );
      socket.connect();
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
      setWsStatus("disconnected");
    };
  }, [session?.status, recordThrow]);

  // Elapsed timer
  useEffect(() => {
    if (!session || session.status === "done") return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - session.startedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!routine) return null;

  const currentStep = session ? routine.steps[session.currentStepIndex] : null;
  const stepProgress = session
    ? (session.currentThrowIndex / (currentStep?.throws ?? 1)) * 100
    : 0;
  const globalProgress = session
    ? ((session.currentStepIndex + session.currentThrowIndex / (currentStep?.throws ?? 1)) /
        routine.steps.length) * 100
    : 0;

  const hasAutodarts = !!(loadCredentials() ?? (typeof window !== "undefined" && localStorage.getItem("autodarts_refresh_token")));

  // Done screen
  if (session?.status === "done") {
    return (
      <div className="min-h-full flex items-center justify-center px-4 py-10" style={{background: "radial-gradient(ellipse at center, rgba(16,185,129,0.1) 0%, transparent 60%), #09090b"}}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-4xl font-black text-white mb-2">Routine terminée !</h2>
          <p className="text-white/50 mb-8">
            {formatDuration(elapsed)} · {totalThrows} lancers · {overallRate}% de précision
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "Lancers", value: totalThrows },
              { label: "Touchés", value: totalHits },
              { label: "Précision", value: `${overallRate}%` },
            ].map(({ label, value }) => (
              <div key={label} className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-white/40 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => { reset(); start(); }} size="lg">
              <RotateCcw className="w-4 h-4" />
              Recommencer
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{background: "radial-gradient(ellipse at top, rgba(16,185,129,0.06) 0%, transparent 50%), #09090b"}}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {session && <span className="text-white/40 text-sm font-mono">{formatDuration(elapsed)}</span>}
            {/* N'afficher le statut WebSocket que pendant une session active */}
            {session && hasAutodarts && <ConnectionStatus status={wsStatus} />}
          </div>
        </div>

        {/* Routine title */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">{routine.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={globalProgress} className="flex-1 h-1.5" />
            <span className="text-xs text-white/40 shrink-0">
              {session ? session.currentStepIndex + 1 : 1}/{routine.steps.length}
            </span>
          </div>
        </div>

        {!session ? (
          /* Start screen */
          <div className="text-center py-10">
            <div className="flex flex-col gap-3 mb-8 max-w-sm mx-auto">
              {routine.steps.map((step, i) => (
                <div key={step.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 text-white/40 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                    <span className="text-sm font-medium text-white">{step.label || segmentFullLabel(step.segment)}</span>
                  </div>
                  <span className="text-xs text-white/40">{step.throws} lancers</span>
                </div>
              ))}
            </div>

            {!hasAutodarts && (
              <p className="text-amber-400/70 text-xs mb-4 text-center">
                Mode manuel — Autodarts non configuré
              </p>
            )}

            <Button size="lg" onClick={start} className="px-10">
              <Play className="w-5 h-5" />
              Démarrer la routine
            </Button>
          </div>
        ) : (
          /* Active session */
          <div className="flex flex-col items-center gap-6">
            {/* Current step info */}
            {currentStep && (
              <>
                <div className="text-center">
                  <p className="text-white/40 text-sm mb-1">Cible actuelle</p>
                  <h2 className="text-xl font-bold text-white">
                    {currentStep.label || segmentFullLabel(currentStep.segment)}
                  </h2>
                </div>

                {/* Dartboard visual */}
                <DartBoard
                  target={currentStep.segment}
                  hit={lastThrow?.hit ?? null}
                />

                {/* Dernier lancer détecté — debug visuel */}
                {lastThrow && (
                  <div className={`text-xs px-3 py-1.5 rounded-full border font-mono ${
                    lastThrow.hit
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}>
                    Détecté&nbsp;:{" "}
                    <span className="font-bold">
                      {lastThrow.segment ? segmentFullLabel(lastThrow.segment) : "Miss"}
                    </span>
                    {" "}→ {lastThrow.hit ? "✓ Touché" : "✗ Raté"}
                  </div>
                )}

                {/* Throw counter */}
                <div className="text-center">
                  <div className="text-5xl font-black text-white">
                    {session.currentThrowIndex}
                    <span className="text-white/20 text-3xl">/{currentStep.throws}</span>
                  </div>
                  <p className="text-white/40 text-sm mt-1">lancers effectués</p>
                  <Progress value={stepProgress} className="mt-3 w-48 mx-auto" />
                </div>

                {/* Throw history for this step */}
                <ThrowHistory
                  results={stepResults}
                  totalThrows={currentStep.throws}
                  onCorrect={(throwIndex) =>
                    session && correctThrow(session.currentStepIndex, throwIndex)
                  }
                />

                {/* Boutons toujours visibles : auto si connecté, fallback sinon */}
                <div className="flex flex-col items-center gap-2">
                  {hasAutodarts && wsStatus !== "connected" && (
                    <p className={`text-xs mb-1 ${wsStatus === "error" ? "text-red-400/80" : "text-white/30"}`}>
                      {wsStatus === "connecting"
                        ? "Connexion Autodarts en cours…"
                        : wsStatus === "error"
                        ? <>Token expiré ou invalide — <Link href="/settings" className="underline">mets-le à jour</Link></>
                        : "Autodarts non connecté — mode manuel actif"}
                    </p>
                  )}
                  {hasAutodarts && wsStatus === "connected" && (
                    <p className="text-xs text-emerald-400/60 mb-1">Détection automatique active</p>
                  )}
                  <div className="flex gap-3">
                    <Button
                      size="lg"
                      onClick={() => manualThrow(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 px-8"
                    >
                      ✓ Touché
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => manualThrow(false)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 px-8"
                    >
                      ✗ Raté
                    </Button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-lg font-bold text-white">{overallRate}%</div>
                    <div className="text-xs text-white/40">Précision</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{totalHits}</div>
                    <div className="text-xs text-white/40">Touchés</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">{totalThrows}</div>
                    <div className="text-xs text-white/40">Lancers</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <RotateCcw className="w-4 h-4" />
                    Abandon
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
