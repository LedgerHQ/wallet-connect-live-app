import { networks, Psbt } from "bitcoinjs-lib";
import { describe, expect, it } from "vitest";
import { hasHashiDepositField, selectDeviceApp } from "../derivedApps";

const TESTNET_CHAIN_ID = "bip122:000000000933ea01ad0ee984209779ba";
const MAINNET_CHAIN_ID = "bip122:000000000019d6689c085ae165831e93";
const LITECOIN_CHAIN_ID = "bip122:12a765e31ffd4059bada1e25190f6e98";
const script = new Uint8Array([0x00, 0x14, ...new Uint8Array(20).fill(0xab)]);
const hashiKey = new Uint8Array([
  0xfc, 0x05, 0x68, 0x61, 0x73, 0x68, 0x69, 0x00,
]);

function psbtWithOutputKeys(keysPerOutput: Uint8Array[][]): Psbt {
  const psbt = new Psbt({ network: networks.testnet });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x01),
    index: 0,
    witnessUtxo: { script, value: 100_000n },
  });
  keysPerOutput.forEach((keys, i) => {
    psbt.addOutput({ script, value: 1_000n });
    for (const key of keys) {
      psbt.addUnknownKeyValToOutput(i, { key, value: new Uint8Array(32) });
    }
  });
  return psbt;
}

describe("hasHashiDepositField", () => {
  it("finds the field on any output", () => {
    expect(hasHashiDepositField(psbtWithOutputKeys([[], [hashiKey]]))).toBe(
      true,
    );
  });

  it("ignores other proprietary keys and other subtypes", () => {
    const otherIdentifier = new Uint8Array([
      0xfc, 0x05, 0x68, 0x61, 0x73, 0x68, 0x6a, 0x00,
    ]);
    const otherSubtype = new Uint8Array([
      0xfc, 0x05, 0x68, 0x61, 0x73, 0x68, 0x69, 0x01,
    ]);
    expect(
      hasHashiDepositField(
        psbtWithOutputKeys([[otherIdentifier, otherSubtype]]),
      ),
    ).toBe(false);
  });

  it("is false when no output carries unknown keys", () => {
    expect(hasHashiDepositField(psbtWithOutputKeys([[], []]))).toBe(false);
  });
});

describe("selectDeviceApp", () => {
  it("names the derived app of each Bitcoin network for a Hashi deposit", () => {
    expect(
      selectDeviceApp(psbtWithOutputKeys([[hashiKey]]), MAINNET_CHAIN_ID),
    ).toEqual({ kind: "derived", hwAppId: "Hashi" });
    expect(
      selectDeviceApp(psbtWithOutputKeys([[hashiKey]]), TESTNET_CHAIN_ID),
    ).toEqual({ kind: "derived", hwAppId: "Hashi Test" });
  });

  it("is unsupported for a Hashi deposit on a chain with no derived app", () => {
    expect(
      selectDeviceApp(psbtWithOutputKeys([[hashiKey]]), LITECOIN_CHAIN_ID),
    ).toEqual({ kind: "unsupported" });
  });

  it("keeps the default app without the field, on any chain", () => {
    expect(selectDeviceApp(psbtWithOutputKeys([[]]), MAINNET_CHAIN_ID)).toEqual(
      { kind: "default" },
    );
    expect(selectDeviceApp(psbtWithOutputKeys([[]]), TESTNET_CHAIN_ID)).toEqual(
      { kind: "default" },
    );
  });
});
