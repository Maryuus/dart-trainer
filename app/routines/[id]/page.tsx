"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepEditor } from "@/components/StepEditor";
import { loadRoutines, saveRoutines, updateRoutine, deleteRoutine } from "@/lib/routines";
import type { Routine, RoutineStep } from "@/lib/types";

export default function EditRoutinePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<RoutineStep[]>([]);

  useEffect(() => {
    const all = loadRoutines();
    const found = all.find((r) => r.id === id);
    if (!found) { router.replace("/routines"); return; }
    setRoutine(found);
    setName(found.name);
    setDescription(found.description);
    setSteps(found.steps);
  }, [id, router]);

  const handleSave = () => {
    if (!routine || !name.trim() || steps.length === 0) return;
    const updated = { ...routine, name: name.trim(), description: description.trim(), steps };
    const all = loadRoutines();
    saveRoutines(updateRoutine(all, updated));
    router.push("/routines");
  };

  const handleDelete = () => {
    if (!routine) return;
    const all = loadRoutines();
    saveRoutines(deleteRoutine(all, routine.id));
    router.push("/routines");
  };

  if (!routine) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/routines">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-black text-white flex-1">Modifier la routine</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Nom *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h2 className="text-base font-bold text-white mb-4">Étapes</h2>
          <StepEditor steps={steps} onChange={setSteps} />
        </div>

        <Button size="lg" onClick={handleSave} disabled={!name.trim() || steps.length === 0}>
          <Save className="w-4 h-4" />
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
