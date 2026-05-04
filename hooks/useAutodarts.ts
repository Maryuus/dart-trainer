"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AutodartsSocket,
  clearToken,
  fetchBoards,
  loadToken,
  saveToken,
  parseTokenFromHash,
} from "@/lib/autodarts";
import type { AutodartsBoard, AutodartsThrow, ConnectionStatus, DartSegment } from "@/lib/types";

interface UseAutodartsOptions {
  boardId?: string;
  onThrow?: (segment: DartSegment | null, raw: AutodartsThrow) => void;
}

export function useAutodarts({ boardId, onThrow }: UseAutodartsOptions = {}) {
  const [token, setToken] = useState<string | null>(null);
  const [boards, setBoards] = useState<AutodartsBoard[]>([]);
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>("disconnected");
  const socketRef = useRef<AutodartsSocket | null>(null);

  // Load token on mount + parse from hash (OAuth redirect)
  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      const params = new URLSearchParams(window.location.hash.replace("#", ""));
      const newToken = params.get("access_token");
      const expiresIn = Number(params.get("expires_in") ?? 3600);
      if (newToken) {
        saveToken(newToken, expiresIn);
        setToken(newToken);
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else {
      const stored = loadToken();
      if (stored) setToken(stored);
    }
  }, []);

  // Fetch boards when token changes
  useEffect(() => {
    if (!token) return;
    fetchBoards(token).then(setBoards);
  }, [token]);

  // Connect websocket when boardId + token available
  useEffect(() => {
    if (!token || !boardId || !onThrow) return;

    setWsStatus("connecting");
    const socket = new AutodartsSocket(boardId, token, onThrow, (status) => {
      setWsStatus(status === "connected" ? "connected" : status === "error" ? "error" : "disconnected");
    });
    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, boardId]);

  const logout = useCallback(() => {
    socketRef.current?.disconnect();
    clearToken();
    setToken(null);
    setBoards([]);
    setWsStatus("disconnected");
  }, []);

  const isConnected = !!token;

  return { token, boards, wsStatus, isConnected, logout };
}

export function useAutodartsSettings() {
  const [token, setToken] = useState<string | null>(null);
  const [boards, setBoards] = useState<AutodartsBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [loadingBoards, setLoadingBoards] = useState(false);

  useEffect(() => {
    // Parse OAuth redirect hash
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("access_token")) {
      const t = parseTokenFromHash(window.location.hash);
      const params = new URLSearchParams(window.location.hash.replace("#", ""));
      const expiresIn = Number(params.get("expires_in") ?? 3600);
      if (t) {
        saveToken(t, expiresIn);
        setToken(t);
        window.history.replaceState({}, "", window.location.pathname);
      }
    } else {
      const stored = loadToken();
      setToken(stored);
    }
    const storedBoard = localStorage.getItem("autodarts_board_id");
    if (storedBoard) setSelectedBoardId(storedBoard);
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoadingBoards(true);
    fetchBoards(token)
      .then(setBoards)
      .finally(() => setLoadingBoards(false));
  }, [token]);

  const selectBoard = useCallback((id: string) => {
    setSelectedBoardId(id);
    localStorage.setItem("autodarts_board_id", id);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setBoards([]);
    setSelectedBoardId(null);
  }, []);

  return { token, boards, selectedBoardId, loadingBoards, selectBoard, logout };
}
