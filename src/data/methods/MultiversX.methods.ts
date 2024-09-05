import { MvxTransaction } from "@/utils/converters";

/**
 * Methods
 */
export const MULTIVERSX_SIGNING_METHODS = {
  MULTIVERSX_SIGN_TRANSACTION: "mvx_signTransaction",
  MULTIVERSX_SIGN_TRANSACTIONS: "mvx_signTransactions",
  MULTIVERSX_SIGN_MESSAGE: "mvx_signMessage",
} as const;

/**
 * Requests specs: https://specs.walletconnect.com/2.0/blockchain-rpc/multiversx-rpc#parameters-2
 */
export type MULTIVERSX_REQUESTS =
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_MESSAGE;
      params: {
        message: string;
        address: string;
      };
    }
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTION;
      params: {
        transaction: MvxTransaction;
      };
    }
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTIONS;
      params: {
        transactions: MvxTransaction[];
      };
    };
