import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Core } from "@walletconnect/core";
import type { Verify } from "@walletconnect/types";
import { WalletKit } from "@reown/walletkit";
import { OneClickAuthPayload } from "@/types/types";

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

export type VerifyRequestType = "proposal" | "auth";

export type VerifyContextByRequest = Record<string, Verify.Context>;

// Proposals and one-click auth requests live in separate WalletKit stores and
// their ids are picked by the dApp, so the same id can exist in both. The type
// is part of the key so an auth verdict can't overwrite a proposal's.
export const getVerifyContextKey = (type: VerifyRequestType, id: number) =>
  `${type}:${id}`;

// Persisted because pending proposals survive a reload (WalletKit stores them)
// but their verify context can't be resolved again, which would downgrade a
// SCAM proposal to UNKNOWN. Keyed by request rather than pairing topic, as a
// pairing can carry several proposals.
export const verifyContextByRequestAtom =
  atomWithStorage<VerifyContextByRequest>(
    "verifyContextByRequest",
    {},
    undefined,
    { getOnInit: true },
  );

// Stores a request's verify context and drops the entries of requests
// WalletKit no longer holds (approved, rejected or expired). Relying on
// WalletKit rather than on the request's expiryTimestamp, which comes from the
// dApp's clock, keeps an entry for exactly as long as its request is shown.
export const addVerifyContextAtom = atom(
  null,
  (
    _get,
    set,
    {
      key,
      context,
      pendingKeys,
    }: { key: string; context: Verify.Context; pendingKeys: string[] },
  ) => {
    set(verifyContextByRequestAtom, (stored) => ({
      ...Object.fromEntries(
        Object.entries(stored).filter(([storedKey]) =>
          pendingKeys.includes(storedKey),
        ),
      ),
      [key]: context,
    }));
  },
);

export const oneClickAuthPayloadAtom = atom<OneClickAuthPayload>();
