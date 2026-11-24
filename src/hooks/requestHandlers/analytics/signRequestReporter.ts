import { BIP122_SIGNING_METHODS } from "@/data/methods/BIP122.methods";
import { COSMOS_SIGNING_METHODS } from "@/data/methods/Cosmos.methods";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { RIPPLE_SIGNING_METHODS } from "@/data/methods/Ripple.methods";
import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import { SUI_SIGNING_METHODS } from "@/data/methods/Sui.methods";
import { TEZOS_SIGNING_METHODS } from "@/data/methods/Tezos.methods";
import { formatErrorMessage } from "./common";
import type { SessionRequestAnalyticsReporter } from "./types";

export const SignRequestEvent = {
  received: "sign_request_received",
  succeeded: "sign_request_succeeded",
  failed: "sign_request_failed",
  expired: "sign_request_expired",
} as const;

const SIGNING_METHODS: ReadonlySet<string> = new Set<string>([
  EIP155_SIGNING_METHODS.PERSONAL_SIGN,
  EIP155_SIGNING_METHODS.ETH_SIGN,
  EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
  EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA,
  EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
  EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
  EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
  ...Object.values(BIP122_SIGNING_METHODS),
  SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
  SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE,
  SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTIONS,
  SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION,
  RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION,
  TEZOS_SIGNING_METHODS.TEZOS_SEND,
  TEZOS_SIGNING_METHODS.TEZOS_SIGN,
  COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO,
  SUI_SIGNING_METHODS.SUI_SIGN_TRANSACTION,
  SUI_SIGNING_METHODS.SUI_SIGN_AND_EXECUTE_TRANSACTION,
  SUI_SIGNING_METHODS.SUI_SIGN_PERSONAL_MESSAGE,
]);

export const isSigningMethod = (method: string) => SIGNING_METHODS.has(method);

export const signRequestReporter: SessionRequestAnalyticsReporter = {
  supportsMethod: isSigningMethod,
  onStart(safeSendAnalytics, properties) {
    safeSendAnalytics(SignRequestEvent.received, properties);
  },
  onResponse(safeSendAnalytics, response, properties, error) {
    if ("error" in response) {
      safeSendAnalytics(SignRequestEvent.failed, {
        ...properties,
        response_message: formatErrorMessage(response.error.message),
        response_code: response.error.code,
        ...error,
      });
    } else {
      safeSendAnalytics(SignRequestEvent.succeeded, properties);
    }
  },
  onExpire(safeSendAnalytics, properties) {
    safeSendAnalytics(SignRequestEvent.expired, properties);
  },
};
