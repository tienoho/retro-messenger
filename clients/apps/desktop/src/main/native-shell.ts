import {
  BrowserWindow,
  Menu,
  nativeImage,
  Notification,
  systemPreferences,
  Tray,
} from "electron";
import type { MessageDto } from "@retro/contracts";

const traySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="#6d28d9"/><text x="16" y="22" text-anchor="middle" font-family="Segoe UI" font-size="18" font-weight="700" fill="white">R!</text></svg>`;

export class DesktopNativeShell {
  private tray: Tray | null = null;
  private unreadCount = 0;
  private quitting = false;
  private activeConversationId: string | null = null;

  public constructor(
    private readonly window: BrowserWindow,
    private readonly onQuit: () => void,
  ) {}

  public initialize(): void {
    const icon = nativeImage
      .createFromDataURL(
        `data:image/svg+xml;base64,${Buffer.from(traySvg).toString("base64")}`,
      )
      .resize({ width: 16, height: 16 });
    this.tray = new Tray(icon);
    this.tray.setToolTip("Retro Messenger");
    this.tray.on("click", () => this.showWindow());
    this.window.on("close", (event) => {
      if (!this.quitting) {
        event.preventDefault();
        this.window.hide();
      }
    });
    this.refreshMenu();
  }

  public setUnreadCount(count: number): void {
    this.unreadCount = Math.max(0, count);
    this.tray?.setToolTip(
      this.unreadCount > 0
        ? `Retro Messenger — ${this.unreadCount} tin chưa đọc`
        : "Retro Messenger",
    );
    this.window.setOverlayIcon(
      this.unreadCount > 0 ? this.createBadge() : null,
      this.unreadCount > 0 ? `${this.unreadCount} tin chưa đọc` : "",
    );
    this.refreshMenu();
  }

  public notifyMessage(message: MessageDto, title = "Tin nhắn mới"): void {
    if (
      (this.window.isFocused() &&
        this.activeConversationId === message.conversationId) ||
      !Notification.isSupported()
    )
      return;
    const notification = new Notification({
      title,
      body: message.content.slice(0, 240),
    });
    notification.on("click", () => {
      this.showWindow();
      this.window.webContents.send(
        "desktop:navigate:conversation",
        message.conversationId,
      );
    });
    notification.show();
  }

  public setActiveConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
  }

  public buzz(): void {
    if (this.window.isDestroyed()) return;
    this.window.flashFrame(true);
    if (systemPreferences.getAnimationSettings().prefersReducedMotion) return;
    const position = this.window.getPosition();
    const x = position[0] ?? 0;
    const y = position[1] ?? 0;
    for (const [index, offset] of [8, -8, 6, -6, 0].entries()) {
      setTimeout(() => {
        if (!this.window.isDestroyed()) this.window.setPosition(x + offset, y);
      }, index * 45);
    }
  }

  public destroy(): void {
    this.quitting = true;
    this.tray?.destroy();
    this.tray = null;
  }

  private showWindow(): void {
    if (this.window.isMinimized()) this.window.restore();
    this.window.show();
    this.window.focus();
  }

  private refreshMenu(): void {
    this.tray?.setContextMenu(
      Menu.buildFromTemplate([
        { label: "Mở Retro Messenger", click: () => this.showWindow() },
        {
          label:
            this.unreadCount > 0
              ? `${this.unreadCount} tin chưa đọc`
              : "Không có tin mới",
          enabled: false,
        },
        { type: "separator" },
        {
          label: "Thoát",
          click: () => {
            this.quitting = true;
            this.onQuit();
          },
        },
      ]),
    );
  }

  private createBadge() {
    const label = this.unreadCount > 99 ? "99+" : String(this.unreadCount);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="15" fill="#dc2626"/><text x="16" y="21" text-anchor="middle" font-family="Segoe UI" font-size="14" font-weight="700" fill="white">${label}</text></svg>`;
    return nativeImage.createFromDataURL(
      `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
    );
  }
}
