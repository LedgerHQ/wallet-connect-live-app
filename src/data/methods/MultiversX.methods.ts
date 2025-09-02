import { mvxTransactionSchema } from "@/utils/converters";
import { z } from "zod";

/**
 * Methods
 */
export const MULTIVERSX_SIGNING_METHODS = {
  MULTIVERSX_SIGN_TRANSACTION: "mvx_signTransaction",
  MULTIVERSX_SIGN_TRANSACTIONS: "mvx_signTransactions",
  MULTIVERSX_SIGN_MESSAGE: "mvx_signMessage",
} as const;

export const multiversxSignMessageSchema = z.strictObject({
  message: z.string(),
  account: z.string(),
  address: z.string(),
});

export const multiversxSignTransactionSchema = z.strictObject({
  transaction: mvxTransactionSchema,
});

export const multiversxSignTransactionsSchema = z.strictObject({
  transactions: z.array(mvxTransactionSchema),
});

/**
 * Requests
 */
export type MULTIVERSX_REQUESTS =
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_MESSAGE;
      params: z.infer<typeof multiversxSignMessageSchema>;
    }
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTION;
      params: z.infer<typeof multiversxSignTransactionSchema>;
    }
  | {
      method: typeof MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTIONS;
      params: z.infer<typeof multiversxSignTransactionsSchema>;
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
