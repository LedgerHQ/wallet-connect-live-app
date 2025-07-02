import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import base58 from "bs58";

// Create a sample transaction with a transfer instruction
const fromPubkey = new PublicKey(
  "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
); // Valid system program ID
const toPubkey = new PublicKey("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"); // Valid recipient address
const lamports = 1000000; // 0.001 SOL

// Create instructions for the transaction
const instructions = [
  // Add transfer instruction
  SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  }),
];

// Create a transaction message with a valid blockhash format
const recentBlockhash = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"; // Valid base58 blockhash
const messageV0 = new TransactionMessage({
  payerKey: fromPubkey,
  recentBlockhash,
  instructions,
}).compileToV0Message();

// Create a versioned transaction
const versionedTransaction = new VersionedTransaction(messageV0);

// Serialize the transaction to base64 format
const serializedTransaction = Buffer.from(
  versionedTransaction.serialize(),
).toString("base64");

// Add a dummy signature to the versioned transaction
// In a real application, you would sign with the actual private key
const dummySignature = new Uint8Array(64).fill(1); // 64-byte signature filled with ones
versionedTransaction.addSignature(fromPubkey, dummySignature);

// Serialize the transaction to base64 format
const serializedTransactionWithSignature = Buffer.from(
  versionedTransaction.serialize(),
).toString("base64");

console.log("✅ Successfully created serialized transaction!");
console.log("\nSerialized transaction (base64):");
console.log(serializedTransaction);
console.log(
  "\nTransaction length:",
  serializedTransaction.length,
  "characters",
);

console.log("✅ Successfully created serialized transaction with signature!");
console.log("\nSerialized transaction with signature (base64):");
console.log(serializedTransactionWithSignature);
console.log(
  "\nTransaction length:",
  serializedTransactionWithSignature.length,
  "characters",
);

// Verify by deserializing
try {
  const deserializedTx = VersionedTransaction.deserialize(
    Buffer.from(serializedTransaction, "base64"),
  );
  console.log("\n✅ Successfully deserialized transaction:");
  console.log("Message version:", deserializedTx.message.version);
  console.log(
    "Number of instructions:",
    deserializedTx.message.compiledInstructions.length,
  );
  console.log("Signature:", base58.encode(deserializedTx.signatures[0]));

  const deserializedTxWithSignature = VersionedTransaction.deserialize(
    Buffer.from(serializedTransactionWithSignature, "base64"),
  );
  console.log("\n✅ Successfully deserialized transaction with signature:");
  console.log("Message version:", deserializedTxWithSignature.message.version);
  console.log(
    "Number of instructions:",
    deserializedTxWithSignature.message.compiledInstructions.length,
  );
  console.log(
    "Signature:",
    base58.encode(deserializedTxWithSignature.signatures[0]),
  );
} catch (error) {
  if (error instanceof Error) {
    console.error("❌ Deserialization failed:", error.message);
  } else {
    console.error("❌ Deserialization failed with unknown error:", error);
  }
}
