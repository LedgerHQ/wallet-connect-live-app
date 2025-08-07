import { z } from "zod";

/**
 * Methods
 */
export const SOLANA_SIGNING_METHODS = {
  SOLANA_GET_ACCOUNTS: "solana_getAccounts",
  SOLANA_REQUEST_ACCOUNTS: "solana_getAccounts",
  SOLANA_SIGN_TRANSACTION: "solana_signTransaction",
  SOLANA_SIGN_MESSAGE: "solana_signMessage",
} as const;

export const solanaSignTransactionSchema = z.object({
  transaction: z.string(),
});

export const solanaSignMessageSchema = z.object({
  message: z.string(),
  pubkey: z.string(),
});

/**
 * Requests specs: https://docs.walletconnect.com/advanced/multichain/rpc-reference/solana-rpc
 */
export type SOLANA_REQUESTS =
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION;
      params: z.infer<typeof solanaSignTransactionSchema>;
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE;
      params: z.infer<typeof solanaSignMessageSchema>;
    };
