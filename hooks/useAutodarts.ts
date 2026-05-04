"use client";

import { useCallback, useEffect, useState } from "react";
import { saveCredentials, loadCredentials, clearCredentials } from "@/lib/autodarts";

export function useAutodartsSettings() {
  const [apiKey, setApiKey] = useState("");
  const [boardId, setBoardId] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const creds = loadCredentials();
    if (creds) {
      setApiKey(creds.apiKey);
      setBoardId(creds.boardId);
      setSaved(true);
    }
  }, []);

  const save = useCallback((key: string, id: string) => {
    saveCredentials(key.trim(), id.trim());
    setApiKey(key.trim());
    setBoardId(id.trim());
    setSaved(true);
  }, []);

  const logout = useCallback(() => {
    clearCredentials();
    setApiKey("");
    setBoardId("");
    setSaved(false);
  }, []);

  return { apiKey, boardId, saved, save, logout };
}
