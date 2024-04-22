import { SUPPORTED_NETWORK } from "@/data/network.config";
import { Network } from "@/data/types";

describe("SUPPORTED_NETWORK", () => {
  it("contains Ethereum", () => {
    const ethereum: Network | undefined = SUPPORTED_NETWORK.ethereum;

    expect(ethereum?.displayName).toBe("Ethereum");
  });

  it("contains Binance Smart Chain", () => {
    const bsc: Network | undefined = SUPPORTED_NETWORK.bsc;

    expect(bsc?.displayName).toBe("Binance Smart Chain");
  });

  it("contains Polygon", () => {
    const polygon: Network | undefined = SUPPORTED_NETWORK.polygon;

    expect(polygon?.displayName).toBe("Polygon");
  });

  it("contains Optimism", () => {
    const optimism: Network | undefined = SUPPORTED_NETWORK.optimism;

    expect(optimism?.displayName).toBe("Optimism");
  });

  it("contains Arbitrum", () => {
    const arbitrum: Network | undefined = SUPPORTED_NETWORK.arbitrum;

    expect(arbitrum?.displayName).toBe("Arbitrum");
  });

  it("contains Avalanche C-Chain", () => {
    const avalancheCChain: Network | undefined =
      SUPPORTED_NETWORK.avalanche_c_chain;

    expect(avalancheCChain?.displayName).toBe("Avalanche C-Chain");
  });

  it("contains Base", () => {
    const base: Network | undefined = SUPPORTED_NETWORK.base;

    expect(base?.displayName).toBe("Base");
  });
});

describe("EIP155_SEPOLIA_CHAINS", () => {
  it("contains Ethereum Sepolia", () => {
    const ethereumSepolia: Network | undefined =
      SUPPORTED_NETWORK.ethereum_sepolia;

    expect(ethereumSepolia?.displayName).toBe("Ethereum Sepolia");
  });

  it("contains Optimism Sepolia", () => {
    const optimismSepolia: Network | undefined =
      SUPPORTED_NETWORK.optimism_sepolia;

    expect(optimismSepolia?.displayName).toBe("Optimism Sepolia");
  });

  it("contains Base Sepolia", () => {
    const baseSepolia: Network | undefined = SUPPORTED_NETWORK.base_sepolia;

    expect(baseSepolia?.displayName).toBe("Base Sepolia");
  });
});
