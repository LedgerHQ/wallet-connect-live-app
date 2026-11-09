import { Account } from "@ledgerhq/wallet-api-client";
import BigNumber from "bignumber.js";
import {
  initEccLib,
  networks,
  payments,
  Psbt,
  Transaction,
} from "bitcoinjs-lib";
import * as ecc from "@bitcoinerlab/secp256k1";
import { describe, expect, it } from "vitest";
import { decodePsbt, validatePsbtAccount, validateSignInputs } from "../psbt";
import { getPsbtVersion, psbtV2ToValidationPsbt } from "../psbtV2";
import { toV2 } from "./psbtV2.fixtures";

initEccLib(ecc);

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const p2wpkhScript = new Uint8Array([
  0x00,
  0x14,
  ...new Uint8Array(20).fill(0xab),
]);
const { address: P2WPKH_ADDRESS } = payments.p2wpkh({
  output: p2wpkhScript,
  network: networks.bitcoin,
});
const p2trScript = new Uint8Array([
  0x51,
  0x20,
  ...new Uint8Array(32).fill(0x02),
]);
const p2pkhScript = new Uint8Array([
  0x76,
  0xa9,
  0x14,
  ...new Uint8Array(20).fill(0xcc),
  0x88,
  0xac,
]);
const { address: P2PKH_ADDRESS } = payments.p2pkh({
  output: p2pkhScript,
  network: networks.bitcoin,
});

// Proprietary output field: 0xFC, identifier length 5, "hashi", subtype 0 → a 32-byte value.
const PROPRIETARY_KEY = new Uint8Array([
  0xfc, 0x05, 0x68, 0x61, 0x73, 0x68, 0x69, 0x00,
]);
const PROPRIETARY_VALUE = new Uint8Array(32).fill(0x11);

function makeAccount(address: string): Account {
  return {
    id: "bitcoin-account-id",
    name: "Bitcoin Account",
    address,
    currency: "bitcoin",
    blockHeight: 0,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    lastSyncDate: new Date(),
  };
}

function buildV0(): Psbt {
  const psbt = new Psbt({ network: networks.bitcoin });
  psbt.setVersion(2);
  psbt.setLocktime(840_000);
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x01),
    index: 3,
    sequence: 0xfffffffd,
    witnessUtxo: { script: p2wpkhScript, value: 100_000n },
  });
  psbt.addOutput({ script: p2trScript, value: 60_000n });
  psbt.addOutput({ script: p2wpkhScript, value: 39_000n });
  psbt.addUnknownKeyValToOutput(0, {
    key: PROPRIETARY_KEY,
    value: PROPRIETARY_VALUE,
  });
  return psbt;
}

function buildNonWitnessV0(): Psbt {
  const prevTx = new Transaction();
  prevTx.addInput(new Uint8Array(32).fill(0xfe), 0);
  prevTx.addOutput(p2pkhScript, 100_000n);
  const psbt = new Psbt({ network: networks.bitcoin });
  psbt.addInput({
    hash: prevTx.getId(),
    index: 0,
    nonWitnessUtxo: prevTx.toBuffer(),
  });
  psbt.addOutput({ script: p2wpkhScript, value: 90_000n });
  return psbt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getPsbtVersion", () => {
  it("returns 0 for a PSBTv0 and 2 for a PSBTv2", () => {
    const v0 = buildV0();
    expect(getPsbtVersion(v0.toBase64())).toBe(0);
    expect(getPsbtVersion(toV2(v0))).toBe(2);
  });

  it("throws on bytes that are not a PSBT", () => {
    expect(() => getPsbtVersion(btoa("not a psbt"))).toThrow(/magic/);
  });
});

