import { z } from "zod";

/**
 * Methods
 */
export const SOLANA_SIGNING_METHODS = {
  SOLANA_GET_ACCOUNTS: "solana_getAccounts",
  SOLANA_REQUEST_ACCOUNTS: "solana_getAccounts",
  SOLANA_SIGN_TRANSACTION: "solana_signTransaction",
  SOLANA_SIGN_MESSAGE: "solana_signMessage",
  SOLANA_SIGN_ALL_TRANSACTION: "solana_signAllTransactions",
  SOLANA_SIGN_AND_SEND_TRANSACTION: "solana_signAndSendTransaction",
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
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION;
      params: {
        transaction: string;
        sendOptions: {
          skipPreflight: boolean;
          preflightCommitment:
            | "processed"
            | "confirmed"
            | "finalized"
            | "recent"
            | "single"
            | "singleGossip"
            | "root"
            | "max";
          maxRetries: number;
          minContextSlot: number;
        };
      };
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTION;
      params: {
        transactions: string[];
      };
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION;
      params: {
        transaction: string;
      };
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE;
      params: {
        message: string;
        pubkey: string;
      };
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
  };
  [SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTION]: {
    transactions: string[];
  };
  [SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION]: {
    signature: string;
  };
};
