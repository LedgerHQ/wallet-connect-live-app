import { beforeEach, describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes, Verify } from "@walletconnect/types";
import useVerification from "@/hooks/useVerification";
import {
  VerifyRequestType,
  addVerifyContextAtom,
  getVerifyContextKey,
  verifyContextByRequestAtom,
} from "@/store/walletKit.store";

// The mock's expiryTimestamp is long past, standing in for a dApp whose clock
// is behind ours: the verdict must still hold while the proposal is pending.
const proposal = sessionProposal as ProposalTypes.Struct;
const proposalKey = getVerifyContextKey("proposal", proposal.id);

const scamContext: Verify.Context = {
  verified: {
    verifyUrl: "https://verify.walletconnect.org",
    validation: "UNKNOWN",
    origin: "https://scam.example",
    isScam: true,
  },
};

const validContext: Verify.Context = {
  verified: {
    verifyUrl: "https://verify.walletconnect.org",
    validation: "VALID",
    origin: "https://legit.example",
  },
};

const renderVerification = (
  store: ReturnType<typeof createStore>,
  target: ProposalTypes.Struct,
  type?: VerifyRequestType,
) =>
  renderHook(() => useVerification(target, type), {
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
      key: proposalKey,
      context: scamContext,
      pendingKeys: [proposalKey],
    });

    // A fresh store stands in for the app after a reload
    expect(renderVerification(createStore(), proposal)).toBe("SCAM");
  });

  it("does not reuse the verdict of another proposal on the same pairing", () => {
    const store = createStore();
    store.set(addVerifyContextAtom, {
      key: proposalKey,
      context: scamContext,
      pendingKeys: [proposalKey],
    });

    const otherProposal = { ...proposal, id: proposal.id + 1 };
    expect(renderVerification(store, otherProposal)).toBe("UNKNOWN");
  });

  it("does not let an auth request with the same id overwrite a proposal's verdict", () => {
    const store = createStore();
    const authKey = getVerifyContextKey("auth", proposal.id);
    store.set(addVerifyContextAtom, {
      key: proposalKey,
      context: scamContext,
      pendingKeys: [proposalKey],
    });
    store.set(addVerifyContextAtom, {
      key: authKey,
      context: validContext,
      pendingKeys: [proposalKey, authKey],
    });

    expect(renderVerification(store, proposal)).toBe("SCAM");
    expect(renderVerification(store, proposal, "auth")).toBe("VALID");
  });

  it("only drops the entries of requests WalletKit no longer holds", () => {
    const store = createStore();
    const [first, second, third] = [1, 2, 3].map((id) =>
      getVerifyContextKey("proposal", id),
    );
    store.set(addVerifyContextAtom, {
      key: first,
      context: scamContext,
      pendingKeys: [first],
    });
    store.set(addVerifyContextAtom, {
      key: second,
      context: scamContext,
      pendingKeys: [first, second],
    });
    store.set(addVerifyContextAtom, {
      key: third,
      context: scamContext,
      pendingKeys: [second, third],
    });

    expect(Object.keys(store.get(verifyContextByRequestAtom))).toEqual([
      second,
      third,
    ]);
  });
});
