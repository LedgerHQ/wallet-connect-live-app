import { XrpTransaction, xrpTransactionSchema } from "@/utils/converters";
import { z } from "zod";

/**
 * Methods
 */
export const RIPPLE_SIGNING_METHODS = {
  RIPPLE_SIGN_TRANSACTION: "xrpl_signTransaction",
} as const;

export const rippleSignTransactionSchema = z.object({
  tx_json: xrpTransactionSchema,
  autofill: z.boolean().optional(),
  submit: z.boolean().optional(),
});

/**
 * Requests specs: https://docs.reown.com/advanced/multichain/rpc-reference/xrpl-rpc
 */
export type RIPPLE_REQUESTS = {
  method: typeof RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION;
  params: z.infer<typeof rippleSignTransactionSchema>;
};

/**
 * Responses specs: https://docs.reown.com/advanced/multichain/rpc-reference/xrpl-rpc
 */
export type RIPPLE_RESPONSES = {
  [RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION]: {
    tx_json: XrpTransaction & { hash: string };
  };
};
