import { useEffect, useState, type FormEvent } from "react";
import type { DesktopUpdaterState } from "@retro/contracts";
import type { DesktopSessionState } from "../../shared/ipc-contracts.ts";

const signedOut: DesktopSessionState = { authenticated: false, user: null };

export interface UseDesktopSessionResult {
  session: DesktopSessionState | null;
  updater: DesktopUpdaterState;
  busy: boolean;
  error: string | null;
  username: string;
  password: string;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string | null) => void;
  login: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateStatus: (
    status: "online" | "away" | "busy" | "invisible",
  ) => Promise<void>;
  selectDemo: (user: string, pass: string) => void;
  setUpdater: (updater: DesktopUpdaterState) => void;
}

export function useDesktopSession(): UseDesktopSessionResult {
  const [session, setSession] = useState<DesktopSessionState | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [updater, setUpdater] = useState<DesktopUpdaterState>({
    state: "idle",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      window.retroDesktop.getSession(),
      window.retroDesktop.getUpdaterState(),
    ]).then(([nextSession, nextUpdater]) => {
      if (cancelled) return;
      setSession(nextSession);
      setUpdater(nextUpdater);
    });

    const unsubUpdater = window.retroDesktop.onUpdaterState(setUpdater);
    return () => {
      cancelled = true;
      unsubUpdater();
    };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const nextSession = await window.retroDesktop.login({
        username,
        password,
      });
      setSession(nextSession);
      setPassword("");
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể đăng nhập.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function logout(): Promise<void> {
    setBusy(true);
    try {
      await window.retroDesktop.logout();
    } finally {
      setSession(signedOut);
      setBusy(false);
    }
  }

  async function updateStatus(
    status: "online" | "away" | "busy" | "invisible",
  ): Promise<void> {
    const updated = await window.retroDesktop.updateStatus({ status });
    setSession(updated);
  }

  function selectDemo(user: string, pass: string): void {
    setUsername(user);
    setPassword(pass);
  }

  return {
    session,
    updater,
    busy,
    error,
    username,
    password,
    setUsername,
    setPassword,
    setError,
    login,
    logout,
    updateStatus,
    selectDemo,
    setUpdater,
  };
}

