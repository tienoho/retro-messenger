import type { FormEvent } from "react";
import type { DesktopUpdaterState } from "@retro/contracts";
import { DesktopUpdater } from "./DesktopUpdater";

export interface DesktopAuthProps {
  mode: "login" | "register";
  username: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  rememberId: boolean;
  invisibleLogin: boolean;
  busy: boolean;
  error: string | null;
  updater: DesktopUpdaterState;
  onModeChange: (mode: "login" | "register") => void;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRememberIdChange: (value: boolean) => void;
  onInvisibleLoginChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectDemo: (username: string, pass: string) => void;
}

export function DesktopAuth({
  mode,
  username,
  displayName,
  password,
  confirmPassword,
  rememberId,
  invisibleLogin,
  busy,
  error,
  updater,
  onModeChange,
  onUsernameChange,
  onDisplayNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRememberIdChange,
  onInvisibleLoginChange,
  onSubmit,
  onSelectDemo,
}: DesktopAuthProps) {
  return (
    <main className="authScreen">
      <div className="authStack">
        <section className="authPanel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div className="brandMark">R!</div>
            <div
              style={{
                display: "flex",
                background: "#f3e8ff",
                borderRadius: "20px",
                padding: "2px",
                gap: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => onModeChange("login")}
                style={{
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "18px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: mode === "login" ? "#5b1e84" : "transparent",
                  color: mode === "login" ? "#ffffff" : "#6b21a8",
                  transition: "all 0.15s ease",
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => onModeChange("register")}
                style={{
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: "18px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  background: mode === "register" ? "#5b1e84" : "transparent",
                  color: mode === "register" ? "#ffffff" : "#6b21a8",
                  transition: "all 0.15s ease",
                }}
              >
                Đăng ký
              </button>
            </div>
          </div>

          <p className="eyebrow">RETRO YAHOO! MESSENGER</p>
          <h1>
            {mode === "login"
              ? "Đăng nhập Yahoo! ID"
              : "Tạo tài khoản Yahoo! mới"}
          </h1>
          <p className="authCopy">
            {mode === "login"
              ? "Phiên đăng nhập được mã hóa bởi hệ thống DPAPI bảo mật cao."
              : "Tham gia thế giới hoài niệm kết hợp công nghệ hiện đại."}
          </p>

          {mode === "login" && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "6px", fontWeight: 600 }}>
                Tài khoản dùng thử nhanh:
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="secondaryButton"
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: "#fdf4ff",
                    border: "1px solid #d946ef",
                    color: "#a21caf",
                    fontWeight: 600,
                  }}
                  onClick={() => onSelectDemo("honganh", "RetroPass123!")}
                >
                  honganh
                </button>
                <button
                  type="button"
                  className="secondaryButton"
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: "#f0fdf4",
                    border: "1px solid #22c55e",
                    color: "#15803d",
                    fontWeight: 600,
                  }}
                  onClick={() => onSelectDemo("hoangnam", "RetroPass123!")}
                >
                  hoangnam
                </button>
                <button
                  type="button"
                  className="secondaryButton"
                  style={{
                    fontSize: "11px",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    background: "#eff6ff",
                    border: "1px solid #3b82f6",
                    color: "#1d4ed8",
                    fontWeight: 600,
                  }}
                  onClick={() => onSelectDemo("retro_tester", "RetroPass123!")}
                >
                  retro_tester
                </button>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit}>
            {mode === "register" && (
              <label>
                Tên hiển thị (Nickname)
                <input
                  autoComplete="name"
                  maxLength={64}
                  value={displayName}
                  onChange={(event) => onDisplayNameChange(event.target.value)}
                  placeholder="Ví dụ: Hoàng Nam (Yahoo!)"
                  required
                />
              </label>
            )}

            <label>
              Tên đăng nhập (Yahoo! ID)
              <input
                autoComplete="username"
                maxLength={64}
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                placeholder="Ví dụ: nam_retro_9x"
                required
              />
            </label>

            <label>
              Mật khẩu
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
              />
            </label>

            {mode === "register" && (
              <label>
                Xác nhận mật khẩu
                <input
                  autoComplete="new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => onConfirmPasswordChange(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </label>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "4px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "12px", color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => onRememberIdChange(e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                Ghi nhớ Yahoo! ID
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal", cursor: "pointer", fontSize: "12px", color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={invisibleLogin}
                  onChange={(e) => onInvisibleLoginChange(e.target.checked)}
                  style={{ width: "auto", margin: 0 }}
                />
                Đăng nhập Ẩn mình (Sign in as Invisible)
              </label>
            </div>

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}

            <button className="primaryButton" disabled={busy} type="submit">
              {busy
                ? "Đang xử lý…"
                : mode === "login"
                  ? "Đăng nhập Yahoo!"
                  : "Tạo tài khoản Yahoo!"}
            </button>

            <div style={{ textAlign: "center", marginTop: "8px" }}>
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => onModeChange("register")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7c3aed",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Chưa có tài khoản Yahoo? Đăng ký ngay
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onModeChange("login")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#7c3aed",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Đã có tài khoản Yahoo? Đăng nhập tại đây
                </button>
              )}
            </div>
          </form>
        </section>
        <DesktopUpdater state={updater} />
      </div>
    </main>
  );
}

