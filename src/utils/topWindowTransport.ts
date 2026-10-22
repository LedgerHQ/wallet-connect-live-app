import type { MessageHandler, Transport } from "@ledgerhq/wallet-api-client";

/**
 * Wallet API transport for iframe hosts (e.g. Ledger Enterprise).
 * Unlike `WindowMessageTransport`, which accepts any message and posts to `"*"`,
 * it only talks to `window.top` on the verified `topOrigin`
 */
export class TopWindowTransport implements Transport {
  onMessage: MessageHandler | undefined;

  private readonly win: Window;
  private readonly topOrigin: string;

  constructor(win: Window, topOrigin: string) {
    this.win = win;
    this.topOrigin = topOrigin;
  }

  connect = () => {
    this.win.addEventListener("message", this.onMessageEvent);
  };

  disconnect = () => {
    this.win.removeEventListener("message", this.onMessageEvent);
  };

  private onMessageEvent = (event: MessageEvent) => {
    if (event.source !== this.win.top || event.origin !== this.topOrigin) {
      return;
    }
    if (event.data && typeof event.data === "string") {
      this.onMessage?.(event.data);
    }
  };

  send = (message: string) => {
    this.win.top?.postMessage(message, this.topOrigin);
  };
}
