"use client";

import { useCallback, useEffect, useState } from "react";
import { loadCredentials, clearCredentials } from "@/lib/autodarts";

export function useAutodartsSettings() {
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsConfigured(!!loadCredentials());
  }, []);

  const logout = useCallback(() => {
    clearCredentials();
    setIsConfigured(false);
  }, []);

  return { isConfigured, logout };
}
