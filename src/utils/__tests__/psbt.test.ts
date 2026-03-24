import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import BigNumber from "bignumber.js";
import { initEccLib, networks, payments, Psbt, Transaction } from "bitcoinjs-lib";
import * as ecc from "@bitcoinerlab/secp256k1";
import { describe, expect, it, vi } from "vitest";

// P2TR (Taproot) payment functions in bitcoinjs-lib require an ECC library.
initEccLib(ecc);
import {
  decodePsbt,
  extractInputAddresses,
  extractInputAddressesByIndices,
  getAccountAddresses,
  getBip122Network,
  validatePsbtAccount,
  validateSignInputs,
} from "../psbt";

// ─────────────────────────────────────────────────────────────────────────────
// Script primitives
// bitcoinjs-lib v7 requires plain Uint8Array (not a Buffer subclass) for
// payment script fields validated with valibot's v.instance(Uint8Array).
// ─────────────────────────────────────────────────────────────────────────────

// P2WPKH: OP_0 PUSH20 <20-byte hash>  (22 bytes)
const p2wpkhHash = new Uint8Array(20).fill(0xab);
const p2wpkhScript = new Uint8Array([0x00, 0x14, ...p2wpkhHash]);
const { address: P2WPKH_ADDRESS } = payments.p2wpkh({
  output: p2wpkhScript,
  network: networks.bitcoin,
});

// P2WSH: OP_0 PUSH32 <32-byte hash>  (34 bytes)
const p2wshHash = new Uint8Array(32).fill(0xcd);
const p2wshScript = new Uint8Array([0x00, 0x20, ...p2wshHash]);
const { address: P2WSH_ADDRESS } = payments.p2wsh({
  output: p2wshScript,
  network: networks.bitcoin,
});

// P2TR: OP_1 PUSH32 <32-byte x-only pubkey>  (34 bytes)
const taprootXOnlyPubkey = new Uint8Array(32).fill(0x02);
const p2trScript = new Uint8Array([0x51, 0x20, ...taprootXOnlyPubkey]);
const { address: P2TR_ADDRESS } = payments.p2tr({
  output: p2trScript,
  network: networks.bitcoin,
});

// P2PKH: OP_DUP OP_HASH160 PUSH20 <hash> OP_EQUALVERIFY OP_CHECKSIG  (25 bytes)
const p2pkhHash = new Uint8Array(20).fill(0xcc);
const p2pkhScript = new Uint8Array([
  0x76, 0xa9, 0x14, ...p2pkhHash, 0x88, 0xac,
]);
const { address: P2PKH_ADDRESS } = payments.p2pkh({
  output: p2pkhScript,
  network: networks.bitcoin,
});

// Testnet P2WPKH (same script bytes, different network → tb1... address)
const testnetHash160 = new Uint8Array(20).fill(0xef);
const testnetP2wpkhScript = new Uint8Array([0x00, 0x14, ...testnetHash160]);
const { address: TESTNET_P2WPKH_ADDRESS } = payments.p2wpkh({
  output: testnetP2wpkhScript,
  network: networks.testnet,
});

// ─────────────────────────────────────────────────────────────────────────────
// PSBT factory helpers
// ─────────────────────────────────────────────────────────────────────────────

function addDummyOutput(psbt: Psbt): void {
  psbt.addOutput({ address: P2WPKH_ADDRESS!, value: 50_000n });
}

function buildP2wpkhPsbt(network = networks.bitcoin): Psbt {
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x01),
    index: 0,
    witnessUtxo: { script: p2wpkhScript, value: 100_000n },
  });
  addDummyOutput(psbt);
  return psbt;
}

function buildP2wshPsbt(network = networks.bitcoin): Psbt {
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x03),
    index: 0,
    witnessUtxo: { script: p2wshScript, value: 100_000n },
  });
  addDummyOutput(psbt);
  return psbt;
}

function buildP2trPsbt(network = networks.bitcoin): Psbt {
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x04),
    index: 0,
    witnessUtxo: { script: p2trScript, value: 100_000n },
  });
  addDummyOutput(psbt);
  return psbt;
}

