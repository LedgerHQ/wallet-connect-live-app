/**
 * @vitest-environment node
 * PSBTs are decoded with `@ledgerhq/psbtv2`, whose `fromV0` hands a `Buffer` to bitcoinjs-lib.
 * Under jsdom, Node's `Buffer` and the global `Uint8Array` come from different realms, so
 * bitcoinjs-lib's Uint8Array check fails; in the browser the polyfilled `Buffer` shares the realm.
 */
import { PsbtV2 } from "@ledgerhq/psbtv2";
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
  psbt.setVersion(2);
  psbt.addInput({
    hash: prevTx.getId(),
    index: 0,
    nonWitnessUtxo: prevTx.toBuffer(),
  });
  psbt.addOutput({ script: p2wpkhScript, value: 90_000n });
  return psbt;
}

/** The same PSBT serialized as BIP-370, as Ledger Wallet converts it. */
function toV2(v0: Psbt): string {
  return PsbtV2.fromV0(Buffer.from(v0.toBuffer()), true)
    .serialize()
    .toString("base64");
}

// Hand-written BIP-370 bytes, for maps the library would never produce.
function kv(key: number[], value: number[]): number[] {
  return [key.length, ...key, value.length, ...value];
}
function witnessUtxo(script: Uint8Array): number[] {
  return [0xa0, 0x86, 0x01, 0, 0, 0, 0, 0, script.length, ...script]; // 100 000 sat
}
function rawV2(inputMap: number[], outputMap: number[]): string {
  return Buffer.from([
    ...[0x70, 0x73, 0x62, 0x74, 0xff],
    ...kv([0x02], [2, 0, 0, 0]), // PSBT_GLOBAL_TX_VERSION
    ...kv([0x04], [1]), // PSBT_GLOBAL_INPUT_COUNT
    ...kv([0x05], [1]), // PSBT_GLOBAL_OUTPUT_COUNT
    ...kv([0xfb], [2, 0, 0, 0]), // PSBT_GLOBAL_VERSION
    0x00,
    ...inputMap,
    0x00,
    ...outputMap,
    0x00,
  ]).toString("base64");
}
const PREVOUT = [
  ...kv([0x0e], new Array<number>(32).fill(0x01)), // PSBT_IN_PREVIOUS_TXID
  ...kv([0x0f], [0, 0, 0, 0]), // PSBT_IN_OUTPUT_INDEX
];
const AMOUNT = kv([0x03], [0x50, 0xc3, 0, 0, 0, 0, 0, 0]); // PSBT_OUT_AMOUNT 50 000
const SCRIPT = kv([0x04], [...p2wpkhScript]); // PSBT_OUT_SCRIPT

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("decodePsbt with a PSBTv2", () => {
  it("is rejected by bitcoinjs-lib on its own, which is what this support works around", () => {
    expect(() => Psbt.fromBase64(toV2(buildV0()))).toThrow(/UNSIGNED_TX/);
  });

  it("reads the same inputs and outputs as the v0 encoding", () => {
    const v0 = buildV0();
    const fromV0 = decodePsbt(v0.toBase64());
    const fromV2 = decodePsbt(toV2(v0));

    for (const psbt of [fromV0, fromV2]) {
      expect(psbt.getGlobalInputCount()).toBe(1);
      expect(psbt.getInputPreviousTxid(0)).toEqual(
        Buffer.from(v0.txInputs[0].hash),
      );
      expect(psbt.getInputOutputIndex(0)).toBe(3);
      expect(psbt.getInputWitnessUtxo(0)?.scriptPubKey).toEqual(
        Buffer.from(p2wpkhScript),
      );
      expect(psbt.getGlobalOutputCount()).toBe(2);
      expect(psbt.getOutputAmount(0)).toBe(60_000);
      expect(psbt.getOutputScript(0)).toEqual(Buffer.from(p2trScript));
    }
  });

  it("keeps a proprietary (0xFC) output field from a PSBTv0 and a PSBTv2", () => {
    const v0 = buildV0();
    for (const psbt of [decodePsbt(v0.toBase64()), decodePsbt(toV2(v0))]) {
      expect(psbt.getOutputKeyDatas(0, 0xfc)).toEqual([
        Buffer.from(PROPRIETARY_KEY.subarray(1)),
      ]);
      expect(psbt.getOutputKeyDatas(1, 0xfc)).toEqual([]);
    }
  });

  it("supports an input given as a non-witness UTXO", () => {
    const v0 = buildNonWitnessV0();
    const psbt = decodePsbt(toV2(v0));
    expect(psbt.getInputNonWitnessUtxo(0)).toEqual(
      Buffer.from(v0.data.inputs[0].nonWitnessUtxo!),
    );
  });

  it("wraps a malformed PSBTv2 in the usual invalid-format error", () => {
    const truncated = Buffer.from(toV2(buildV0()), "base64")
      .subarray(0, -5)
      .toString("base64");
    expect(() => decodePsbt(truncated)).toThrow(/^Invalid PSBT format: /);
    // Each field every input and output needs is checked at decode time
    expect(() => decodePsbt(rawV2(PREVOUT, SCRIPT))).toThrow(
      /^Invalid PSBT format: /,
    );
    expect(() => decodePsbt(rawV2(PREVOUT, AMOUNT))).toThrow(
      /^Invalid PSBT format: /,
    );
    expect(() =>
      decodePsbt(rawV2(kv([0x0f], [0, 0, 0, 0]), [...AMOUNT, ...SCRIPT])),
    ).toThrow(/^Invalid PSBT format: /);
    expect(() =>
      decodePsbt(
        rawV2(
          [...PREVOUT, ...kv([0x01], [0x01, 0x02])],
          [...AMOUNT, ...SCRIPT],
        ),
      ),
    ).toThrow(/^Invalid PSBT format: /);
  });

  it("rejects a truncated PSBTv2 that declares a huge input count", () => {
    const declaringInputs = (count: number[]) =>
      Buffer.from([
        ...[0x70, 0x73, 0x62, 0x74, 0xff],
        ...kv([0xfb], [2, 0, 0, 0]),
        ...kv([0x02], [2, 0, 0, 0]),
        ...kv([0x04], count),
        ...kv([0x05], [0]),
        0x00, // end of the global map, then no input map
      ]).toString("base64");
    // 2^32 - 1, then 2^40: above the maximum array length
    for (const count of [
      [0xfe, 0xff, 0xff, 0xff, 0xff],
      [0xff, 0, 0, 0, 0, 1, 0, 0, 0],
    ]) {
      expect(() => decodePsbt(declaringInputs(count))).toThrow(
        /^Invalid PSBT format: /,
      );
    }
  });

  it("reads the last value of a duplicated key, as Ledger Wallet signs it", () => {
    const account = makeAccount(P2WPKH_ADDRESS!);
    const addresses = [P2WPKH_ADDRESS!.toLowerCase()];
    const withUtxos = (first: Uint8Array, last: Uint8Array) =>
      decodePsbt(
        rawV2(
          [
            ...kv([0x01], witnessUtxo(first)),
            ...kv([0x01], witnessUtxo(last)),
            ...PREVOUT,
          ],
          [...AMOUNT, ...SCRIPT],
        ),
      );

    expect(
      validatePsbtAccount(
        withUtxos(p2wpkhScript, p2pkhScript),
        account,
        addresses,
        networks.bitcoin,
      ).isValid,
    ).toBe(false);
    expect(
      validatePsbtAccount(
        withUtxos(p2pkhScript, p2wpkhScript),
        account,
        addresses,
        networks.bitcoin,
      ),
    ).toMatchObject({ isValid: true, validated: true });
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
