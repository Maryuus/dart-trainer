"use client";

import { Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConnectionStatus as ConnStatus } from "@/lib/types";

interface Props {
  status: ConnStatus;
  boardName?: string;
}

const config: Record<ConnStatus, { icon: React.ElementType; label: string; color: string; pulse: boolean }> = {
  connected: { icon: Wifi, label: "Connecté", color: "text-emerald-400", pulse: true },
  connecting: { icon: Loader2, label: "Connexion…", color: "text-amber-400", pulse: false },
  disconnected: { icon: WifiOff, label: "Déconnecté", color: "text-white/40", pulse: false },
  error: { icon: AlertCircle, label: "Token expiré", color: "text-red-400", pulse: false },
};

export function ConnectionStatus({ status, boardName }: Props) {
  const { icon: Icon, label, color, pulse } = config[status];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-emerald-500 opacity-30 animate-ping" />
        )}
        <Icon
          className={cn("h-4 w-4 relative", color, status === "connecting" && "animate-spin")}
        />
      </div>
      <span className={cn("text-xs font-medium", color)}>
        {boardName && status === "connected" ? boardName : label}
      </span>
    </div>
  );
}
