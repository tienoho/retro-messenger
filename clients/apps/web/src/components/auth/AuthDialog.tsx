import { useState, type FormEvent } from "react";
import { SmileyHappy } from "../../icons/YahooSmileys";
import { IconIdea, IconUser } from "../../icons/UiIcons";

const SAVED_USERNAME_KEY = "retro_saved_username";

export interface AuthDialogProps {
  onLogin: (username: string, password: string, invisible?: boolean) => Promise<void>;
  onRegister: (username: string, displayName: string, password: string, invisible?: boolean) => Promise<void>;
  authenticating: boolean;
  authError: string | null;
  onClearError: () => void;
}

export function AuthDialog({
  onLogin,
  onRegister,
  authenticating,
  authError,
  onClearError,
}: AuthDialogProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
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
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    // Save or clear remembered username
    try {
      if (rememberId && username.trim()) {
        localStorage.setItem(SAVED_USERNAME_KEY, username.trim());
      } else {
        localStorage.removeItem(SAVED_USERNAME_KEY);
      }
    } catch {
      // storage unavailable
    }

    if (authMode === "login") {
      void onLogin(username.trim(), password, invisibleLogin);
    } else {
      if (password.length < 6) {
        setLocalError("Mật khẩu phải chứa ít nhất 6 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Mật khẩu xác nhận không trùng khớp.");
        return;
      }
      void onRegister(username.trim(), displayName.trim() || username.trim(), password, invisibleLogin);
    }
  };

  const handleToggleMode = () => {
    setAuthMode(current => (current === "login" ? "register" : "login"));
    setLocalError(null);
    onClearError();
  };

  const activeError = localError || authError;

  return (
    <main className="authShell">
      <section className="authPanel" aria-labelledby="auth-title">
        <header className="authWindowBar">
          <div className="brandTag">
            <span className="yIcon">R!</span>
            <span>Retro! Messenger — {authMode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}</span>
          </div>
          <div className="retroWindowControls">
            <button className="winControlBtn" type="button" aria-label="Minimize">_</button>
            <button className="winControlBtn closeBtn" type="button" aria-label="Close">✕</button>
          </div>
        </header>

        <div className="authContent">
          <div className="authHeaderBanner">
            <span className="authSmileyAvatar">
              <SmileyHappy size={46} />
            </span>
            <div className="authHeaderTitle">
              <h1 id="auth-title">Retro! Messenger</h1>
              <p>Nền tảng chat phong cách Yahoo! cổ điển</p>
            </div>
          </div>

          <form className="authForm" onSubmit={handleSubmit}>
            <div className="authField">
              <label htmlFor="auth-username">Yahoo! ID / Tên đăng nhập:</label>
              <input
                id="auth-username"
                autoComplete="username"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="Ví dụ: honganh, hoangnam..."
                required
                minLength={3}
              />
            </div>

            {authMode === "register" && (
              <div className="authField">
                <label htmlFor="auth-display-name">Tên hiển thị (Nickname):</label>
                <input
                  id="auth-display-name"
                  autoComplete="name"
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  placeholder="Ví dụ: Hồng Anh (Yahoo!)"
                  required
                />
              </div>
            )}

            <div className="authField">
              <label htmlFor="auth-password">Mật khẩu:</label>
              <input
                id="auth-password"
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)..."
                required
                minLength={6}
              />
            </div>

            {authMode === "register" && (
              <div className="authField">
                <label htmlFor="auth-confirm-password">Xác nhận mật khẩu:</label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  required
                  minLength={6}
                />
              </div>
            )}

            {authMode === "login" && (
              <div className="authQuickRow">
                <span className="authQuickTitle">
                  <IconIdea size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  Tài khoản mẫu (click để tự điền):
                </span>
                <div className="authQuickButtons">
                  <button
                    type="button"
                    className="authQuickBtn"
                    onClick={() => {
                      setUsername("honganh");
                      setPassword("RetroPass123!");
                      setLocalError(null);
                      onClearError();
                    }}
                  >
                    <IconUser size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    honganh
                  </button>
                  <button
                    type="button"
                    className="authQuickBtn"
                    onClick={() => {
                      setUsername("hoangnam");
                      setPassword("RetroPass123!");
                      setLocalError(null);
                      onClearError();
                    }}
                  >
                    <IconUser size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    hoangnam
                  </button>
                  <button
                    type="button"
                    className="authQuickBtn"
                    onClick={() => {
                      setUsername("retro_tester");
                      setPassword("RetroPass123!");
                      setLocalError(null);
                      onClearError();
                    }}
                  >
                    <IconUser size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
                    retro_tester
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "6px 0" }}>
              <div className="authRememberRow">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberId}
                  onChange={e => setRememberId(e.target.checked)}
                />
                <label htmlFor="remember-me">Ghi nhớ Yahoo! ID</label>
              </div>

              <div className="authRememberRow">
                <input
                  type="checkbox"
                  id="invisible-login"
                  checked={invisibleLogin}
                  onChange={e => setInvisibleLogin(e.target.checked)}
                />
                <label htmlFor="invisible-login">Đăng nhập Ẩn mình (Sign in as Invisible)</label>
              </div>
            </div>

            {activeError && <p className="authError" role="alert">{activeError}</p>}

            <button className="authSubmitBtn" type="submit" disabled={authenticating}>
              {authenticating
                ? "Đang kết nối đến máy chủ…"
                : authMode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
            </button>
          </form>

          <div className="authToggleRow">
            <button
              type="button"
              className="authToggleLink"
              onClick={handleToggleMode}
            >
              {authMode === "login"
                ? "Chưa có tài khoản? Nhấn vào đây để đăng ký!"
                : "Đã có tài khoản? Quay lại màn hình đăng nhập."}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

