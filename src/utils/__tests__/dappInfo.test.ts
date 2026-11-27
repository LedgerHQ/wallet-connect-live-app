import type { IWalletKit } from "@reown/walletkit";
import { describe, expect, it, vi } from "vitest";
import { getDappInfo } from "../dappInfo";

const sessionGet = vi.fn<(topic: string) => unknown>();

function createWalletKit(get: () => unknown) {
  sessionGet.mockImplementation(get);
  return {
    engine: { signClient: { session: { get: sessionGet } } },
  } as unknown as IWalletKit;
}

describe("getDappInfo", () => {
  it("returns the name and url of the session peer", () => {
    const walletKit = createWalletKit(() => ({
      peer: {
        metadata: { name: "Uniswap", url: "https://app.uniswap.org" },
      },
    }));

    expect(getDappInfo(walletKit, "topic-1")).toEqual({
      name: "Uniswap",
      url: "https://app.uniswap.org",
    });
    expect(sessionGet).toHaveBeenCalledWith("topic-1");
  });

  it("returns nothing when the session is unknown", () => {
    expect(
      getDappInfo(
        createWalletKit(() => undefined),
        "topic-1",
      ),
    ).toEqual({});
  });

  it.each([
    { name: "no peer", session: {} },
    { name: "no peer metadata", session: { peer: {} } },
  ])("returns nothing when the session has $name", ({ session }) => {
    expect(
      getDappInfo(
        createWalletKit(() => session),
        "topic-1",
      ),
    ).toEqual({});
  });

  it("returns nothing when reading the session fails", () => {
    const walletKit = createWalletKit(() => {
      throw new Error("No matching key");
    });

    expect(getDappInfo(walletKit, "topic-1")).toEqual({});
  });
});
