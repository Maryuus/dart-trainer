"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepEditor } from "@/components/StepEditor";
import { createRoutine, loadRoutines, saveRoutines } from "@/lib/routines";
import { generateId } from "@/lib/utils";
import type { RoutineStep } from "@/lib/types";

export default function NewRoutinePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<RoutineStep[]>([
    { id: generateId(), label: "Triple 20", segment: { type: "triple", value: 20 }, throws: 15 },
  ]);

  const handleSave = () => {
    if (!name.trim() || steps.length === 0) return;
    const routine = createRoutine({ name: name.trim(), description: description.trim(), steps });
    const existing = loadRoutines();
    saveRoutines([...existing, routine]);
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/routines">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl font-black text-white">Nouvelle routine</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Metadata */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Nom de la routine *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Échauffement matinal"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/70 block mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décris ta routine…"
            />
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <h2 className="text-base font-bold text-white mb-4">Étapes d&apos;entraînement</h2>
          <StepEditor steps={steps} onChange={setSteps} />
        </div>

        {/* Save */}
        <Button
          size="lg"
          onClick={handleSave}
          disabled={!name.trim() || steps.length === 0}
        >
          <Save className="w-4 h-4" />
          Enregistrer la routine
        </Button>
      </div>
    </div>
  );
}
