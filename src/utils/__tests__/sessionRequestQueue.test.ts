import type { IWalletKit } from "@reown/walletkit";
import { describe, expect, it, vi } from "vitest";
import { resumeSessionRequestQueue } from "../sessionRequestQueue";

function createWalletKit(engine: unknown) {
  return { engine: { signClient: { engine } } } as unknown as IWalletKit;
}

describe("resumeSessionRequestQueue", () => {
  it("emits the next queued session request", () => {
    const processSessionRequestQueue = vi.fn();

    resumeSessionRequestQueue(createWalletKit({ processSessionRequestQueue }));

    expect(processSessionRequestQueue).toHaveBeenCalledTimes(1);
  });

  it("keeps the engine as `this` of the queue processing", () => {
    const engine = {
      queue: ["request"],
      emitted: [] as string[],
      processSessionRequestQueue() {
        this.emitted.push(...this.queue);
      },
    };

    resumeSessionRequestQueue(createWalletKit(engine));

    expect(engine.emitted).toEqual(["request"]);
  });

  it("does nothing when WalletKit no longer exposes the queue processing", () => {
    expect(() => resumeSessionRequestQueue(createWalletKit({}))).not.toThrow();
  });
});
