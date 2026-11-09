import { useEffect, useState, type FormEvent } from "react";
import type { DesktopUpdaterState } from "@retro/contracts";
import type { DesktopSessionState } from "../../shared/ipc-contracts.ts";

const signedOut: DesktopSessionState = { authenticated: false, user: null };
const SAVED_USERNAME_KEY = "retro_saved_username";

export interface UseDesktopSessionResult {
  session: DesktopSessionState | null;
  updater: DesktopUpdaterState;
  busy: boolean;
  error: string | null;
  mode: "login" | "register";
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  rememberId: boolean;
  invisibleLogin: boolean;
  setMode: (mode: "login" | "register") => void;
  setUsername: (username: string) => void;
  setDisplayName: (displayName: string) => void;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  setRememberId: (remember: boolean) => void;
  setInvisibleLogin: (invisible: boolean) => void;
  setError: (error: string | null) => void;
  login: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  register: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  submitAuth: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  logout: () => Promise<void>;
  updateStatus: (
    status: "online" | "away" | "busy" | "invisible",
  ) => Promise<void>;
  updateCustomStatus: (customStatus: string | null) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  selectDemo: (user: string, pass: string) => void;
  setUpdater: (updater: DesktopUpdaterState) => void;
}

export function useDesktopSession(): UseDesktopSessionResult {
  const [session, setSession] = useState<DesktopSessionState | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem(SAVED_USERNAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberId, setRememberId] = useState(() => {
    try {
      return Boolean(localStorage.getItem(SAVED_USERNAME_KEY));
    } catch {
      return false;
    }
  });
  const [invisibleLogin, setInvisibleLogin] = useState(false);
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

  function handleRememberId(userToSave: string, shouldRemember: boolean) {
    try {
      if (shouldRemember && userToSave.trim()) {
        localStorage.setItem(SAVED_USERNAME_KEY, userToSave.trim());
      } else {
        localStorage.removeItem(SAVED_USERNAME_KEY);
      }
    } catch {
      // Storage unavailable
    }
  }

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
      setConfirmPassword("");
      handleRememberId(username, rememberId);

      if (invisibleLogin) {
        await window.retroDesktop.updateStatus({ status: "invisible" });
      }

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

  async function register(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    event.preventDefault();
    setBusy(true);
    setError(null);

    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      setBusy(false);
      return false;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setBusy(false);
      return false;
    }

    try {
      const nextSession = await window.retroDesktop.register({
        username,
        displayName: displayName.trim() || username.trim(),
        password,
      });
      setSession(nextSession);
      setPassword("");
      setConfirmPassword("");
      handleRememberId(username, rememberId);

      if (invisibleLogin) {
        await window.retroDesktop.updateStatus({ status: "invisible" });
      }

      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không thể đăng ký tài khoản.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  function submitAuth(event: FormEvent<HTMLFormElement>): Promise<boolean> {
    if (mode === "register") {
      return register(event);
    }
    return login(event);
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      await window.retroDesktop.changePassword({
        currentPassword,
        newPassword,
      });
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Đổi mật khẩu thất bại.",
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

  async function updateCustomStatus(
    customStatus: string | null,
  ): Promise<void> {
    const updated = await window.retroDesktop.updateProfile({ customStatus });
    setSession(updated);
  }

  function selectDemo(user: string, pass: string): void {
    setMode("login");
    setUsername(user);
    setPassword(pass);
    setError(null);
  }

  return {
    session,
    updater,
    busy,
    error,
    mode,
    username,
    displayName,
    password,
    confirmPassword,
    rememberId,
    invisibleLogin,
    setMode,
    setUsername,
    setDisplayName,
    setPassword,
    setConfirmPassword,
    setRememberId,
    setInvisibleLogin,
    setError,
    login,
    register,
    submitAuth,
    changePassword,
    logout,
    updateStatus,
    updateCustomStatus,
    selectDemo,
    setUpdater,
  };
}

