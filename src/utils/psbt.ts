import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { initEccLib, networks, payments, Psbt, Transaction } from "bitcoinjs-lib";
import * as ecc from "@bitcoinerlab/secp256k1";

let eccInitialized = false;
function ensureEccLib(): void {
  if (!eccInitialized) {
    initEccLib(ecc);
    eccInitialized = true;
  }
}

// Custom network definitions for chains not built into bitcoinjs-lib
const LITECOIN_NETWORK: networks.Network = {
  messagePrefix: "\x19Litecoin Signed Message:\n",
  bech32: "ltc",
  bip32: { public: 0x019da462, private: 0x019d9cfe },
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
};

const DOGECOIN_NETWORK: networks.Network = {
  messagePrefix: "\x19Dogecoin Signed Message:\n",
  bech32: "",
  bip32: { public: 0x02facafd, private: 0x02fac398 },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
};

const BIP122_CHAIN_ID_TO_NETWORK: Record<string, networks.Network> = {
  "bip122:000000000019d6689c085ae165831e93": networks.bitcoin,
  "bip122:000000000933ea01ad0ee984209779ba": networks.testnet,
  "bip122:12a765e31ffd4059bada1e25190f6e98": LITECOIN_NETWORK,
  "bip122:82bc68038f6034c0596b6e313729793a": DOGECOIN_NETWORK,
};

/**
 * Map a BIP122 chainId (e.g. "bip122:000000000933ea01ad0ee984209779ba") to
 * its corresponding bitcoinjs-lib Network object.
 * Falls back to Bitcoin mainnet for unknown chains.
 */
export function getBip122Network(chainId: string): networks.Network {
  return BIP122_CHAIN_ID_TO_NETWORK[chainId] ?? networks.bitcoin;
}

// Type Definitions for better type safety
export type ValidPsbtAccountResult = {
  isValid: true;
  validated: boolean;
  account: Account;
  inputAddresses: string[];
};

export type InvalidPsbtAccountResult = {
  isValid: false;
  validated: boolean;
  account?: Account;
  inputAddresses?: string[];
};

export type PsbtAccountValidationResult =
  | ValidPsbtAccountResult
  | InvalidPsbtAccountResult;

export type ValidSignInputsResult = {
  isValid: true;
};

export type InvalidSignInputsResult = {
  isValid: false;
  error: string;
};

export type SignInputsValidationResult =
  | ValidSignInputsResult
  | InvalidSignInputsResult;

/**
 * Decode a base64 encoded PSBT
 * @throws {Error} If the PSBT format is invalid
 */
