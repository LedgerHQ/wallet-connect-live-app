import { SUPPORTED_NETWORK } from "@/data/network.config";
import { Network } from "@/data/types";
import { getCurrencyByChainId, getNamespace } from "@/utils/helper.util";

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

  it("contains Rootstock", () => {
    const rootstock: Network | undefined = SUPPORTED_NETWORK.rsk;

    expect(rootstock?.displayName).toBe("Rootstock");
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

  it("contains Core", () => {
    const core: Network | undefined = SUPPORTED_NETWORK.core;

    expect(core?.displayName).toBe("Core");
  });

  it("contains Monad", () => {
    const monad: Network | undefined = SUPPORTED_NETWORK.monad;

    expect(monad?.displayName).toBe("Monad");
  });

  it("contains ADI Chain", () => {
    const adi: Network | undefined = SUPPORTED_NETWORK.adi;

    expect(adi?.displayName).toBe("ADI Chain");
  });

  it("contains Sei EVM", () => {
    const seiEvm: Network | undefined = SUPPORTED_NETWORK.sei_evm;

    expect(seiEvm?.displayName).toBe("Sei EVM");
    expect(seiEvm?.chainId).toBe(1329);
    expect(seiEvm?.namespace).toBe("eip155:1329");
    expect(seiEvm?.ticker).toBe("SEI");
  });

  it("contains Somnia", () => {
    const somnia: Network | undefined = SUPPORTED_NETWORK.somnia;

    expect(somnia?.displayName).toBe("Somnia");
    expect(somnia?.chainId).toBe(5031);
    expect(somnia?.namespace).toBe("eip155:5031");
    expect(somnia?.ticker).toBe("SOMI");
  });

  it("contains Etherlink", () => {
    const etherlink: Network | undefined = SUPPORTED_NETWORK.etherlink;

    expect(etherlink?.displayName).toBe("Etherlink");
    expect(etherlink?.chainId).toBe(42793);
    expect(etherlink?.namespace).toBe("eip155:42793");
    expect(etherlink?.ticker).toBe("XTZ");
  });

  it("contains 0G", () => {
    const zeroGravity: Network | undefined = SUPPORTED_NETWORK.zero_gravity;

    expect(zeroGravity?.displayName).toBe("0G");
    expect(zeroGravity?.chainId).toBe(16661);
    expect(zeroGravity?.namespace).toBe("eip155:16661");
    expect(zeroGravity?.ticker).toBe("0G");
  });

  it("contains Tezos", () => {
    const tezos: Network | undefined = SUPPORTED_NETWORK.tezos;

    expect(tezos?.displayName).toBe("Tezos");
    expect(tezos?.chainId).toBe("NetXdQprcVkpaWU");
    expect(tezos?.namespace).toBe("tezos:NetXdQprcVkpaWU");
    expect(tezos?.ticker).toBe("XTZ");
  });

  it("contains Babylon", () => {
    const babylon: Network | undefined = SUPPORTED_NETWORK.babylon;

    expect(babylon?.displayName).toBe("Babylon");
    expect(babylon?.chainId).toBe("bbn-1");
    expect(babylon?.namespace).toBe("cosmos:bbn-1");
    expect(babylon?.ticker).toBe("BABY");
  });

  it("resolves Babylon from its CAIP-2 chain id", () => {
    // Acceptance criterion (LIVE-33214): Babylon resolves as a supported cosmos
    // chain under CAIP-2 cosmos:bbn-1. Assert both directions of the resolvers so
    // the entry stays discoverable, not merely present.
    expect(getCurrencyByChainId("cosmos:bbn-1")).toBe("babylon");
    expect(getNamespace("babylon")).toBe("cosmos:bbn-1");
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

describe("EIP155_CHAINS_TESTNET", () => {
  it("contains Monad Testnet", () => {
    const monadTestnet: Network | undefined = SUPPORTED_NETWORK.monad_testnet;

    expect(monadTestnet?.displayName).toBe("Monad Testnet");
  });
});
