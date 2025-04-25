import { atom } from "jotai";
import { Core } from "@walletconnect/core";
import type { Verify } from "@walletconnect/types";
import { WalletKit } from "@reown/walletkit";

const relayerURL = "wss://relay.walletconnect.com";

export const coreAtom = atom(() => {
  return new Core({
    logger: "debug",
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    relayUrl: relayerURL,
  });
});

export const connectionStatusAtom = atom("disconnected");

export const walletKitAtom = atom((get) => {
  const core = get(coreAtom);

  return WalletKit.init({
    core,
    metadata: {
      name: "Ledger Wallet",
      description: "Ledger Live Wallet with WalletConnect",
      url: "https://walletconnect.com/",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
});

export const loadingAtom = atom(false);

export const showBackToBrowserModalAtom = atom(false);

export type VerifyContextByTopic = Record<string, Verify.Context>;

export const verifyContextByTopicAtom = atom<VerifyContextByTopic>({});
