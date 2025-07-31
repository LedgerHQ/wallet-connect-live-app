import { ethTransactionSchema } from "@/utils/converters";
import { z } from "zod";

/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

/**
 * Methods specs : https://docs.reown.com/advanced/multichain/rpc-reference/ethereum-rpc
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

export const ethSignSchema = z.tuple([z.string(), z.string()]);

export const ethSendTransactionSchema = z.tuple([ethTransactionSchema]);

export type EIP155_REQUESTS =
  | {
      method:
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN
        | typeof EIP155_SIGNING_METHODS.PERSONAL_SIGN
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4;
      params: z.infer<typeof ethSignSchema>;
    }
  | {
      method:
        | typeof EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION
        | typeof EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION;
      params: z.infer<typeof ethSendTransactionSchema>;
    };

/**
 * Responses specs : https://docs.reown.com/advanced/multichain/rpc-reference/ethereum-rpc
 */
export type EIP155_RESPONSES = {
  [EIP155_SIGNING_METHODS.ETH_SIGN]: string;
  [EIP155_SIGNING_METHODS.ETH_SIGN]: string;
  [EIP155_SIGNING_METHODS.PERSONAL_SIGN]: string;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA]: string;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3]: string;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4]: string;
  [EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION]: string;
  [EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION]: string;
};
