import type { IWalletKit } from "@reown/walletkit";

type ResumableEngine = { processSessionRequestQueue: () => void };

function isResumableEngine(engine: unknown): engine is ResumableEngine {
  return (
    typeof engine === "object" &&
    engine !== null &&
    typeof Reflect.get(engine, "processSessionRequestQueue") === "function"
  );
}

/**
 * WalletKit emits one `session_request` at a time, across all sessions, and emits the next one
 * only once the wallet replied to the current one. Deleting the session of the current request
 * sets the queue back to idle without emitting the next one, so the request of another dApp
 * waits until a new event comes in. This emits it now.
 *
 * `processSessionRequestQueue` is not part of the public API: when a WalletKit upgrade removes
 * it, this does nothing and the next request waits for a new event, as before.
 */
export function resumeSessionRequestQueue(walletKit: IWalletKit): void {
  const engine: unknown = walletKit.engine.signClient.engine;
  if (isResumableEngine(engine)) engine.processSessionRequestQueue();
}
