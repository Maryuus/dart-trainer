"use client";

import Link from "next/link";
import { Play, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { segmentFullLabel } from "@/lib/utils";
import type { Routine } from "@/lib/types";

interface Props {
  routine: Routine;
  onDelete?: (id: string) => void;
}

export function RoutineCard({ routine, onDelete }: Props) {
  const totalThrows = routine.steps.reduce((acc, s) => acc + s.throws, 0);

  return (
    <Card className="group hover:border-emerald-500/30 hover:bg-white/8 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate">{routine.name}</CardTitle>
            {routine.description && (
              <CardDescription className="mt-1 line-clamp-2">{routine.description}</CardDescription>
            )}
          </div>
          <Badge variant="secondary">{totalThrows} lancers</Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-1.5">
          {routine.steps.slice(0, 5).map((step) => (
            <span
              key={step.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/60"
            >
              {step.label || segmentFullLabel(step.segment)}
              <span className="text-white/30">×{step.throws}</span>
            </span>
          ))}
          {routine.steps.length > 5 && (
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/40">
              +{routine.steps.length - 5}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild size="lg" className="flex-1">
          <Link href={`/session/${routine.id}`}>
            <Play className="w-4 h-4" />
            Lancer
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon">
          <Link href={`/routines/${routine.id}`}>
            <Pencil className="w-4 h-4" />
          </Link>
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(routine.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
