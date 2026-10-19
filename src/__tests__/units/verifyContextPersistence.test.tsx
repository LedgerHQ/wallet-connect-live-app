import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes, Verify } from "@walletconnect/types";
import useVerification from "@/hooks/useVerification";
import {
  addVerifyContextAtom,
  verifyContextByProposalIdAtom,
} from "@/store/walletKit.store";

// The mock's expiryTimestamp is long past, standing in for a dApp whose clock
// is behind ours: the verdict must still hold while the proposal is pending.
const proposal = sessionProposal as ProposalTypes.Struct;

const scamContext: Verify.Context = {
  verified: {
    verifyUrl: "https://verify.walletconnect.org",
    validation: "UNKNOWN",
    origin: "https://scam.example",
    isScam: true,
  },
};

const renderVerification = (
  store: ReturnType<typeof createStore>,
  target: ProposalTypes.Struct,
) =>
  renderHook(() => useVerification(target), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  }).result.current;

describe("verify context persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("keeps a SCAM verdict for a pending proposal after a reload", () => {
    createStore().set(addVerifyContextAtom, {
      id: proposal.id,
      context: scamContext,
      pendingIds: [proposal.id],
    });

    // A fresh store stands in for the app after a reload
    expect(renderVerification(createStore(), proposal)).toBe("SCAM");
  });

  it("does not reuse the verdict of another proposal on the same pairing", () => {
    const store = createStore();
    store.set(addVerifyContextAtom, {
      id: proposal.id,
      context: scamContext,
      pendingIds: [proposal.id],
    });

    const otherProposal = { ...proposal, id: proposal.id + 1 };
    expect(renderVerification(store, otherProposal)).toBe("UNKNOWN");
  });

  it("only drops the entries of proposals WalletKit no longer holds", () => {
    const store = createStore();
    store.set(addVerifyContextAtom, {
      id: 1,
      context: scamContext,
      pendingIds: [1],
    });
    store.set(addVerifyContextAtom, {
      id: 2,
      context: scamContext,
      pendingIds: [1, 2],
    });
    store.set(addVerifyContextAtom, {
      id: 3,
      context: scamContext,
      pendingIds: [2, 3],
    });

    expect(Object.keys(store.get(verifyContextByProposalIdAtom))).toEqual([
      "2",
      "3",
    ]);
  });
});
