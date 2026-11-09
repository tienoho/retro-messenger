import { useState, type FormEvent } from "react";
import { IconPencil } from "../../icons/UiIcons";

export interface ChangePasswordDialogProps {
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
  onClose: () => void;
}

export function ChangePasswordDialog({
  onSave,
  onClose,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setBusy(true);
    try {
      await onSave(currentPassword, newPassword);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Đổi mật khẩu thất bại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="retroModalBackdrop" onClick={onClose}>
      <div
        className="retroModalDialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="changePasswordTitle"
        style={{ maxWidth: "420px" }}
      >
        <div className="retroModalHeader">
          <div className="retroModalTitle">
            <IconPencil size={14} style={{ marginRight: 6 }} />
            <span id="changePasswordTitle">Đổi mật khẩu tài khoản Yahoo!</span>
          </div>
          <button
            type="button"
            className="winControlBtn closeBtn"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="retroModalBody" style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "#4b5563" }}>
            Để bảo mật tài khoản, vui lòng nhập mật khẩu hiện tại và mật khẩu mới.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
              Mật khẩu hiện tại:
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              required
              style={{
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
              Mật khẩu mới:
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              required
              minLength={6}
              style={{
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>
              Xác nhận mật khẩu mới:
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              minLength={6}
              style={{
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "13px",
              }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: "#dc2626", fontSize: "12px", fontWeight: 600 }} role="alert">
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                background: "#f3f4f6",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                background: "linear-gradient(135deg, #7c3aed 0%, #581c87 100%)",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 700,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {busy ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