/** Tests the witnessUtxo path for a P2PKH script. */
function buildP2pkhWitnessUtxoPsbt(network = networks.bitcoin): Psbt {
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x02),
    index: 0,
    witnessUtxo: { script: p2pkhScript, value: 100_000n },
  });
  addDummyOutput(psbt);
  return psbt;
}

/**
 * Builds a PSBT with a P2PKH input supplied via nonWitnessUtxo, exercising
 * the Transaction.fromBuffer code path in extractAddressFromInput.
 */
function buildP2pkhNonWitnessPsbt(network = networks.bitcoin): Psbt {
  const prevTx = new Transaction();
  prevTx.addInput(new Uint8Array(32).fill(0xfe), 0);
  prevTx.addOutput(p2pkhScript, BigInt(100_000));

  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: prevTx.getId(), // actual txid so bitcoinjs-lib passes its hash check
    index: 0,
    nonWitnessUtxo: prevTx.toBuffer(),
  });
  addDummyOutput(psbt);
  return psbt;
}

/** Three inputs: P2WPKH (index 0), P2WSH (index 1), P2TR (index 2). */
function buildMixedPsbt(network = networks.bitcoin): Psbt {
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x01),
    index: 0,
    witnessUtxo: { script: p2wpkhScript, value: 100_000n },
  });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x02),
    index: 0,
    witnessUtxo: { script: p2wshScript, value: 200_000n },
  });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x03),
    index: 0,
    witnessUtxo: { script: p2trScript, value: 300_000n },
  });
  addDummyOutput(psbt);
  return psbt;
}

/**
 * Builds a PSBT whose single input carries a script that cannot be decoded
 * to any known payment type (OP_RETURN data), so address extraction returns null.
 */
function buildUnrecognizedScriptPsbt(network = networks.bitcoin): Psbt {
  const opReturnScript = new Uint8Array([0x6a, 0x04, 0x74, 0x65, 0x73, 0x74]);
  const psbt = new Psbt({ network });
  psbt.addInput({
    hash: new Uint8Array(32).fill(0x06),
    index: 0,
    witnessUtxo: { script: opReturnScript, value: 0n },
  });
  addDummyOutput(psbt);
  return psbt;
}