export function decodePsbt(psbtBase64: string): Psbt {
  try {
    return Psbt.fromBase64(psbtBase64);
  } catch (error) {
    throw new Error(
      `Invalid PSBT format: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Known Bech32/Bech32m human-readable part prefixes (HRP + "1" separator)
 * for the networks this module supports.  Bech32 addresses are
 * case-insensitive (BIP 173/350); Base58Check addresses are not.
 */
const BECH32_PREFIXES = ["bc1", "tb1", "bcrt1", "ltc1", "tltc1"];

function isBech32Address(address: string): boolean {
  const lower = address.toLowerCase();
  return BECH32_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

/**
 * Normalise an address for storage / comparison.
 * Bech32/Bech32m → lowercase (canonical per BIP 173/350).
 * Base58Check    → unchanged (casing is significant).
 */
function normalizeAddress(address: string): string {
  return isBech32Address(address) ? address.toLowerCase() : address;
}

/**
 * Compare two addresses using encoding-aware normalisation.
 */
function addressesMatch(addr1: string, addr2: string): boolean {
  return normalizeAddress(addr1) === normalizeAddress(addr2);
}

/**
 * Build a Set of normalised addresses for constant-time membership checks.
 */
function toNormalizedSet(addresses: string[]): Set<string> {
  return new Set(addresses.map(normalizeAddress));
}

/**
 * Check if an address belongs to a pre-normalised Set of account addresses.
 */
function isAddressInAccount(
  address: string,
  accountAddressSet: Set<string>,
): boolean {
  return accountAddressSet.has(normalizeAddress(address));
}

function resolvePaymentAddress(
  paymentFactory: () => { address?: string },
): string | null {
  try {
    return paymentFactory().address ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract address from a scriptPubKey with script type detection.
 * Accepts Uint8Array directly to ensure compatibility with bitcoinjs-lib v7,
 * which uses valibot's v.instance(Uint8Array) validation internally.
 */
function extractAddressFromScript(
  script: Uint8Array,
  network: networks.Network = networks.bitcoin,
): string | null {
  ensureEccLib();
  const scriptLen = script.length;
  const patternStrategies = [
    {
      matches: () =>
        scriptLen === 25 &&
        script[0] === 0x76 &&
        script[1] === 0xa9 &&
        script[2] === 0x14,
      paymentFactory: () => payments.p2pkh({ output: script, network }),
    },
    {
      matches: () =>
        scriptLen === 23 && script[0] === 0xa9 && script[1] === 0x14,
      paymentFactory: () => payments.p2sh({ output: script, network }),
    },
    {
      matches: () =>
        scriptLen === 22 && script[0] === 0x00 && script[1] === 0x14,
      paymentFactory: () => payments.p2wpkh({ output: script, network }),
    },
    {
      matches: () =>
        scriptLen === 34 && script[0] === 0x00 && script[1] === 0x20,
      paymentFactory: () => payments.p2wsh({ output: script, network }),
    },
    {
      matches: () =>
        scriptLen === 34 && script[0] === 0x51 && script[1] === 0x20,
      paymentFactory: () => payments.p2tr({ output: script, network }),
    },
  ];

  for (const { matches, paymentFactory } of patternStrategies) {
    if (matches()) {
      const address = resolvePaymentAddress(paymentFactory);
      if (address) return address;
    }
  }

  // Fallback: try all payment types if pattern detection fails.
  for (const { paymentFactory } of patternStrategies) {
    const address = resolvePaymentAddress(paymentFactory);
    if (address) return address;
  }

  return null;
}

/**
 * Extract address from a specific PSBT input
 */
function extractAddressFromInput(
  psbt: Psbt,
  index: number,
  network: networks.Network = networks.bitcoin,
): string | null {
  if (index < 0 || index >= psbt.inputCount) {
    return null;
  }

  const input = psbt.data.inputs[index];

  // Try to extract address from witnessUtxo (SegWit)
  if (input.witnessUtxo?.script) {
    // Use new Uint8Array() to guarantee a plain Uint8Array, which bitcoinjs-lib v7
    // requires for its valibot v.instance(Uint8Array) payment function validation.
    const script = new Uint8Array(input.witnessUtxo.script);
    const address = extractAddressFromScript(script, network);
    if (address) return address;
  }

  // Try to extract address from nonWitnessUtxo (non-SegWit)
  if (input.nonWitnessUtxo) {
    try {
      const prevTx = Transaction.fromBuffer(
        new Uint8Array(input.nonWitnessUtxo),
      );
      const prevOutIndex = psbt.txInputs[index]?.index;
      if (prevOutIndex !== undefined && prevOutIndex < prevTx.outs.length) {
        const prevOutput = prevTx.outs[prevOutIndex];
        const address = extractAddressFromScript(
          new Uint8Array(prevOutput.script),
          network,
        );
        if (address) return address;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Extract addresses from PSBT inputs
 * @param psbt - The PSBT to extract addresses from
 * @param network - The Bitcoin network (defaults to mainnet)
 * @returns Array of successfully extracted addresses; inputs whose address couldn't be extracted are omitted
 */
export function extractInputAddresses(
  psbt: Psbt,
  network: networks.Network = networks.bitcoin,
): string[] {
  const addresses: string[] = [];

  for (let i = 0; i < psbt.inputCount; i++) {
    const address = extractAddressFromInput(psbt, i, network);
    if (address) {
      addresses.push(address);
    }
  }

  return addresses;
}

/**
 * Extract addresses from specific PSBT input indices
 * More efficient than extractInputAddresses when only specific indices are needed
 * @param psbt - The PSBT to extract addresses from
 * @param indices - Array of input indices to extract addresses from
 * @param network - The Bitcoin network (defaults to mainnet)
 * @returns Map of index to address (or null if address couldn't be extracted)
 */
export function extractInputAddressesByIndices(
  psbt: Psbt,
  indices: number[],
  network: networks.Network = networks.bitcoin,
): Map<number, string | null> {
  const addressMap = new Map<number, string | null>();

  for (const index of indices) {
    const address = extractAddressFromInput(psbt, index, network);
    addressMap.set(index, address);
  }

  return addressMap;
}

/**
 * Fetch all payment addresses for an account via wallet-api's bitcoin.getAddresses,
 * falling back to the main account address if the call fails or returns nothing.
 *
 * Callers should invoke this once and pass the result to validatePsbtAccount /
 * validateSignInputs to avoid redundant calls.
 *
 * Bech32/Bech32m addresses are lowercased (canonical form per BIP 173/350).
 * Base58Check addresses are returned verbatim because their casing is significant.
 *
 * @param account - The account to get addresses for
 * @param client - The WalletAPIClient instance
 * @returns Array of normalised addresses
 */
export async function getAccountAddresses(
  account: Account,
  client: WalletAPIClient,
): Promise<string[]> {
  try {
    const entries = await client.bitcoin.getAddresses(account.id, ["payment"]);
    if (entries.length > 0) {
      return entries.map((entry) => normalizeAddress(entry.address));
    }
  } catch {
    // Fall back to the main account address when the API call is unavailable or fails
  }
  return [normalizeAddress(account.address)];
}

/**
 * Validate that PSBT inputs match the provided account
 *
 * @param psbt - The PSBT to validate
 * @param account - The account to validate against (must be pre-resolved by the caller)
 * @param accountAddresses - All payment addresses belonging to the account
 * @param network - The Bitcoin network (defaults to mainnet)
 * @returns Validation result with validated flag indicating if validation was actually performed
 *
 * Note: The 'validated' flag indicates whether the validation was actually performed.
 * - validated: true, isValid: true = Validation passed
 * - validated: false, isValid: true = Validation couldn't be performed (no addresses extracted),
 *   proceeding optimistically and letting wallet-api handle final validation
 * - validated: true, isValid: false = Validation failed (addresses don't match)
 */
export function validatePsbtAccount(
  psbt: Psbt,
  account: Account,
  accountAddresses: string[],
  network: networks.Network = networks.bitcoin,
): PsbtAccountValidationResult {
  // Extract addresses from PSBT inputs
  const inputAddresses = extractInputAddresses(psbt, network);

  if (inputAddresses.length === 0) {
    // If we can't extract addresses, we can't validate
    // This might happen with certain PSBT formats or unsigned PSBTs
    // Return isValid: true but validated: false to indicate we're proceeding
    // optimistically and letting wallet-api handle the final validation
    return {
      isValid: true,
      validated: false,
      account,
      inputAddresses: [],
    };
  }

  const addressSet = toNormalizedSet(accountAddresses);

  // Check if any input address belongs to this account
  const hasMatchingAddress = inputAddresses.some((inputAddr) =>
    isAddressInAccount(inputAddr, addressSet),
  );

  if (!hasMatchingAddress) {
    return {
      isValid: false,
      validated: true,
      account,
      inputAddresses,
    };
  }

  return {
    isValid: true,
    validated: true,
    account,
    inputAddresses,
  };
}

/**
 * Validate signInputs parameter against PSBT and account
 *
 * @param psbt - The PSBT to validate
 * @param signInputs - Array of inputs to sign with their addresses and indices
 * @param account - The account that should own the inputs
 * @param network - The Bitcoin network (defaults to mainnet)
 * @returns Validation result indicating if all inputs are valid
 */
export function validateSignInputs(
  psbt: Psbt,
  signInputs: { address: string; index: number; sighashTypes?: number[] }[],
  account: Account,
  accountAddresses: string[],
  network: networks.Network = networks.bitcoin,
): SignInputsValidationResult {
  // Validate that all indices are within bounds
  for (const signInput of signInputs) {
    if (signInput.index < 0 || signInput.index >= psbt.inputCount) {
      return {
        isValid: false,
        error: `Input index ${signInput.index} is out of bounds (PSBT has ${psbt.inputCount} inputs)`,
      };
    }
  }

  // Extract addresses only for the specified inputs (optimization)
  const indices = signInputs.map((si) => si.index);
  const addressMap = extractInputAddressesByIndices(psbt, indices, network);

  const addressSet = toNormalizedSet(accountAddresses);

  // Validate that all specified addresses belong to the account
  for (const signInput of signInputs) {
    const inputAddress = addressMap.get(signInput.index);

    if (!inputAddress) {
      return {
        isValid: false,
        error: `Could not extract address for input index ${signInput.index}`,
      };
    }

    // Check if the signInput address matches the actual input address
    const addressMatches = addressesMatch(signInput.address, inputAddress);

    // Also check if both addresses belong to the account
    const signInputInAccount = isAddressInAccount(
      signInput.address,
      addressSet,
    );
    const inputAddressInAccount = isAddressInAccount(
      inputAddress,
      addressSet,
    );

    if (!addressMatches && !signInputInAccount) {
      return {
        isValid: false,
        error: `Address ${signInput.address} does not match input address ${inputAddress}`,
      };
    }

    if (!inputAddressInAccount) {
      return {
        isValid: false,
        error: `Input address ${inputAddress} at index ${signInput.index} does not belong to account ${account.address}`,
      };
    }
  }

  return { isValid: true };
}
