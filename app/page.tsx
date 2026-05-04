"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Target, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutineCard } from "@/components/RoutineCard";
import { loadRoutines, saveRoutines, deleteRoutine } from "@/lib/routines";
import { loadToken } from "@/lib/autodarts";
import type { Routine } from "@/lib/types";

export default function HomePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setRoutines(loadRoutines());
    setIsConnected(!!loadToken());
  }, []);

  const handleDelete = (id: string) => {
    const updated = deleteRoutine(routines, id);
    setRoutines(updated);
    saveRoutines(updated);
  };

  return (
    <div className="min-h-full" style={{
      background: "radial-gradient(ellipse at top left, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(59,130,246,0.05) 0%, transparent 50%), #09090b"
    }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">DartTrainer</h1>
              <p className="text-white/40 text-sm">Connecté à Autodarts</p>
            </div>
          </div>

          {/* Connection banner */}
          {!isConnected && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-amber-300">
                  Connecte ton compte Autodarts pour recevoir les lancers automatiquement
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 shrink-0">
                <Link href="/settings">Configurer</Link>
              </Button>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: Target, label: "Routines", value: routines.length },
              { icon: Zap, label: "Étapes totales", value: routines.reduce((a, r) => a + r.steps.length, 0) },
              { icon: TrendingUp, label: "Lancers totaux", value: routines.reduce((a, r) => a + r.steps.reduce((b, s) => b + s.throws, 0), 0) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
                <Icon className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-white/40">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Routines */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Mes routines</h2>
          <Button asChild size="sm">
            <Link href="/routines/new">
              <Plus className="w-4 h-4" />
              Nouvelle routine
            </Link>
          </Button>
        </div>

        {routines.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <Target className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-sm">Aucune routine pour l&apos;instant</p>
            <Button asChild className="mt-4" size="sm">
              <Link href="/routines/new">Créer ma première routine</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {routines.map((routine) => (
              <RoutineCard key={routine.id} routine={routine} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
