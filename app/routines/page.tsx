"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutineCard } from "@/components/RoutineCard";
import { loadRoutines, saveRoutines, deleteRoutine } from "@/lib/routines";
import type { Routine } from "@/lib/types";

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    setRoutines(loadRoutines());
  }, []);

  const handleDelete = (id: string) => {
    const updated = deleteRoutine(routines, id);
    setRoutines(updated);
    saveRoutines(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Mes routines</h1>
          <p className="text-white/40 text-sm mt-1">Crée et gère tes programmes d&apos;entraînement</p>
        </div>
        <Button asChild>
          <Link href="/routines/new">
            <Plus className="w-4 h-4" />
            Nouvelle
          </Link>
        </Button>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-white/10 rounded-2xl">
          <p className="text-white/30 mb-4">Aucune routine</p>
          <Button asChild size="sm">
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
  );
}
