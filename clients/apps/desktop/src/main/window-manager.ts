import { BrowserWindow } from "electron";

export class DesktopWindowRegistry {
  private readonly chatWindows = new Map<string, BrowserWindow>();

  public get(conversationId: string): BrowserWindow | undefined {
    const window = this.chatWindows.get(conversationId);
    return window && !window.isDestroyed() ? window : undefined;
  }

  public register(conversationId: string, window: BrowserWindow): void {
    this.chatWindows.set(conversationId, window);
    window.once("closed", () => {
      this.chatWindows.delete(conversationId);
    });
  }
}