// ─────────────────────────────────────────────────────────────────────────────
// Account factory helper
// ─────────────────────────────────────────────────────────────────────────────

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: "bitcoin-account-id",
    name: "Bitcoin Account",
    address: P2WPKH_ADDRESS!,
    currency: "bitcoin",
    blockHeight: 0,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    lastSyncDate: new Date(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getBip122Network
// ─────────────────────────────────────────────────────────────────────────────

describe("getBip122Network", () => {
  it("returns Bitcoin mainnet for the mainnet chain ID", () => {
    const network = getBip122Network(
      "bip122:000000000019d6689c085ae165831e93",
    );
    expect(network).toBe(networks.bitcoin);
  });

  it("returns Bitcoin testnet for the testnet chain ID", () => {
    const network = getBip122Network(
      "bip122:000000000933ea01ad0ee984209779ba",
    );
    expect(network).toBe(networks.testnet);
  });

  it("returns the Litecoin network for the Litecoin chain ID", () => {
    const network = getBip122Network(
      "bip122:12a765e31ffd4059bada1e25190f6e98",
    );
    expect(network.bech32).toBe("ltc");
    expect(network.pubKeyHash).toBe(0x30);
    expect(network.scriptHash).toBe(0x32);
  });

  it("returns the Dogecoin network for the Dogecoin chain ID", () => {
    const network = getBip122Network(
      "bip122:82bc68038f6034c0596b6e313729793a",
    );
    expect(network.pubKeyHash).toBe(0x1e);
    expect(network.scriptHash).toBe(0x16);
  });

  it("falls back to Bitcoin mainnet for an unknown chain ID", () => {
    const network = getBip122Network("bip122:unknown-chain-id");
    expect(network).toBe(networks.bitcoin);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// decodePsbt
// ─────────────────────────────────────────────────────────────────────────────

describe("decodePsbt", () => {
  it("successfully decodes a valid base64-encoded PSBT", () => {
    const base64 = buildP2wpkhPsbt().toBase64();
    const psbt = decodePsbt(base64);
    expect(psbt).toBeInstanceOf(Psbt);
    expect(psbt.inputCount).toBe(1);
  });

  it("throws with 'Invalid PSBT format' for malformed base64 input", () => {
    expect(() => decodePsbt("not-valid-base64!@#$")).toThrow(
      /Invalid PSBT format/,
    );
  });

  it("throws with 'Invalid PSBT format' for an empty string", () => {
    expect(() => decodePsbt("")).toThrow(/Invalid PSBT format/);
  });

  it("throws with 'Invalid PSBT format' for valid base64 that is not a PSBT", () => {
    const notAPsbt = Buffer.from("this is not a psbt").toString("base64");
    expect(() => decodePsbt(notAPsbt)).toThrow(/Invalid PSBT format/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractInputAddresses
// ─────────────────────────────────────────────────────────────────────────────

describe("extractInputAddresses", () => {
  it("extracts a P2WPKH address via witnessUtxo", () => {
    const psbt = buildP2wpkhPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toEqual([P2WPKH_ADDRESS]);
  });

  it("extracts a P2WSH address via witnessUtxo", () => {
    const psbt = buildP2wshPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toEqual([P2WSH_ADDRESS]);
  });

  it("extracts a P2TR (Taproot) address via witnessUtxo", () => {
    const psbt = buildP2trPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toEqual([P2TR_ADDRESS]);
  });

  it("extracts a P2PKH address via witnessUtxo", () => {
    const psbt = buildP2pkhWitnessUtxoPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toEqual([P2PKH_ADDRESS]);
  });

  it("extracts a P2PKH address from a nonWitnessUtxo (full previous tx)", () => {
    const psbt = buildP2pkhNonWitnessPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toEqual([P2PKH_ADDRESS]);
  });

  it("extracts all addresses from a PSBT with mixed script types", () => {
    const psbt = buildMixedPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toHaveLength(3);
    expect(addresses).toContain(P2WPKH_ADDRESS);
    expect(addresses).toContain(P2WSH_ADDRESS);
    expect(addresses).toContain(P2TR_ADDRESS);
  });

  it("returns an empty array for a PSBT that has no inputs", () => {
    const emptyPsbt = new Psbt({ network: networks.bitcoin });
    const addresses = extractInputAddresses(emptyPsbt, networks.bitcoin);
    expect(addresses).toEqual([]);
  });

  it("derives testnet bech32 addresses when the testnet network is provided", () => {
    const psbt = new Psbt({ network: networks.testnet });
    psbt.addInput({
      hash: new Uint8Array(32).fill(0x01),
      index: 0,
      witnessUtxo: { script: testnetP2wpkhScript, value: 100_000n },
    });
    psbt.addOutput({ address: TESTNET_P2WPKH_ADDRESS!, value: 50_000n });

    const addresses = extractInputAddresses(psbt, networks.testnet);
    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toBe(TESTNET_P2WPKH_ADDRESS);
    expect(addresses[0]).toMatch(/^tb1/);
  });

  it("skips inputs whose scripts cannot be decoded", () => {
    const psbt = buildUnrecognizedScriptPsbt();
    const addresses = extractInputAddresses(psbt, networks.bitcoin);
    expect(addresses).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractInputAddressesByIndices
// ─────────────────────────────────────────────────────────────────────────────

describe("extractInputAddressesByIndices", () => {
  it("returns an address for each valid index", () => {
    const psbt = buildP2wpkhPsbt(); // 1 input at index 0
    const map = extractInputAddressesByIndices(psbt, [0], networks.bitcoin);
    expect(map.size).toBe(1);
    expect(map.get(0)).toBe(P2WPKH_ADDRESS);
  });

  it("returns null for an index that is beyond inputCount", () => {
    const psbt = buildP2wpkhPsbt(); // 1 input — index 5 is out of range
    const map = extractInputAddressesByIndices(psbt, [0, 5], networks.bitcoin);
    expect(map.get(0)).toBe(P2WPKH_ADDRESS);
    expect(map.get(5)).toBeNull();
  });

  it("returns null for a negative index", () => {
    const psbt = buildP2wpkhPsbt();
    const map = extractInputAddressesByIndices(psbt, [-1], networks.bitcoin);
    expect(map.get(-1)).toBeNull();
  });

  it("returns an empty map for an empty indices array", () => {
    const psbt = buildMixedPsbt();
    const map = extractInputAddressesByIndices(psbt, [], networks.bitcoin);
    expect(map.size).toBe(0);
  });

  it("handles non-contiguous indices, skipping unrequested ones", () => {
    const psbt = buildMixedPsbt(); // inputs at 0, 1, 2
    const map = extractInputAddressesByIndices(psbt, [0, 2], networks.bitcoin);
    expect(map.size).toBe(2);
    expect(map.get(0)).toBe(P2WPKH_ADDRESS);
    expect(map.get(2)).toBe(P2TR_ADDRESS);
    expect(map.has(1)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validatePsbtAccount
// ─────────────────────────────────────────────────────────────────────────────

describe("validatePsbtAccount", () => {
  it("returns isValid:true / validated:false when no addresses can be extracted (optimistic pass-through)", () => {
    const psbt = buildUnrecognizedScriptPsbt();
    const account = makeAccount();
    const result = validatePsbtAccount(
      psbt,
      account,
      [account.address.toLowerCase()],
      networks.bitcoin,
    );
    expect(result).toEqual({
      isValid: true,
      validated: false,
      account,
      inputAddresses: [],
    });
  });

  it("returns isValid:true / validated:true when an input address belongs to the account", () => {
    const psbt = buildP2wpkhPsbt();
    const account = makeAccount({ address: P2WPKH_ADDRESS! });
    const result = validatePsbtAccount(
      psbt,
      account,
      [P2WPKH_ADDRESS!.toLowerCase()],
      networks.bitcoin,
    );
    expect(result.isValid).toBe(true);
    expect(result.validated).toBe(true);
    if (result.isValid) {
      expect(result.account).toEqual(account);
      expect(result.inputAddresses).toContain(P2WPKH_ADDRESS);
    }
  });

  it("returns isValid:false / validated:true when no input address belongs to the account", () => {
    const psbt = buildP2wpkhPsbt(); // inputs spend from P2WPKH_ADDRESS
    const differentAddress = P2PKH_ADDRESS!;
    const account = makeAccount({ address: differentAddress });
    const result = validatePsbtAccount(
      psbt,
      account,
      [differentAddress.toLowerCase()], // account owns P2PKH_ADDRESS, not P2WPKH_ADDRESS
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
    expect(result.validated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateSignInputs
// ─────────────────────────────────────────────────────────────────────────────

describe("validateSignInputs", () => {
  const account = makeAccount({ address: P2WPKH_ADDRESS! });
  const accountAddresses = [P2WPKH_ADDRESS!.toLowerCase()];

  it("returns an error when a signInput index is out of bounds", () => {
    const psbt = buildP2wpkhPsbt(); // 1 input at index 0
    const result = validateSignInputs(
      psbt,
      [{ address: P2WPKH_ADDRESS!, index: 1 }], // index 1 does not exist
      account,
      accountAddresses,
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toMatch(/index 1 is out of bounds/);
    }
  });

  it("returns an error when the address cannot be extracted for a given input", () => {
    const psbt = buildUnrecognizedScriptPsbt(); // index 0 exists but script is unrecognizable
    const result = validateSignInputs(
      psbt,
      [{ address: P2WPKH_ADDRESS!, index: 0 }],
      account,
      accountAddresses,
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toMatch(/Could not extract address for input index 0/);
    }
  });

  it("returns an error when signInput.address does not match the input address and is not in the account", () => {
    const psbt = buildP2wpkhPsbt(); // input 0 → P2WPKH_ADDRESS
    const foreignAddress = P2PKH_ADDRESS!; // different address, not in accountAddresses
    const result = validateSignInputs(
      psbt,
      [{ address: foreignAddress, index: 0 }],
      account,
      accountAddresses, // only contains P2WPKH_ADDRESS
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toMatch(/does not match input address/);
    }
  });

  it("returns an error when the extracted input address does not belong to the account", () => {
    const psbt = buildP2wpkhPsbt(); // input 0 → P2WPKH_ADDRESS
    const unrelatedAccountAddresses = [P2PKH_ADDRESS!.toLowerCase()];
    const result = validateSignInputs(
      psbt,
      [{ address: P2WPKH_ADDRESS!, index: 0 }], // address matches input
      account,
      unrelatedAccountAddresses, // P2WPKH_ADDRESS is NOT in this account
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toMatch(/does not belong to account/);
    }
  });

  it("returns isValid:true when signInput.address matches the input address and is in the account", () => {
    const psbt = buildP2wpkhPsbt();
    const result = validateSignInputs(
      psbt,
      [{ address: P2WPKH_ADDRESS!, index: 0 }],
      account,
      accountAddresses,
      networks.bitcoin,
    );
    expect(result).toEqual({ isValid: true });
  });

  it("returns isValid:true when signInput.address is a different account address that also resolves to the same input (multi-address account)", () => {
    // Both P2WPKH_ADDRESS and P2PKH_ADDRESS belong to this account (HD wallet scenario)
    const multiAddressAccount = makeAccount({ address: P2WPKH_ADDRESS! });
    const multiAccountAddresses = [
      P2WPKH_ADDRESS!.toLowerCase(),
      P2PKH_ADDRESS!.toLowerCase(),
    ];
    const psbt = buildP2wpkhPsbt(); // input 0 → P2WPKH_ADDRESS

    // signInput provides P2PKH_ADDRESS — different from the actual input address,
    // but both belong to the same account, so it should be accepted.
    const result = validateSignInputs(
      psbt,
      [{ address: P2PKH_ADDRESS!, index: 0 }],
      multiAddressAccount,
      multiAccountAddresses,
      networks.bitcoin,
    );
    expect(result).toEqual({ isValid: true });
  });

  it("returns an error for the first invalid index when multiple sign inputs are provided", () => {
    const psbt = buildP2wpkhPsbt(); // 1 input (index 0 only)
    const result = validateSignInputs(
      psbt,
      [
        { address: P2WPKH_ADDRESS!, index: 0 }, // valid
        { address: P2WPKH_ADDRESS!, index: 99 }, // out of bounds
      ],
      account,
      accountAddresses,
      networks.bitcoin,
    );
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error).toMatch(/index 99 is out of bounds/);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAccountAddresses
// ─────────────────────────────────────────────────────────────────────────────

describe("getAccountAddresses", () => {
  it("returns lowercase addresses from client.bitcoin.getAddresses on success", async () => {
    const account = makeAccount({ address: "BC1QABCDE" });
    const mockClient = {
      bitcoin: {
        getAddresses: vi.fn().mockResolvedValue([
          { address: "BC1QADDR1" },
          { address: "BC1QADDR2" },
        ]),
      },
    } as unknown as WalletAPIClient;

    const addresses = await getAccountAddresses(account, mockClient);
    expect(addresses).toEqual(["bc1qaddr1", "bc1qaddr2"]);
  });

  it("falls back to the account's own address (lowercased) when getAddresses throws", async () => {
    const account = makeAccount({ address: "BC1QMAINADDR" });
    const mockClient = {
      bitcoin: {
        getAddresses: vi.fn().mockRejectedValue(new Error("API unavailable")),
      },
    } as unknown as WalletAPIClient;

    const addresses = await getAccountAddresses(account, mockClient);
    expect(addresses).toEqual(["bc1qmainaddr"]);
  });

  it("falls back to the account's own address when getAddresses returns an empty array", async () => {
    const account = makeAccount({ address: "BC1QMAINADDR" });
    const mockClient = {
      bitcoin: {
        getAddresses: vi.fn().mockResolvedValue([]),
      },
    } as unknown as WalletAPIClient;

    const addresses = await getAccountAddresses(account, mockClient);
    expect(addresses).toEqual(["bc1qmainaddr"]);
  });
});
