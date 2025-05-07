/**
 * Methods
 */
export const SOLANA_SIGNING_METHODS = {
  SOLANA_GETACCOUNTS: "solana_getAccounts",
  SOLANA_REQUESTACCOUNTS: "solana_getAccounts",
  SOLANA_SIGNTRANSACTION: "solana_signTransaction",
  SOLANA_SIGNMESSAGE: "solana_signMessage",
} as const;

/**
 * Requests specs: https://docs.walletconnect.com/advanced/multichain/rpc-reference/solana-rpc
 */
export type SOLANA_REQUESTS =
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGNTRANSACTION;
      params: {
        transaction: string;
      };
    }
  | {
      method: typeof SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE;
      params: {
        message: string;
        pubkey: string;
      };
    };
