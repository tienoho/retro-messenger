import { app } from "electron";
import { autoUpdater } from "electron-updater";
import type { DesktopUpdaterState } from "@retro/contracts";

export class DesktopUpdateManager {
  private state: DesktopUpdaterState = app.isPackaged
    ? { state: "idle" }
    : {
        state: "disabled",
        message: "Updater chỉ hoạt động trong bản đã đóng gói.",
      };

  public constructor(
    private readonly emit: (state: DesktopUpdaterState) => void,
  ) {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = app.getVersion().includes("-");
    autoUpdater.channel = autoUpdater.allowPrerelease ? "beta" : "latest";
    autoUpdater.on("checking-for-update", () =>
      this.setState({ state: "checking" }),
    );
    autoUpdater.on("update-available", (info) =>
      this.setState({ state: "available", version: info.version }),
    );
    autoUpdater.on("update-not-available", (info) =>
      this.setState({ state: "not-available", version: info.version }),
    );
    autoUpdater.on("download-progress", (progress) =>
      this.setState({
        state: "downloading",
        percent: Math.max(0, Math.min(100, progress.percent)),
      }),
    );
    autoUpdater.on("update-downloaded", (info) =>
      this.setState({ state: "downloaded", version: info.version }),
    );
    autoUpdater.on("error", (error) =>
      this.setState({ state: "error", message: error.message }),
    );
  }

  public getState(): DesktopUpdaterState {
    return this.state;
  }

  public async check(): Promise<void> {
    if (!app.isPackaged) return;
    await autoUpdater.checkForUpdates();
  }

  public async download(): Promise<void> {
    if (!app.isPackaged || this.state.state !== "available") return;
    await autoUpdater.downloadUpdate();
  }

  public install(): void {
    if (this.state.state === "downloaded")
      autoUpdater.quitAndInstall(false, true);
  }

  private setState(state: DesktopUpdaterState): void {
    this.state = state;
    this.emit(state);
  }
}
