import { getDappInfo } from "@/utils/dappInfo";
import type { IWalletKit } from "@reown/walletkit";
import { getSdkError } from "@walletconnect/utils";
import { useCallback, useEffect, useRef } from "react";
import { sessionRequestReporters } from "./requestHandlers/analytics";
import { toSessionError } from "./requestHandlers/analytics/common";
import { registerSessionErrorReporter } from "./requestHandlers/analytics/sessionErrorReporter";
import type {
  SafeAnalyticsCallback,
  SessionError,
  SessionRequest,
  SessionRequestAnalyticsReporter,
  SessionRequestResponse,
  TrackEvent,
} from "./requestHandlers/analytics/types";

const hasActiveSession = (walletKit: IWalletKit, topic: string) => {
  try {
    walletKit.engine.signClient.session.get(topic);
    return true;
  } catch {
    return false;
  }
};

export function useSessionRequestAnalytics(
  walletKit: IWalletKit,
  track: TrackEvent,
) {
  const trackRef = useRef(track);
  const pendingRequestsRef = useRef(new Map<number, () => void>());

  useEffect(() => {
    trackRef.current = track;
  }, [track]);

  const safeSendAnalytics: SafeAnalyticsCallback = useCallback(
    (eventName, eventProperties) => {
      try {
        trackRef.current(eventName, eventProperties);
      } catch (error) {
        console.error("Session request analytics failed", error);
      }
    },
    [],
  );

  const startSessionRequestAnalytics = useCallback(
    ({ topic, id, chainId, method }: SessionRequest) => {
      const pendingRequests = pendingRequestsRef.current;
      const dapp = getDappInfo(walletKit, topic);
      const properties = {
        dapp: dapp.name,
        url: dapp.url,
        network: chainId,
        method,
        request_id: id,
      };
      const reporters = sessionRequestReporters.filter((reporter) =>
        reporter.supportsMethod(method),
      );
      let settled = false;
      let sessionError: SessionError | undefined;

      const settle = (
        notify: (reporter: SessionRequestAnalyticsReporter) => void,
      ) => {
        if (settled) return;
        settled = true;
        if (pendingRequests.get(id) === expire) {
          pendingRequests.delete(id);
        }
        reporters.forEach(notify);
      };

      const expire = () =>
        settle((reporter) => reporter.onExpire(safeSendAnalytics, properties));

      const analyticsWalletKit = new Proxy(walletKit, {
        get(target, property) {
          if (property === "respondSessionRequest") {
            return async (
              params: Parameters<IWalletKit["respondSessionRequest"]>[0],
            ) => {
              const notifyResponse = (response: SessionRequestResponse) =>
                settle((reporter) =>
                  reporter.onResponse(
                    safeSendAnalytics,
                    response,
                    properties,
                    sessionError,
                  ),
                );
              const result = await target
                .respondSessionRequest(params)
                .catch((error: unknown) => {
                  if (!hasActiveSession(target, topic)) {
                    notifyResponse({
                      id,
                      jsonrpc: "2.0",
                      error: getSdkError("USER_DISCONNECTED"),
                    });
                  }
                  throw error;
                });
              notifyResponse(params.response);
              return result;
            };
          }
          return Reflect.get(target, property) as unknown;
        },
      });

      registerSessionErrorReporter(analyticsWalletKit, (error) => {
        sessionError = toSessionError(error);
      });

      pendingRequests.set(id, expire);
      reporters.forEach((reporter) =>
        reporter.onStart(safeSendAnalytics, properties),
      );

      return { analyticsWalletKit };
    },
    [walletKit, safeSendAnalytics],
  );

  const expireSessionRequestAnalytics = useCallback((id: number) => {
    pendingRequestsRef.current.get(id)?.();
  }, []);

  return { startSessionRequestAnalytics, expireSessionRequestAnalytics };
}
