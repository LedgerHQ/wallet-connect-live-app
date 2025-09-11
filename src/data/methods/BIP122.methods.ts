import { btcTransactionSchema } from "@/utils/converters";
import { z } from "zod";

/**
 * Methods
 */
export const BIP122_SIGNING_METHODS = {
  BIP122_SIGN_MESSAGE_LEGACY: "bip122_signMessage",
  BIP122_SIGN_MESSAGE: "signMessage",
  BIP122_SEND_TRANSFERT: "sendTransfer",
} as const;

export const bip122SignMessageLegacySchema = z.strictObject({
  message: z.string(),
  address: z.string(),
});

export const bip122SignMessageSchema = z.strictObject({
  message: z.string(),
  account: z.string(),
  address: z.string().optional(),
  protocol: z
    .union([z.literal("ecdsa"), z.literal("bip322"), z.literal("")])
    .optional(),
});

/**
 * Requests specs : https://docs.reown.com/advanced/multichain/rpc-reference/bitcoin-rpc
 */
export type BIP122_REQUESTS =
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE_LEGACY;
      params: z.infer<typeof bip122SignMessageLegacySchema>;
    }
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE;
      params: z.infer<typeof bip122SignMessageSchema>;
    }
  | {
      method: typeof BIP122_SIGNING_METHODS.BIP122_SEND_TRANSFERT;
      params: z.infer<typeof btcTransactionSchema>;
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
