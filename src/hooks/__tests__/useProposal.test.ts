import { describe, expect, it, vi } from 'vitest'
import {
  formatAccountsByChain,
  getChains,
  sortChains,
  sortAlphabetic,
} from "@/hooks/useProposal/util";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import sessionProposalNotSupported from "@/data/mocks/sessionProposalNotSupported.example.json";

import { ACCOUNT_MOCK } from "@/tests-tools/mocks/account.mock";
import { Proposal } from '@/storage/sessions.store';

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
        required: false,
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

describe("formatAccountsByChain", () => {
  const dataFromJSON = JSON.parse(JSON.stringify(sessionProposal)) as Proposal;
  const proposalFormated: Proposal = {
    ...dataFromJSON,
    params: {
      ...dataFromJSON.params,
      requiredNamespaces: {
        eip155: {
          methods: [
            "eth_sendTransaction",
            "eth_signTransaction",
            "eth_sign",
            "personal_sign",
            "eth_signTypedData",
          ],
          chains: ["eip155:1", "eip155:137", "eip155:23"],
          events: ["chainChanged", "accountsChanged"],
        },
      },
      optionalNamespaces: {},
    },
  };

  const accountsFormatted = [
    {
      ...ACCOUNT_MOCK,
      accountName: "Account 1",
      currency: "ethereum",
    },
    {
      ...ACCOUNT_MOCK,
      accountName: "Account 2",
      currency: "polygon",
    },
  ];

  const getCurrencyByChainId = vi.fn();
  getCurrencyByChainId.mockImplementation((chainId) => `${chainId}`);

  vi.doMock("@/shared/helpers/helper.util", () => ({
    getCurrencyByChainId,
  }));

  it("should format accounts by chain as expected", () => {
    const result = formatAccountsByChain(proposalFormated, accountsFormatted);

    expect(result).toEqual([
      {
        chain: "ethereum",
        displayName: "Ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [
          {
            ...ACCOUNT_MOCK,
            accountName: "Account 1",
            currency: "ethereum",
          },
        ],
      },
      {
        chain: "polygon",
        displayName: "Polygon",
        isSupported: true,
        isRequired: true,
        accounts: [
          {
            ...ACCOUNT_MOCK,
            accountName: "Account 2",
            currency: "polygon",
          },
        ],
      },
      {
        chain: "eip155:23",
        displayName: "eip155:23",
        isSupported: false,
        isRequired: true,
        accounts: [],
      },
    ]);
  });
});

describe("sortChains", () => {
  const DATA = [
    {
      chain: "polygon",
      isSupported: true,
      isRequired: true,
      accounts: [ACCOUNT_MOCK],
      displayName: "Polygon",
    },
    {
      chain: "ethereum",
      isSupported: true,
      isRequired: true,
      accounts: [ACCOUNT_MOCK],
      displayName: "Ethereum",
    },
    {
      chain: "base",
      isSupported: true,
      isRequired: false,
      accounts: [],
      displayName: "Base",
    },
    {
      chain: "bsc",
      isSupported: true,
      isRequired: false,
      accounts: [ACCOUNT_MOCK],
      displayName: "Binance Smart Chain",
    },
  ];

  it("should sort correclty", () => {
    const result = sortChains(DATA);
    expect(result).toEqual([
      {
        chain: "ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [ACCOUNT_MOCK],
        displayName: "Ethereum",
      },
      {
        chain: "polygon",
        isSupported: true,
        isRequired: true,
        accounts: [ACCOUNT_MOCK],
        displayName: "Polygon",
      },

      {
        chain: "bsc",
        isSupported: true,
        isRequired: false,
        accounts: [ACCOUNT_MOCK],
        displayName: "Binance Smart Chain",
      },
      {
        chain: "base",
        isSupported: true,
        isRequired: false,
        accounts: [],
        displayName: "Base",
      },
    ]);
  });
  it("should sort Alpabetic correclty", () => {
    const result = sortAlphabetic(DATA);
    expect(result).toEqual([
      {
        chain: "base",
        isSupported: true,
        isRequired: false,
        accounts: [],
        displayName: "Base",
      },
      {
        chain: "bsc",
        isSupported: true,
        isRequired: false,
        accounts: [ACCOUNT_MOCK],
        displayName: "Binance Smart Chain",
      },
      {
        chain: "ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [ACCOUNT_MOCK],
        displayName: "Ethereum",
      },
      {
        chain: "polygon",
        isSupported: true,
        isRequired: true,
        accounts: [ACCOUNT_MOCK],
        displayName: "Polygon",
      },
    ]);
  });
});
