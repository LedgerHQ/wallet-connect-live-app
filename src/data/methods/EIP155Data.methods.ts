/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

/**
 * Methods
 */
export const EIP155_SIGNING_METHODS = {
  PERSONAL_SIGN: "personal_sign",
  ETH_SIGN: "eth_sign",
  ETH_SIGN_TRANSACTION: "eth_signTransaction",
  ETH_SIGN_TYPED_DATA: "eth_signTypedData",
  ETH_SIGN_TYPED_DATA_V3: "eth_signTypedData_v3",
  ETH_SIGN_TYPED_DATA_V4: "eth_signTypedData_v4",
  ETH_SEND_TRANSACTION: "eth_sendTransaction",
  ETH_ACCOUNTS: "eth_accounts",
  ETH_REQUEST_ACCOUNTS: "eth_requestAccounts",
} as const;

export type EIP155_REQUESTS =
  | {
      method:
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN
        | typeof EIP155_SIGNING_METHODS.PERSONAL_SIGN
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4;
      params: [string, string];
    }
  | {
      method:
        | typeof EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION;
      params: [
        {
          from: string;
          to: string;
          data: string;
          gas: string;
          gasPrice: string;
          value: string;
          nonce: string;
        },
      ];
    };
