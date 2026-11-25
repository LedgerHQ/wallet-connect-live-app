import { BIP122_SIGNING_METHODS } from "@/data/methods/BIP122.methods";
import { COSMOS_SIGNING_METHODS } from "@/data/methods/Cosmos.methods";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { RIPPLE_SIGNING_METHODS } from "@/data/methods/Ripple.methods";
import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import { SUI_SIGNING_METHODS } from "@/data/methods/Sui.methods";
import { TEZOS_SIGNING_METHODS } from "@/data/methods/Tezos.methods";
import type {
  ConnectionEntry,
  TrackedConnectionEntry,
} from "@/store/connectionEntry.store";
import { getDappInfo, getSessionPairingTopic } from "@/utils/dappInfo";
import {
  RpcError,
  RpcErrorCode,
  ServerError,
} from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { ZodError } from "zod";
import { CANCELED_ERROR_NAMES, Errors } from "./utils";

export type TrackEvent = (
  eventName: string,
  eventProperties?: Record<string, unknown>,
) => void;

export const SignRequestEvent = {
  received: "sign_request_received",
  succeeded: "sign_request_succeeded",
  failed: "sign_request_failed",
  expired: "sign_request_expired",
} as const;

export const UNKNOWN_ERROR = "unknown";

const ERROR_MESSAGE_FORMATTED: Record<string, string> = {
  [Errors.userDecline]: "user_rejected",
  [Errors.txDeclined]: "transaction_declined",
  [Errors.msgDecline]: "message_declined",
  [Errors.unsupportedChains]: "unsupported_chains",
  [Errors.unsupportedMethods]: "unsupported_methods",
  [Errors.walletUpdateRequired]: "wallet_update_required",
};

export const formatErrorMessage = (message: string) =>
  ERROR_MESSAGE_FORMATTED[message] ?? UNKNOWN_ERROR;

const TRACKABLE_ERROR_NAMES: readonly string[] = [...CANCELED_ERROR_NAMES];

export type TrackingErrorFields = { error: string; error_extra?: string };

const getRpcCodeName = (error: RpcError) =>
  (RpcErrorCode[error.getCode()] as string | undefined)?.toLowerCase() ??
  UNKNOWN_ERROR;

export const getTrackingErrorFields = (error: unknown): TrackingErrorFields => {
  if (error instanceof ZodError) return { error: "ZodError" };
  if (error instanceof ServerError) {
    return { error: "ServerError", error_extra: error.getCode().toLowerCase() };
  }
  if (error instanceof RpcError) {
    return { error: "RpcError", error_extra: getRpcCodeName(error) };
  }
  if (error instanceof Error && TRACKABLE_ERROR_NAMES.includes(error.name)) {
    return { error: error.name };
  }
  return { error: UNKNOWN_ERROR };
};

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

type SessionRequestResponse = Parameters<
  IWalletKit["respondSessionRequest"]
>[0]["response"];

export type SignRequest = {
  topic: string;
  id: number;
  chainId: string;
  method: string;
};

export type SignRequestTracker = {
  walletKit: IWalletKit;
  setError: (error: unknown) => void;
};

type SettleableTracker = SignRequestTracker & { expire: () => void };

export type GetConnectionEntry = (
  pairingTopic: string,
) => ConnectionEntry | undefined;

export function createSignRequestTracking(
  walletKit: IWalletKit,
  track: TrackEvent,
  getEntry: GetConnectionEntry,
) {
  const pendingRequests = new Map<number, SettleableTracker>();

  const safeTrack: TrackEvent = (eventName, eventProperties) => {
    try {
      track(eventName, eventProperties);
    } catch (error) {
      console.error("Sign request tracking failed", error);
    }
  };

  const start = ({
    topic,
    id,
    chainId,
    method,
  }: SignRequest): SignRequestTracker => {
    const dapp = getDappInfo(walletKit, topic);
    const flowId = getSessionPairingTopic(walletKit, topic);
    const entry: TrackedConnectionEntry =
      (flowId === undefined ? undefined : getEntry(flowId)) ?? "unknown";
    const properties = {
      dapp: dapp.name,
      url: dapp.url,
      network: chainId,
      method,
      request_id: id,
      entry,
      flow_id: flowId,
    };
    const tracked = isSigningMethod(method);
    let settled = false;
    let trackingErrorFields: TrackingErrorFields | undefined;

    const settle = (
      eventName: string,
      outcomeProperties: Record<string, unknown> = {},
    ) => {
      if (settled) return;
      settled = true;
      pendingRequests.delete(id);
      if (tracked) {
        safeTrack(eventName, { ...properties, ...outcomeProperties });
      }
    };

    const onResponse = (response: SessionRequestResponse) => {
      if ("error" in response) {
        settle(SignRequestEvent.failed, {
          response_message: formatErrorMessage(response.error.message),
          response_code: response.error.code,
          ...trackingErrorFields,
        });
      } else {
        settle(SignRequestEvent.succeeded);
      }
    };

    const observedWalletKit = new Proxy(walletKit, {
      get(target, property) {
        if (property === "respondSessionRequest") {
          return async (
            params: Parameters<IWalletKit["respondSessionRequest"]>[0],
          ) => {
            const result = await target.respondSessionRequest(params);
            onResponse(params.response);
            return result;
          };
        }
        return Reflect.get(target, property) as unknown;
      },
    });

    const tracker: SettleableTracker = {
      walletKit: observedWalletKit,
      setError: (error) => {
        trackingErrorFields = getTrackingErrorFields(error);
      },
      expire: () => settle(SignRequestEvent.expired),
    };

    pendingRequests.set(id, tracker);
    if (tracked) {
      safeTrack(SignRequestEvent.received, properties);
    }
    return tracker;
  };

  const expire = (id: number) => {
    const tracker = pendingRequests.get(id);
    if (tracker) {
      tracker.expire();
    } else {
      safeTrack(SignRequestEvent.expired, { request_id: id });
    }
  };

  return { start, expire };
}
