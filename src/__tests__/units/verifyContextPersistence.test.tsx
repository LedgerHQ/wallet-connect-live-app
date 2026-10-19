import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const proposal = sessionProposal as ProposalTypes.Struct;

const scamContext: Verify.Context = {
  verified: {
    verifyUrl: "https://verify.walletconnect.org",
    validation: "UNKNOWN",
    origin: "https://scam.example",
    isScam: true,
  },
};

const NOW = 1_800_000_000;

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
    vi.useFakeTimers({ now: NOW * 1000 });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps a SCAM verdict for a pending proposal after a reload", () => {
    createStore().set(addVerifyContextAtom, {
      id: proposal.id,
      context: scamContext,
      expiryTimestamp: NOW + 300,
    });

    // A fresh store stands in for the app after a reload
    expect(renderVerification(createStore(), proposal)).toBe("SCAM");
  });

  it("does not reuse the verdict of another proposal on the same pairing", () => {
    const store = createStore();
    store.set(addVerifyContextAtom, {
      id: proposal.id,
      context: scamContext,
      expiryTimestamp: NOW + 300,
    });

    const otherProposal = { ...proposal, id: proposal.id + 1 };
    expect(renderVerification(store, otherProposal)).toBe("UNKNOWN");
  });

  it("drops expired entries when a new one is stored", () => {
    const store = createStore();
    store.set(addVerifyContextAtom, {
      id: 1,
      context: scamContext,
      expiryTimestamp: NOW - 1,
    });
    store.set(addVerifyContextAtom, { id: 2, context: scamContext });

    expect(Object.keys(store.get(verifyContextByProposalIdAtom))).toEqual([
      "2",
    ]);
    expect(store.get(verifyContextByProposalIdAtom)[2].expiresAt).toBe(
      NOW + 300,
    );
  });
});
