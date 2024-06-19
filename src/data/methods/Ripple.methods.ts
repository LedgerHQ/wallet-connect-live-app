import { XrpTransaction } from "@/utils/converters";

/**
 * Methods
 */
export const RIPPLE_SIGNING_METHODS = {
    RIPPLE_SIGN_TRANSACTION: "xrpl_signTransaction",
} as const;

/**
 * Requests specs: https://docs.walletconnect.com/advanced/multichain/rpc-reference/xrpl-rpc#xrpl_signtransaction
 */
export type RIPPLE_REQUESTS =
  | {
    method: typeof RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION;
    params: {
        tx_json: XrpTransaction
        autofill?: boolean;
        submit?: boolean;
    };
  }
  ;