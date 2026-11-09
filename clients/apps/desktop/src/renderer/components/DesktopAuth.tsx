import type { FormEvent } from "react";
import type { DesktopUpdaterState } from "@retro/contracts";
import { DesktopUpdater } from "./DesktopUpdater";

export interface DesktopAuthProps {
  username: string;
  password: string;
  busy: boolean;
  error: string | null;
  updater: DesktopUpdaterState;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelectDemo: (username: string, pass: string) => void;
}

export function DesktopAuth({
  username,
  password,
  busy,
  error,
  updater,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  onSelectDemo,
}: DesktopAuthProps) {
  return (
    <main className="authScreen">
      <div className="authStack">
        <section className="authPanel">
          <div className="brandMark">R!</div>
          <p className="eyebrow">RETRO MESSENGER</p>
          <h1>
            Trò chuyện như ngày xưa.
            <br />
            An toàn như hôm nay.
          </h1>
          <p className="authCopy">
            Phiên đăng nhập được mã hóa bởi hệ điều hành và không bao giờ đi
            vào trang hiển thị.
          </p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button
              type="button"
              className="secondaryButton"
              style={{ fontSize: "11px", padding: "4px 8px" }}
              onClick={() => onSelectDemo("honganh", "RetroPass123!")}
            >
              Demo: honganh
            </button>
            <button
              type="button"
              className="secondaryButton"
              style={{ fontSize: "11px", padding: "4px 8px" }}
              onClick={() => onSelectDemo("hoangnam", "RetroPass123!")}
            >
              Demo: hoangnam
            </button>
          </div>
          <form onSubmit={onSubmit}>
            <label>
              Tên đăng nhập
              <input
                autoComplete="username"
                maxLength={64}
                value={username}
                onChange={(event) => onUsernameChange(event.target.value)}
                required
              />
            </label>
            <label>
              Mật khẩu
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primaryButton" disabled={busy} type="submit">
              {busy ? "Đang đăng nhập…" : "Đăng nhập Yahoo!"}
            </button>
          </form>
        </section>
        <DesktopUpdater state={updater} />
      </div>
    </main>
  );
}

