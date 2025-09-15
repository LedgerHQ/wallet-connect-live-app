import { z } from "zod";

/**
 * Methods
 */
export const SOLANA_SIGNING_METHODS = {
  SOLANA_GET_ACCOUNTS: "solana_getAccounts",
  SOLANA_REQUEST_ACCOUNTS: "solana_getAccounts",
  SOLANA_SIGN_TRANSACTION: "solana_signTransaction",
  SOLANA_SIGN_MESSAGE: "solana_signMessage",
  SOLANA_SIGN_ALL_TRANSACTIONS: "solana_signAllTransactions",
  SOLANA_SIGN_AND_SEND_TRANSACTION: "solana_signAndSendTransaction",
} as const;

export const solanaSignAndSendTransactionSchema = z.strictObject({
  transaction: z.string(),
  pubkey: z.string().optional(),
  sendOptions: z
    .strictObject({
      skipPreflight: z.boolean(),
      preflightCommitment: z.union([
        z.literal("processed"),
        z.literal("confirmed"),
        z.literal("finalized"),
        z.literal("recent"),
        z.literal("single"),
        z.literal("singleGossip"),
        z.literal("root"),
        z.literal("max"),
      ]),
      maxRetries: z.number(),
      minContextSlot: z.number(),
    })
    .optional(),
});

export const solanaSignAllTransactionsSchema = z.strictObject({
  transactions: z.array(z.string()),
});

export const solanaSignTransactionSchema = z.strictObject({
  transaction: z.string(),
  pubkey: z.string().optional(),
  // Deprecated fields not compatible with versioned transactions
  feePayer: z.string().optional(),
  instructions: z
    .array(
      z.strictObject({
        programId: z.string(),
        keys: z.array(
          z.strictObject({
            pubkey: z.string(),
            isSigner: z.boolean(),
            isWritable: z.boolean(),
          }),
        ),
        data: z.string().or(z.array(z.number())).optional(),
      }),
    )
    .optional(),
  recentBlockhash: z.string().optional(),
  signatures: z
    .array(
      z.strictObject({
        pubkey: z.string().optional(),
        publicKey: z.string().optional(),
        signature: z
          .string()
          .or(z.object({ type: z.string(), data: z.array(z.number()) }))
          .nullable()
          .optional(),
      }),
    )
    .optional(),
});

export const solanaSignMessageSchema = z.strictObject({
  message: z.string(),
  pubkey: z.string(),
});

/**
 * Requests specs: https://docs.walletconnect.com/advanced/multichain/rpc-reference/solana-rpc
 */
export type SOLANA_REQUESTS =
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION;
      params: z.infer<typeof solanaSignAndSendTransactionSchema>;
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTIONS;
      params: z.infer<typeof solanaSignAllTransactionsSchema>;
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION;
      params: z.infer<typeof solanaSignTransactionSchema>;
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE;
      params: z.infer<typeof solanaSignMessageSchema>;
    };

/**
 * Responses specs: https://docs.walletconnect.com/advanced/multichain/rpc-reference/solana-rpc
 */
export type SOLANA_RESPONSES = {
  [SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE]: {
    signature: string;
  };
  [SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION]: {
    signature: string;
    transaction?: string;
  };
  [SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTIONS]: {
    transactions: string[];
  };
  [SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION]: {
    signature: string;
  };
};
