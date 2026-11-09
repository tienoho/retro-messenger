import type { DesktopUpdaterState } from "@retro/contracts";

export interface DesktopUpdaterProps {
  state: DesktopUpdaterState;
}

export function DesktopUpdater({ state }: DesktopUpdaterProps) {
  if (
    state.state === "disabled" ||
    state.state === "idle" ||
    state.state === "not-available"
  ) {
    return null;
  }

  return (
    <div className="updater">
      <span>
        {state.state === "available"
          ? `Có bản ${state.version}`
          : state.state === "downloading"
            ? `Đang tải ${Math.round(state.percent ?? 0)}%`
            : state.state === "downloaded"
              ? "Bản cập nhật đã sẵn sàng"
              : (state.message ?? "Đang kiểm tra cập nhật…")}
      </span>
      {state.state === "available" && (
        <button onClick={() => void window.retroDesktop.downloadUpdate()}>
          Tải
        </button>
      )}
      {state.state === "downloaded" && (
        <button onClick={() => void window.retroDesktop.installUpdate()}>
          Cài và khởi động lại
        </button>
      )}
    </div>
  );
}

