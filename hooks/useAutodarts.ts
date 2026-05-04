"use client";

import { useCallback, useEffect, useState } from "react";
import { loginAutodarts, saveCredentials, saveBoardId, loadCredentials, clearCredentials } from "@/lib/autodarts";

export function useAutodartsSettings() {
  const [token, setToken] = useState<string | null>(null);
  const [boardId, setBoardId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = loadCredentials();
    if (creds) {
      setToken(creds.token);
      setBoardId(creds.boardId);
    } else {
      // board ID might be saved without a valid token
      const saved = localStorage.getItem("autodarts_board_id");
      if (saved) setBoardId(saved);
    }
  }, []);

  const login = useCallback(async (username: string, password: string, board: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginAutodarts(username, password);
      saveCredentials(data.access_token, board.trim(), data.expires_in);
      setToken(data.access_token);
      setBoardId(board.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearCredentials();
    setToken(null);
    setBoardId("");
    setError(null);
  }, []);

  const isConfigured = !!token;

  return { token, boardId, loading, error, isConfigured, login, logout };
}
