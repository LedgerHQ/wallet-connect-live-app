import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";
import nacl from "tweetnacl";

// ============================================================================
// TYPES
// ============================================================================

type TransactionConfig = {
  fromPubkey: string;
  toPubkey: string;
  lamports: number;
  recentBlockhash: string;
};

type TransactionWorkflowResult = {
  transaction: VersionedTransaction;
  unsignedSerialized: string;
  signedSerialized: string;
  fromPubkey: PublicKey;
  toPubkey: PublicKey;
};

type SignatureValidationResult = {
  index: number;
  publicKey: string;
  signature: string;
  isValid: boolean;
  error?: string;
};

type ValidationResults = {
  isValid: boolean;
  signatures: SignatureValidationResult[];
  totalSignatures: number;
};

type HardcodedTransaction = {
  name: string;
  data: string;
};

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

const SIGNATURE_SIZE = 64; // Standard Ed25519 signature size
const SECTION_DIVIDER_LENGTH = 60;
const DUMMY_SIGNATURE_FILL = 1;

// Sample transaction configuration
const SAMPLE_TRANSACTION_CONFIG: TransactionConfig = {
  fromPubkey: "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
  toPubkey: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  lamports: 1000000, // 0.001 SOL
  recentBlockhash: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
};

// Test data for hardcoded transactions
const HARDCODED_TRANSACTIONS: HardcodedTransaction[] = [
  {
    name: "Multisig Transaction (unsigned)",
    data: "AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADoSLFl9dyzD/V5why4IAhA9DmehVEGtd/J2H5z59TH7F2aT6VddBcpXNXdxjMa8ISzbYI2lQwy701UMRtVm4gPAgAHDhaqcBc6ZUfakEx4TS038K5+u9T4e89PpFpJI7sGh9WTrAhDHH94cxz5YSb+w7xhmwJS+NRu52f4Ih8A1VJ/bJkgJhAewgMolkoyq6sTbFQFuR86447k9ky2veh5uGg40j/kLyGKSjFrD2O/6D7acbxCDzmWNOlIZblIcMNJ5Z6BdLwfuhyrGBFinifeaufVO2fDzjul6vawOHfN+M8IYGSjqljezIH2wT61QKKS63FxlHJpsR2c4m2NFSzgQAhMRwLsVE9HDck59M2MuvGmoFz06Gte/oDTVSycPUq+bb8nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAC0PMCi3T8KLzvCS5ybFyitIXec9h5Iog+RBxXKqC+3oG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQcowx/Lp2T6I5NWJlk9KDhksV8W/Y4smwWoasmtC9eGB1KXA+nRSCQN7RPXU1jOZSh4bUHdu8NydguyoXRQ/32nrRg5Q7LUHAtvw+hm82AIxobqFMq0zDvnfA40aDumigYHAQEMCAAAAAAAAAAAAAAACQAFAkANAwAJAAkDmDoAAAAAAAAHAgACDAIAAADoAwAAAAAAAAgGAAMECgcLAQENCgwGBAMABQELBw0JDHfBewAAAAAA",
  },
  {
    name: "Multisig Transaction (signed)",
    data: "Aq0UiY+MSKN4ARWLpIdtv58/Oi2h95EDFut+NsfUsjDg2EI5pyEEI1nA2FMHfDD4ePlFGWLyub0E10Sth5mBegvoSLFl9dyzD/V5why4IAhA9DmehVEGtd/J2H5z59TH7F2aT6VddBcpXNXdxjMa8ISzbYI2lQwy701UMRtVm4gPAgAHDhaqcBc6ZUfakEx4TS038K5+u9T4e89PpFpJI7sGh9WTrAhDHH94cxz5YSb+w7xhmwJS+NRu52f4Ih8A1VJ/bJkgJhAewgMolkoyq6sTbFQFuR86447k9ky2veh5uGg40j/kLyGKSjFrD2O/6D7acbxCDzmWNOlIZblIcMNJ5Z6BdLwfuhyrGBFinifeaufVO2fDzjul6vawOHfN+M8IYGSjqljezIH2wT61QKKS63FxlHJpsR2c4m2NFSzgQAhMRwLsVE9HDck59M2MuvGmoFz06Gte/oDTVSycPUq+bb8nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACMlyWPTiSJ8bs9ECkUjg2DC1oTmdr/EIQEjnvY2+n4WQMGRm/lIRcy/+ytunLDm+e8jOW7xfcSayxDmzpAAAAAC0PMCi3T8KLzvCS5ybFyitIXec9h5Iog+RBxXKqC+3oG3fbh12Whk9nL4UbO63msHLSF7V9bN5E6jPWFfv8AqQcowx/Lp2T6I5NWJlk9KDhksV8W/Y4smwWoasmtC9eGB1KXA+nRSCQN7RPXU1jOZSh4bUHdu8NydguyoXRQ/30kiMXKfXcKJze2Fb7kMth+sCgEGJYTI+DorTbCtnoj2gYHAQEMCAAAAAAAAAAAAAAACQAFAkANAwAJAAkDmDoAAAAAAAAHAgACDAIAAADoAwAAAAAAAAgGAAMECgcLAQENCgwGBAMABQELBw0JDHfBewAAAAAA",
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a section divider for console output
 * @param title - Optional title to display in the section
 * @returns Formatted section divider
 */
function createSectionDivider(title = ""): string {
  const divider = "=".repeat(SECTION_DIVIDER_LENGTH);
  return title ? `\n${divider}\n${title}\n${divider}` : `\n${divider}`;
}

/**
 * Validates input parameters for transaction creation
 * @param params - Parameters to validate
 * @returns True if valid, throws error if invalid
 */
function validateTransactionParams(params: TransactionConfig): boolean {
  const { fromPubkey, toPubkey, lamports, recentBlockhash } = params;

  if (
    !fromPubkey ||
    !toPubkey ||
    typeof lamports !== "number" ||
    !recentBlockhash
  ) {
    throw new Error("Invalid transaction parameters provided");
  }

  if (lamports <= 0) {
    throw new Error("Lamports amount must be positive");
  }

  return true;
}

/**
 * Creates a transfer instruction for a Solana transaction
 * @param fromPubkey - Source public key
 * @param toPubkey - Destination public key
 * @param lamports - Amount to transfer in lamports
 * @returns The transfer instruction
 */
function createTransferInstruction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  lamports: number,
): TransactionInstruction {
  return SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  });
}

