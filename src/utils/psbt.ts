import { Psbt, payments, networks, Transaction } from "bitcoinjs-lib";
import type { Account } from "@ledgerhq/wallet-api-client";

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

export type PsbtAccountValidationResult = ValidPsbtAccountResult | InvalidPsbtAccountResult;

export type ValidSignInputsResult = {
  isValid: true;
};

export type InvalidSignInputsResult = {
  isValid: false;
  error: string;
};

export type SignInputsValidationResult = ValidSignInputsResult | InvalidSignInputsResult;

/**
 * Decode a base64 encoded PSBT
 * @throws {Error} If the PSBT format is invalid
 */
export function decodePsbt(psbtBase64: string): Psbt {
  try {
    return Psbt.fromBase64(psbtBase64);
  } catch (error) {
    throw new Error(`Invalid PSBT format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert Uint8Array or Buffer to Buffer
 */
function toBuffer(data: Buffer | Uint8Array): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

/**
 * Helper function to compare addresses (case-insensitive)
 */
function addressesMatch(addr1: string, addr2: string): boolean {
  return addr1.toLowerCase() === addr2.toLowerCase();
}

/**
 * Helper function to check if an address belongs to a list of account addresses
 */
function isAddressInAccount(address: string, accountAddresses: string[]): boolean {
  const lowerAddr = address.toLowerCase();
  return accountAddresses.some((accAddr) => accAddr === lowerAddr);
}

/**
 * Extract address from a scriptPubKey buffer with script type detection
 */
function extractAddressFromScript(script: Buffer, network: networks.Network = networks.bitcoin): string | null {
  try {
    const scriptLen = script.length;
    
    // Optimize by detecting script type based on length and patterns
    // P2PKH: 25 bytes (OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG)
    if (scriptLen === 25 && script[0] === 0x76 && script[1] === 0xa9 && script[2] === 0x14) {
      const p2pkh = payments.p2pkh({ output: script, network });
      if (p2pkh.address) return p2pkh.address;
    }
    
    // P2SH: 23 bytes (OP_HASH160 <20 bytes> OP_EQUAL)
    if (scriptLen === 23 && script[0] === 0xa9 && script[1] === 0x14) {
      const p2sh = payments.p2sh({ output: script, network });
      if (p2sh.address) return p2sh.address;
    }
    
    // P2WPKH: 22 bytes (OP_0 <20 bytes>)
    if (scriptLen === 22 && script[0] === 0x00 && script[1] === 0x14) {
      const p2wpkh = payments.p2wpkh({ output: script, network });
      if (p2wpkh.address) return p2wpkh.address;
    }
    
    // P2WSH: 34 bytes (OP_0 <32 bytes>)
    if (scriptLen === 34 && script[0] === 0x00 && script[1] === 0x20) {
      const p2wsh = payments.p2wsh({ output: script, network });
      if (p2wsh.address) return p2wsh.address;
    }
    
    // P2TR (Taproot): 34 bytes (OP_1 <32 bytes>)
    if (scriptLen === 34 && script[0] === 0x51 && script[1] === 0x20) {
      const p2tr = payments.p2tr({ output: script, network });
      if (p2tr.address) return p2tr.address;
    }
    
    // Fallback: try all payment types if pattern detection fails
    const paymentTypes = [
      () => payments.p2pkh({ output: script, network }),
      () => payments.p2sh({ output: script, network }),
      () => payments.p2wpkh({ output: script, network }),
      () => payments.p2wsh({ output: script, network }),
      () => payments.p2tr({ output: script, network }),
    ];
    
    for (const paymentType of paymentTypes) {
      try {
        const payment = paymentType();
        if (payment.address) return payment.address;
      } catch {
        // Continue to next type
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract address from a specific PSBT input
 */
function extractAddressFromInput(
  psbt: Psbt,
  index: number,
  network: networks.Network = networks.bitcoin
): string | null {
  if (index < 0 || index >= psbt.inputCount) {
    return null;
  }
  
  const input = psbt.data.inputs[index];
  
  // Try to extract address from witnessUtxo (SegWit)
  if (input.witnessUtxo?.script) {
    const scriptBuffer = toBuffer(input.witnessUtxo.script);
    const address = extractAddressFromScript(scriptBuffer, network);
    if (address) return address;
  }
  
  // Try to extract address from nonWitnessUtxo (non-SegWit)
  if (input.nonWitnessUtxo) {
    try {
      const nonWitnessBuffer = toBuffer(input.nonWitnessUtxo);
      const prevTx = Transaction.fromBuffer(nonWitnessBuffer);
      const prevOutIndex = psbt.txInputs[index]?.index;
      if (prevOutIndex !== undefined && prevOutIndex < prevTx.outs.length) {
        const prevOutput = prevTx.outs[prevOutIndex];
        const scriptBuffer = toBuffer(prevOutput.script);
        const address = extractAddressFromScript(scriptBuffer, network);
        if (address) return address;
      }
    } catch {
      // If we can't parse the transaction, return null
    }
  }
  
  return null;
}

/**
 * Extract addresses from PSBT inputs
 * @param psbt - The PSBT to extract addresses from
 * @param network - The Bitcoin network (defaults to mainnet)
 * @returns Array of addresses (may contain null for inputs where address couldn't be extracted)
 */
export function extractInputAddresses(psbt: Psbt, network: networks.Network = networks.bitcoin): string[] {
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
  network: networks.Network = networks.bitcoin
): Map<number, string | null> {
  const addressMap = new Map<number, string | null>();
  
  for (const index of indices) {
    const address = extractAddressFromInput(psbt, index, network);
    addressMap.set(index, address);
  }
  
  return addressMap;
}

/**
 * Get all addresses for an account
 * 
 * LIMITATION: This currently only returns the main account address.
 * 
 * In Bitcoin, a single account can have multiple addresses (change addresses,
 * different derivation paths, etc.). This implementation only checks the main
 * address, which means:
 * 
 * - PSBTs using change addresses from the same account may fail validation
 * - PSBTs using different derivation paths may fail validation
 * 
 * To fully support multi-address accounts, you would need to:
 * 1. Use the wallet-api's getAccountAddresses method if available
 * 2. Or maintain a cache of known addresses for each account
 * 3. Or derive addresses using the account's xpub/derivation path
 * 
 * @param account - The account to get addresses for
 * @returns Array of lowercase addresses (currently only the main address)
 */
function getAccountAddresses(account: Account): string[] {
  return [account.address.toLowerCase()];
}

/**
 * Validate that PSBT inputs match the provided account
 * 
 * @param psbt - The PSBT to validate
 * @param accountAddress - The address of the account to validate against
 * @param accounts - List of available accounts
 * @param network - The Bitcoin network (defaults to mainnet)
 * @returns Validation result with validated flag indicating if validation was actually performed
 * 
 * Note: The 'validated' flag indicates whether the validation was actually performed.
 * - validated: true, isValid: true = Validation passed
 * - validated: false, isValid: true = Validation couldn't be performed (no addresses extracted),
 *   proceeding optimistically and letting wallet-api handle final validation
 * - validated: true, isValid: false = Validation failed (addresses don't match)
 * - validated: false, isValid: false = Account not found
 */
export function validatePsbtAccount(
  psbt: Psbt,
  accountAddress: string,
  accounts: Account[],
  network: networks.Network = networks.bitcoin,
): PsbtAccountValidationResult {
  // Find the account
  const account = accounts.find(
    (acc) => addressesMatch(acc.address, accountAddress),
  );
  
  if (!account) {
    return { 
      isValid: false, 
      validated: false,
    };
  }
  
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
      inputAddresses: [] 
    };
  }
  
  // Get all addresses for this account
  const accountAddresses = getAccountAddresses(account);
  
  // Check if any input address belongs to this account
  const hasMatchingAddress = inputAddresses.some((inputAddr) =>
    isAddressInAccount(inputAddr, accountAddresses),
  );
  
  if (!hasMatchingAddress) {
    return { 
      isValid: false, 
      validated: true, 
      account, 
      inputAddresses 
    };
  }
  
  return { 
    isValid: true, 
    validated: true, 
    account, 
    inputAddresses 
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
  const accountAddresses = getAccountAddresses(account);
  
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
    const signInputInAccount = isAddressInAccount(signInput.address, accountAddresses);
    const inputAddressInAccount = isAddressInAccount(inputAddress, accountAddresses);
    
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