describe("decodePsbt with a PSBTv2", () => {
  it("is rejected by bitcoinjs-lib on its own, which is what this support works around", () => {
    expect(() => Psbt.fromBase64(toV2(buildV0()))).toThrow(/UNSIGNED_TX/);
  });

  it("rebuilds the same inputs, outputs, version and locktime as the v0 encoding", () => {
    const v0 = buildV0();
    const decoded = decodePsbt(toV2(v0));

    expect(decoded.version).toBe(v0.version);
    expect(decoded.locktime).toBe(v0.locktime);
    expect(decoded.inputCount).toBe(1);
    expect(decoded.txInputs[0].hash).toEqual(v0.txInputs[0].hash);
    expect(decoded.txInputs[0].index).toBe(3);
    expect(decoded.txInputs[0].sequence).toBe(0xfffffffd);
    expect(decoded.data.inputs[0].witnessUtxo).toEqual(
      v0.data.inputs[0].witnessUtxo,
    );
    expect(
      decoded.txOutputs.map(({ script, value }) => ({ script, value })),
    ).toEqual(v0.txOutputs.map(({ script, value }) => ({ script, value })));
  });

  it("keeps a proprietary (0xFC) output field byte for byte", () => {
    const decoded = decodePsbt(toV2(buildV0()));
    expect(decoded.data.outputs[0].unknownKeyVals).toEqual([
      { key: PROPRIETARY_KEY, value: PROPRIETARY_VALUE },
    ]);
    expect(decoded.data.outputs[1].unknownKeyVals ?? []).toEqual([]);
  });

  it("does not copy non-proprietary unknown output keys into the validation view", () => {
    const decoded = psbtV2ToValidationPsbt(
      toV2(buildV0(), {
        extraOutputKeys: [
          { key: new Uint8Array([0x42]), value: new Uint8Array([0x01]) },
        ],
      }),
    );
    expect(decoded.data.outputs[0].unknownKeyVals).toEqual([
      { key: PROPRIETARY_KEY, value: PROPRIETARY_VALUE },
    ]);
  });

  it("supports an input given as a non-witness UTXO", () => {
    const v0 = buildNonWitnessV0();
    const decoded = decodePsbt(toV2(v0));
    expect(decoded.data.inputs[0].nonWitnessUtxo).toEqual(
      v0.data.inputs[0].nonWitnessUtxo,
    );
    expect(decoded.txInputs[0].hash).toEqual(v0.txInputs[0].hash);
  });

  it("wraps a malformed PSBTv2 in the usual invalid-format error", () => {
    const truncated = btoa(atob(toV2(buildV0())).slice(0, -5));
    expect(() => decodePsbt(truncated)).toThrow(/^Invalid PSBT format: /);
    expect(() =>
      decodePsbt(toV2(buildV0(), { dropOutputAmount: true })),
    ).toThrow(/missing the amount of output 0/);
    expect(() => decodePsbt(btoa(atob(toV2(buildV0())) + "\x00"))).toThrow(
      /Trailing bytes/,
    );
  });

  it("still decodes a PSBTv0 through bitcoinjs-lib", () => {
    const v0 = buildV0();
    expect(decodePsbt(v0.toBase64()).toBase64()).toBe(v0.toBase64());
  });
});

describe("account checks on a PSBTv2", () => {
  it("validatePsbtAccount gives the same answer for the v0 and v2 encodings", () => {
    const v0 = buildV0();
    const account = makeAccount(P2WPKH_ADDRESS!);
    const addresses = [P2WPKH_ADDRESS!.toLowerCase()];

    const fromV0 = validatePsbtAccount(
      decodePsbt(v0.toBase64()),
      account,
      addresses,
      networks.bitcoin,
    );
    const fromV2 = validatePsbtAccount(
      decodePsbt(toV2(v0)),
      account,
      addresses,
      networks.bitcoin,
    );

    expect(fromV2).toEqual(fromV0);
    expect(fromV2).toMatchObject({ isValid: true, validated: true });
  });

  it("validatePsbtAccount rejects a PSBTv2 whose inputs belong to another account", () => {
    const account = makeAccount(P2PKH_ADDRESS!);
    const result = validatePsbtAccount(
      decodePsbt(toV2(buildV0())),
      account,
      [P2PKH_ADDRESS!.toLowerCase()],
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
  });

  it("validateSignInputs accepts a PSBTv2 input that belongs to the account", () => {
    const account = makeAccount(P2WPKH_ADDRESS!);
    const result = validateSignInputs(
      decodePsbt(toV2(buildV0())),
      [{ address: P2WPKH_ADDRESS!, index: 0 }],
      account,
      [P2WPKH_ADDRESS!.toLowerCase()],
      networks.bitcoin,
    );
    expect(result).toEqual({ isValid: true });
  });
});