/**
 * Creates a versioned transaction from instructions
 * @param payerKey - The payer's public key
 * @param recentBlockhash - Recent blockhash
 * @param instructions - Array of instructions
 * @returns The versioned transaction
 */
function createVersionedTransaction(
  payerKey: PublicKey,
  recentBlockhash: string,
  instructions: TransactionInstruction[],
): VersionedTransaction {
  const messageV0 = new TransactionMessage({
    payerKey,
    recentBlockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
}

/**
 * Serializes a transaction to base64 format
 * @param transaction - The transaction to serialize
 * @returns Base64 encoded transaction
 */
function serializeTransaction(transaction: VersionedTransaction): string {
  return Buffer.from(transaction.serialize()).toString("base64");
}

/**
 * Adds a dummy signature to a transaction for testing purposes
 * @param transaction - The transaction to sign
 * @param signerKey - The signer's public key
 */
function addDummySignature(
  transaction: VersionedTransaction,
  signerKey: PublicKey,
): void {
  if (!transaction || !signerKey) {
    throw new Error("Transaction and signerKey are required");
  }

  const dummySignature = new Uint8Array(SIGNATURE_SIZE).fill(
    DUMMY_SIGNATURE_FILL,
  );
  transaction.addSignature(signerKey, dummySignature);
}

/**
 * Creates a complete transaction workflow (create, serialize both unsigned and signed versions)
 * @param config - Transaction configuration
 * @returns Transaction workflow result
 */
function createCompleteTransaction(
  config: TransactionConfig,
): TransactionWorkflowResult {
  validateTransactionParams(config);

  const fromPubkey = new PublicKey(config.fromPubkey);
  const toPubkey = new PublicKey(config.toPubkey);

  // Create transaction
  const instructions = [
    createTransferInstruction(fromPubkey, toPubkey, config.lamports),
  ];
  const transaction = createVersionedTransaction(
    fromPubkey,
    config.recentBlockhash,
    instructions,
  );

  // Serialize unsigned transaction
  const unsignedSerialized = serializeTransaction(transaction);

  // Add dummy signature and serialize signed transaction
  addDummySignature(transaction, fromPubkey);
  const signedSerialized = serializeTransaction(transaction);

  return {
    transaction,
    unsignedSerialized,
    signedSerialized,
    fromPubkey,
    toPubkey,
  };
}

/**
 * Tests a transaction by deserializing and validating it
 * @param name - Name of the test
 * @param serializedData - Base64 serialized transaction data
 * @param includeDetailedAnalysis - Whether to include detailed signature analysis
 * @returns True if test passed, false otherwise
 */
function testTransaction(
  name: string,
  serializedData: string,
  includeDetailedAnalysis = false,
): boolean {
  console.log(createSectionDivider(`Testing: ${name}`));

  const transaction = deserializeTransaction(serializedData);

  if (!transaction) {
    console.log("❌ Failed to deserialize transaction");
    return false;
  }

  logTransactionInfo(
    `Successfully processed ${name.toLowerCase()}`,
    transaction,
    serializedData,
    true, // Include signature validation
    includeDetailedAnalysis,
  );

  return true;
}

/**
 * Validates a signature against a transaction message
 * @param signature - The signature to validate
 * @param message - The message that was signed
 * @param publicKey - The public key of the signer
 * @returns True if signature is valid, false otherwise
 */
function validateSignature(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: PublicKey,
): boolean {
  try {
    return nacl.sign.detached.verify(message, signature, publicKey.toBytes());
  } catch (error) {
    console.error(`Signature validation error: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Validates all signatures in a versioned transaction
 * @param transaction - The transaction to validate
 * @returns Validation results with overall status and individual signature results
 */
function validateAllSignatures(
  transaction: VersionedTransaction,
): ValidationResults {
  const message = transaction.message.serialize();
  const results: ValidationResults = {
    isValid: true,
    signatures: [],
    totalSignatures: transaction.signatures.length,
  };

  transaction.signatures.forEach((signature: Uint8Array, index: number) => {
    if (index < transaction.message.staticAccountKeys.length) {
      const publicKey = transaction.message.staticAccountKeys[index];
      const isValid = validateSignature(signature, message, publicKey);

      results.signatures.push({
        index: index + 1,
        publicKey: publicKey.toString(),
        signature: base58.encode(signature),
        isValid,
      });

      if (!isValid) {
        results.isValid = false;
      }
    } else {
      results.signatures.push({
        index: index + 1,
        publicKey: "N/A",
        signature: base58.encode(signature),
        isValid: false,
        error: "No corresponding public key found",
      });
      results.isValid = false;
    }
  });

  return results;
}

/**
 * Deserializes a base64 encoded transaction
 * @param serializedTransaction - Base64 encoded transaction
 * @returns Deserialized transaction or null if failed
 */
function deserializeTransaction(
  serializedTransaction: string,
): VersionedTransaction | null {
  try {
    return VersionedTransaction.deserialize(
      Buffer.from(serializedTransaction, "base64"),
    );
  } catch (error) {
    console.error(`Deserialization failed: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Logs transaction information in a formatted way
 * @param title - Title for the log section
 * @param transaction - The transaction to log
 * @param serializedTx - The serialized transaction string
 * @param includeSignatureValidation - Whether to include signature validation
 * @param includeDetailedAnalysis - Whether to include detailed signature analysis
 */
function logTransactionInfo(
  title: string,
  transaction: VersionedTransaction,
  serializedTx: string,
  includeSignatureValidation = false,
  includeDetailedAnalysis = false,
): void {
  console.log(`\n✅ ${title}`);
  console.log(`Serialized transaction (base64):`);
  console.log(serializedTx);
  console.log(`Transaction length: ${serializedTx.length} characters`);
  console.log(`Message version: ${transaction.message.version}`);
  console.log(
    `Number of instructions: ${transaction.message.compiledInstructions.length}`,
  );
  console.log(`Signature count: ${transaction.signatures.length}`);

  if (includeSignatureValidation && transaction.signatures.length > 0) {
    const validationResults = validateAllSignatures(transaction);
    console.log(
      `Overall signature validation: ${validationResults.isValid ? "✅ VALID" : "❌ INVALID"}`,
    );

    if (includeDetailedAnalysis) {
      // Detailed signature analysis
      console.log(`\n📋 Detailed Signature Analysis:`);
      console.log(`Total signatures: ${validationResults.totalSignatures}`);
      console.log(
        `Valid signatures: ${validationResults.signatures.filter((s) => s.isValid).length}`,
      );
      console.log(
        `Invalid signatures: ${validationResults.signatures.filter((s) => !s.isValid).length}`,
      );

      validationResults.signatures.forEach((sigResult) => {
        console.log(`\n  Signature ${sigResult.index}:`);
        console.log(
          `    Status: ${sigResult.isValid ? "✅ VALID" : "❌ INVALID"}`,
        );
        console.log(`    Public Key: ${sigResult.publicKey}`);
        console.log(`    Signature (base58): ${sigResult.signature}`);
        if (sigResult.error) {
          console.log(`    Error: ${sigResult.error}`);
        }
      });
    } else {
      // Simple signature validation display
      validationResults.signatures.forEach((sigResult) => {
        const status = sigResult.isValid ? "✅" : "❌";
        console.log(
          `  Signature ${sigResult.index}: ${status} ${sigResult.signature}`,
        );
        if (sigResult.error) {
          console.log(`    Error: ${sigResult.error}`);
        }
      });
    }
  } else if (
    includeSignatureValidation &&
    transaction.signatures.length === 0
  ) {
    console.log(
      `\n📋 No signatures found in transaction (unsigned transaction)`,
    );
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

// Create transactions using the improved utility functions
const transactionWorkflow = createCompleteTransaction(
  SAMPLE_TRANSACTION_CONFIG,
);

// Log transaction creation results
logTransactionInfo(
  "Successfully created serialized transaction!",
  transactionWorkflow.transaction,
  transactionWorkflow.unsignedSerialized,
  false,
);

logTransactionInfo(
  "Successfully created serialized transaction with signature!",
  transactionWorkflow.transaction,
  transactionWorkflow.signedSerialized,
  true,
);

// ============================================================================
// TRANSACTION VERIFICATION TESTS
// ============================================================================

// Test generated transactions
testTransaction(
  "Generated unsigned transaction verification",
  transactionWorkflow.unsignedSerialized,
);

testTransaction(
  "Generated signed transaction verification",
  transactionWorkflow.signedSerialized,
);

// Test hardcoded transactions with detailed analysis
HARDCODED_TRANSACTIONS.forEach((tx) => {
  testTransaction(tx.name, tx.data, true); // Include detailed analysis
});
