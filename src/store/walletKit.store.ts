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

export type VerifyContextByProposalId = Record<string, Verify.Context>;

// Persisted because pending proposals survive a reload (WalletKit stores them)
// but their verify context can't be resolved again, which would downgrade a
// SCAM proposal to UNKNOWN. Keyed by proposal id rather than pairing topic, as
// a pairing can carry several proposals.
export const verifyContextByProposalIdAtom =
  atomWithStorage<VerifyContextByProposalId>(
    "verifyContextByProposalId",
    {},
    undefined,
    { getOnInit: true },
  );

// Stores a proposal's verify context and drops the entries of proposals
// WalletKit no longer holds (approved, rejected or expired). Relying on
// WalletKit rather than on the proposal's expiryTimestamp, which comes from the
// dApp's clock, keeps an entry for exactly as long as its proposal is shown.
export const addVerifyContextAtom = atom(
  null,
  (
    _get,
    set,
    {
      id,
      context,
      pendingIds,
    }: { id: number; context: Verify.Context; pendingIds: number[] },
  ) => {
    set(verifyContextByProposalIdAtom, (stored) => ({
      ...Object.fromEntries(
        Object.entries(stored).filter(([key]) =>
          pendingIds.includes(Number(key)),
        ),
      ),
      [id]: context,
    }));
  },
);

export const oneClickAuthPayloadAtom = atom<OneClickAuthPayload>();
