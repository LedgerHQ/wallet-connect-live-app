import { SUPPORTED_NETWORK } from "@/data/network.config";
import { Network } from "@/data/types";

describe("SUPPORTED_NETWORK", () => {
  it("contains Ethereum", () => {
    const ethereum: Network | undefined = SUPPORTED_NETWORK["ethereum"];
    expect(ethereum).toBeDefined();
    expect(ethereum?.displayName).toBe("Ethereum");
  });

  it("contains Binance Smart Chain", () => {
    const bsc: Network | undefined = SUPPORTED_NETWORK["bsc"];
    expect(bsc).toBeDefined();
    expect(bsc?.displayName).toBe("Binance Smart Chain");
  });

  it("contains Polygon", () => {
    const polygon: Network | undefined = SUPPORTED_NETWORK["polygon"];
    expect(polygon).toBeDefined();
    expect(polygon?.displayName).toBe("Polygon");
  });

  it("contains Ethereum Goerli", () => {
    const goerli: Network | undefined = SUPPORTED_NETWORK["ethereum_goerli"];
    expect(goerli).toBeDefined();
    expect(goerli?.displayName).toBe("Ethereum Goerli");
  });
});
