import { JsonObject } from "ripple-binary-codec/dist/types/serialized-type";
import { z } from "zod";

/**
 * Methods
 */
export const RIPPLE_SIGNING_METHODS = {
  RIPPLE_SIGN_TRANSACTION: "xrpl_signTransaction",
} as const;

export const rippleSignTransactionSchema = z.strictObject({
  // we only check that Account exists here
  // as it's the only mandatory field to find the account
  // the rest of the tx_json is not validated here
  tx_json: z.object({
    Account: z.string(),
  }),
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
    tx_json: JsonObject;
  };
};
