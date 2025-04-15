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
 * Requests 
 */
export type MULTIVERSX_REQUESTS =
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_MESSAGE;
      params: {
        message: string;
        account: string;
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

/**
 * Responses
 */
export type MULTIVERSX_RESPONSES = {
  [MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_MESSAGE]: {
    signature: string;
  };
  [MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTION]: {
    signature: string;
  };
  [MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTIONS]: {
    signatures: { signature: string }[];
  };
};
