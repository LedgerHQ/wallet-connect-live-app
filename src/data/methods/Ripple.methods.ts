import { XrpTransaction } from "@/utils/converters";

/**
 * Methods
 */
export const RIPPLE_SIGNING_METHODS = {
  RIPPLE_SIGN_TRANSACTION: "xrpl_signTransaction",
} as const;

/**
 * Requests specs: https://docs.reown.com/advanced/multichain/rpc-reference/xrpl-rpc
 */
export type RIPPLE_REQUESTS = {
  method: typeof RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION;
  params: {
    tx_json: XrpTransaction;
    autofill?: boolean;
    submit?: boolean;
  };
};

/**
 * Responses specs: https://docs.reown.com/advanced/multichain/rpc-reference/xrpl-rpc
 */
export type RIPPLE_RESPONSES = {
  [RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION]: {
    tx_json: Record<string, unknown>;
  };
};
