/**
 * Methods
 */
export const BIP122_SIGNING_METHODS = {
  BIP122_SIGN_MESSAGE: "signMessage",
  BIP122_SEND_TRANSFERT: "sendTransfer",
} as const;

/**
 * Requests
 */
export type BIP122_REQUESTS =
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE;
      params: {
        message: string;
        account: string;
        address: string;
      };
    }
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SEND_TRANSFERT;
      params: {
        account: string;
        recipientAddress: string;
        amount: string;
      };
    };
