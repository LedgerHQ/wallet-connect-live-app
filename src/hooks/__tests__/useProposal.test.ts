import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import sessionProposalNotSupported from "@/data/mocks/sessionProposalNotSupported.example.json";
import {
  formatAccountsByChain,
  getChains,
  sortAlphabetic,
  sortChains,
} from "@/hooks/useProposal/util";
import { describe, expect, it, vi } from "vitest";

import { ACCOUNT_MOCK } from "@/tests/mocks/account.mock";
import { WalletInfo } from "@ledgerhq/wallet-api-client";
import { ProposalTypes } from "@walletconnect/types";

type Proposal = ProposalTypes.Struct;

describe("getChains", () => {
  it("should return an array with required and optional namespaces", () => {
    // TODO: check here (types and mock)
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
    const proposal = JSON.parse(
      JSON.stringify(sessionProposalNotSupported),
    ) as Proposal;

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

  const mockWalletInfo: WalletInfo["result"] = {
    wallet: {
      name: "ledger-live-desktop",
      version: "2.127.0",
    },
    tracking: false,
  };

  it("should format accounts by chain as expected", () => {
    const result = formatAccountsByChain(
      proposalFormated,
      accountsFormatted,
      mockWalletInfo,
    );

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

  it("should filter out Solana chains when wallet version doesn't support them", () => {
    const proposalWithSolana: Proposal = {
      ...dataFromJSON,
      requiredNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction"],
          chains: ["eip155:1"],
          events: ["chainChanged"],
        },
        solana: {
          methods: ["solana_signTransaction"],
          chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
          events: [],
        },
      },
      optionalNamespaces: {},
    };

    const accountsWithSolana = [
      {
        ...ACCOUNT_MOCK,
        accountName: "ETH Account",
        currency: "ethereum",
      },
      {
        ...ACCOUNT_MOCK,
        accountName: "SOL Account",
        currency: "solana",
      },
    ];

    // Test with unsupported version (below minimum)
    const unsupportedWalletInfo: WalletInfo["result"] = {
      wallet: {
        name: "ledger-live-desktop",
        version: "2.125.0", // Below minimum 2.126.0
      },
      tracking: false,
    };

    const resultUnsupported = formatAccountsByChain(
      proposalWithSolana,
      accountsWithSolana,
      unsupportedWalletInfo,
    );

    // Should only contain Ethereum, Solana should be filtered out
    expect(resultUnsupported).toEqual([
      {
        chain: "ethereum",
        displayName: "Ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [
          {
            ...ACCOUNT_MOCK,
            accountName: "ETH Account",
            currency: "ethereum",
          },
        ],
      },
    ]);

    // Test with supported version (meets minimum)
    const supportedWalletInfo: WalletInfo["result"] = {
      wallet: {
        name: "ledger-live-desktop",
        version: "2.127.0", // Above minimum 2.126.0
      },
      tracking: false,
    };

    const resultSupported = formatAccountsByChain(
      proposalWithSolana,
      accountsWithSolana,
      supportedWalletInfo,
    );

    // Should contain both Ethereum and Solana
    expect(resultSupported).toEqual([
      {
        chain: "ethereum",
        displayName: "Ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [
          {
            ...ACCOUNT_MOCK,
            accountName: "ETH Account",
            currency: "ethereum",
          },
        ],
      },
      {
        chain: "solana",
        displayName: "Solana",
        isSupported: true,
        isRequired: true,
        accounts: [
          {
            ...ACCOUNT_MOCK,
            accountName: "SOL Account",
            currency: "solana",
          },
        ],
      },
    ]);
  });

  it("should filter out Solana chains for mobile versions below minimum", () => {
    const proposalWithSolana: Proposal = {
      ...dataFromJSON,
      requiredNamespaces: {
        solana: {
          methods: ["solana_signTransaction"],
          chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
          events: [],
        },
      },
      optionalNamespaces: {},
    };

    const accountsWithSolana = [
      {
        ...ACCOUNT_MOCK,
        accountName: "SOL Account",
        currency: "solana",
      },
    ];

    // Test with unsupported mobile version
    const unsupportedMobileWallet: WalletInfo["result"] = {
      wallet: {
        name: "ledger-live-mobile",
        version: "3.89.0", // Below minimum 3.90.0
      },
      tracking: false,
    };

    const resultUnsupported = formatAccountsByChain(
      proposalWithSolana,
      accountsWithSolana,
      unsupportedMobileWallet,
    );

    // Should be empty as Solana is filtered out
    expect(resultUnsupported).toEqual([]);

    // Test with supported mobile version
    const supportedMobileWallet: WalletInfo["result"] = {
      wallet: {
        name: "ledger-live-mobile",
        version: "3.91.0", // Above minimum 3.90.0
      },
      tracking: false,
    };

    const resultSupported = formatAccountsByChain(
      proposalWithSolana,
      accountsWithSolana,
      supportedMobileWallet,
    );

    // Should contain Solana
    expect(resultSupported).toEqual([
      {
        chain: "solana",
        displayName: "Solana",
        isSupported: true,
        isRequired: true,
        accounts: [
          {
            ...ACCOUNT_MOCK,
            accountName: "SOL Account",
            currency: "solana",
          },
        ],
      },
    ]);
  });

  it("should filter out Solana chains for unknown wallet types", () => {
    const proposalWithSolana: Proposal = {
      ...dataFromJSON,
      requiredNamespaces: {
        solana: {
          methods: ["solana_signTransaction"],
          chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
          events: [],
        },
      },
      optionalNamespaces: {},
    };

    const accountsWithSolana = [
      {
        ...ACCOUNT_MOCK,
        accountName: "SOL Account",
        currency: "solana",
      },
    ];

    // Test with unknown wallet type
    const unknownWallet: WalletInfo["result"] = {
      wallet: {
        name: "unknown-wallet",
        version: "1.0.0",
      },
      tracking: false,
    };

    const result = formatAccountsByChain(
      proposalWithSolana,
      accountsWithSolana,
      unknownWallet,
    );

    // Should be empty as Solana is filtered out for unknown wallets
    expect(result).toEqual([]);
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
