/**
 * Methods
 */
export const BIP122_SIGNING_METHODS = {
  BIP122_SIGN_MESSAGE_LEGACY: "bip122_signMessage",
  BIP122_SIGN_MESSAGE: "signMessage",
  BIP122_SEND_TRANSFERT: "sendTransfer",
} as const;

/**
 * Requests specs : https://docs.reown.com/advanced/multichain/rpc-reference/bitcoin-rpc
 */
export type BIP122_REQUESTS =
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE_LEGACY;
      params: {
        message: string;
        address: string;
      };
    }
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE;
      params: {
        message: string;
        account: string;
        address?: string;
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

/**
 * Responses specs : https://docs.reown.com/advanced/multichain/rpc-reference/bitcoin-rpc
 */
export type BIP122_RESPONSES = {
  [BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE_LEGACY]: string;
  [BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE]: {
    address: string;
    signature: string;
    messageHash?: string;
  };
  [BIP122_SIGNING_METHODS.BIP122_SEND_TRANSFERT]: {
    txid: string;
  };
};
