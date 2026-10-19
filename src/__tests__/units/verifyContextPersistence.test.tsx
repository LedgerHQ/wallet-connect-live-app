import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { ReactNode } from "react";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes } from "@walletconnect/types";
import useVerification from "@/hooks/useVerification";
import { verifyContextByTopicAtom } from "@/store/walletKit.store";

const proposal = sessionProposal as ProposalTypes.Struct;

const scamContext = {
  verified: {
    verifyUrl: "https://verify.walletconnect.org",
    validation: "UNKNOWN",
    origin: "https://scam.example",
    isScam: true,
  },
};

describe("verify context persistence", () => {
  it("keeps a SCAM verdict for a pending proposal after a reload", () => {
    createStore().set(verifyContextByTopicAtom, {
      [proposal.pairingTopic]: scamContext,
    } as never);

    // A fresh store stands in for the app after a reload
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useVerification(proposal), {
      wrapper,
    });

    expect(result.current).toBe("SCAM");
  });
});
