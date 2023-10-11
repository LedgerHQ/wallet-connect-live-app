import { getChains } from "@/hooks/useProposal";
import { Proposal } from "@/shared/types/types";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import sessionProposalNotSupported from "@/data/mocks/sessionProposalNotSupported.example.json";

describe("getChains", () => {
  it("should return an array with required and optional namespaces", () => {
    const proposal = JSON.parse(JSON.stringify(sessionProposal)) as Proposal;

    const result = getChains(proposal);

    expect(result).toEqual([
      {
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",
        ],
        chains: ["eip155:1"],
        events: ["chainChanged", "accountsChanged"],
        required: true,
      },
      {
        methods: ["someMethod"],
        chains: ["optionalChain:1"],
        events: ["optionalEvent"],
      },
    ]);
  });

  it("should return an array with multiple chains", () => {
    const proposal = JSON.parse(JSON.stringify(sessionProposalNotSupported)) as Proposal;

    const result = getChains(proposal);

    expect(result).toEqual([
      {
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData",
        ],
        chains: ["eip155:1", "eip155:230"],
        events: ["chainChanged", "accountsChanged"],
        required: true,
      },
    ]);
  });
});
