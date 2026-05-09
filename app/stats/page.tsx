"use client";

import { useEffect, useState } from "react";
import { BarChart2, Target, Flame, Trophy, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  loadSessions,
  clearSessions,
  computeOverallStats,
  computeSegmentStats,
  computeRoutineStats,
  type SavedSession,
  type SegmentStat,
} from "@/lib/stats";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

function RateBar({ rate, className }: { rate: number; className?: string }) {
  const color =
    rate >= 70 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className={cn("h-1.5 rounded-full bg-white/10 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${rate}%` }}
      />
    </div>
  );
}

function RateBadge({ rate }: { rate: number }) {
  const cls =
    rate >= 70
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : rate >= 40
      ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", cls)}>
      {rate}%
    </span>
  );
}

export default function StatsPage() {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSessions(loadSessions());
    setLoaded(true);
  }, []);

  const overall = computeOverallStats(sessions);
  const segmentStats = computeSegmentStats(sessions);
  const routineStats = computeRoutineStats(sessions);

  const handleClear = () => {
    if (!confirm("Effacer toutes les statistiques ? Cette action est irréversible.")) return;
    clearSessions();
    setSessions([]);
  };

  if (!loaded) return null;

  if (sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-8 h-8 text-white/20" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Statistiques</h1>
        <p className="text-white/40 text-sm">
          Aucune session enregistrée pour l'instant.<br />
          Lance une routine pour commencer à accumuler des stats.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Statistiques</h1>
          <p className="text-white/40 text-sm mt-1">{overall.totalSessions} session{overall.totalSessions > 1 ? "s" : ""} enregistrée{overall.totalSessions > 1 ? "s" : ""}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
          <Trash2 className="w-4 h-4" />
          Effacer
        </Button>
      </div>

      <div className="flex flex-col gap-5">

        {/* Vue globale */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Lancers", value: overall.totalThrows, icon: Target },
            { label: "Touchés", value: overall.totalHits, icon: Flame },
            { label: "Précision", value: `${overall.rate}%`, icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 rounded-2xl border border-white/10 bg-white/5 text-center">
              <Icon className="w-4 h-4 text-white/30 mx-auto mb-2" />
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-white/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Stats par segment */}
        {segmentStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Par segment</CardTitle>
              <CardDescription>% de réussite par zone ciblée</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {segmentStats.map((stat: SegmentStat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <span className="w-12 text-sm font-mono font-bold text-white shrink-0">
                    {stat.label}
                  </span>
                  <div className="flex-1">
                    <RateBar rate={stat.rate} />
                  </div>
                  <RateBadge rate={stat.rate} />
                  <span className="text-xs text-white/25 w-16 text-right shrink-0">
                    {stat.hits}/{stat.throws}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Stats par routine */}
        {routineStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Par routine</CardTitle>
              <CardDescription>Précision moyenne par routine</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {routineStats.map((stat) => (
                <div key={stat.name} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-white truncate">{stat.name}</span>
                  <span className="text-xs text-white/30 shrink-0">
                    {stat.sessions} session{stat.sessions > 1 ? "s" : ""}
                  </span>
                  <RateBadge rate={stat.avgRate} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Historique des sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>Tes {Math.min(sessions.length, 20)} dernières sessions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {sessions.slice(0, 20).map((s) => {
              const hits = s.results.filter((r) => r.hit).length;
              const rate = s.results.length > 0 ? Math.round((hits / s.results.length) * 100) : 0;
              const date = new Date(s.completedAt);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.routineName}</p>
                    <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDuration(s.duration)} · {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <RateBadge rate={rate} />
                    <p className="text-xs text-white/25 mt-1">{hits}/{s.results.length}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
