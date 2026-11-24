import type { IWalletKit } from "@reown/walletkit";

export type TrackEvent = (
  eventName: string,
  eventProperties?: Record<string, unknown>,
) => void;

export type SessionRequestResponse = Parameters<
  IWalletKit["respondSessionRequest"]
>[0]["response"];

export type SessionRequest = {
  topic: string;
  id: number;
  chainId: string;
  method: string;
};

export type SessionRequestProperties = {
  dapp: string | undefined;
  url: string | undefined;
  network: string;
  method: string;
  request_id: number;
};

export type SafeAnalyticsCallback = (
  eventName: string,
  eventProperties: Record<string, unknown>,
) => void;

export type SessionError = { error: string; error_extra?: string };

export type SessionRequestAnalyticsReporter = {
  supportsMethod: (method: string) => boolean;
  onStart: (
    safeSendAnalytics: SafeAnalyticsCallback,
    properties: SessionRequestProperties,
  ) => void;
  onResponse: (
    safeSendAnalytics: SafeAnalyticsCallback,
    response: SessionRequestResponse,
    properties: SessionRequestProperties,
    error?: SessionError,
  ) => void;
  onExpire: (
    safeSendAnalytics: SafeAnalyticsCallback,
    properties: SessionRequestProperties,
  ) => void;
};
