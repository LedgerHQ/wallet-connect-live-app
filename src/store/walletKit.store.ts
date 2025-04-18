import { atom } from "jotai";
import { Core } from "@walletconnect/core";
import type { Verify } from "@walletconnect/types";
import { WalletKit } from "@reown/walletkit";
import { Account } from "@ledgerhq/wallet-api-client";

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

function atomWithLocalStorage<T>(key: string) {
  const initial = (() => {
    const item = localStorage.getItem(key);
    if (item !== null) {
      try {
        return JSON.parse(item) as T;
      } catch {
        console.warn(`Failed to parse localStorage for key "${key}"`);
      }
    }
    return null as T;
  })();

  const baseAtom = atom<T>(initial);

  const derivedAtom = atom<T, [T], void>(
    (get) => get(baseAtom),
    (_get, set, newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
      set(baseAtom, newValue);
    },
  );

  return derivedAtom;
}

export const mainAccountAtom = atomWithLocalStorage<Account>("mainAccount");
