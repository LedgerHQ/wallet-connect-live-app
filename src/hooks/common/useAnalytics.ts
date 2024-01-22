import { useCallback, useMemo } from "react";
import { WalletInfo } from "@ledgerhq/wallet-api-client";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store";

const analyticsOptions = { ip: "0.0.0.0" };

let analytics: AnalyticsBrowser | undefined;
let userId: string | undefined;

export default function useAnalytics() {
  const sessions = useSessionsStore(sessionSelector.selectSessions);
  const version = import.meta.env.VITE_APP_VERSION;

  const userProperties = useMemo(() => {
    return {
      sessionsConnected: sessions?.length ?? 0,
      live_app: "Wallet Connect v2",
      live_app_version: version,
      userId,
    };
  }, [sessions?.length, userId, version]);

  const start = useCallback(
    (userIdReceived?: string, walletInfo?: WalletInfo["result"]) => {
      if (analytics ?? !userIdReceived ?? !walletInfo) return;
      userId = userIdReceived;

      const walletName = walletInfo.wallet.name;

      let writeKey: string | undefined = undefined;
      if (walletName === "ledger-live-desktop") {
        writeKey = process.env.NEXT_PUBLIC_SEGMENT_API_KEY_DESKTOP;
      } else if (walletName === "ledger-live-mobile") {
        writeKey = process.env.NEXT_PUBLIC_SEGMENT_API_KEY_MOBILE;
      }

      if (walletInfo.tracking && writeKey) {
        analytics = AnalyticsBrowser.load({ writeKey });
        identify();
      }
    },
    []
  );

  const identify = useCallback(() => {
    if (!analytics) return;

    void analytics.identify(userId, userProperties, analyticsOptions);
  }, [userId, userProperties]);

  const track = useCallback(
    (eventName: string, eventProperties?: Record<string, unknown>) => {
      if (!analytics) return;

      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.track(eventName, allProperties, analyticsOptions);
    },
    [userProperties]
  );

  const page = useCallback(
    (pageName: string, eventProperties?: Record<string, unknown>) => {
      if (!analytics) return;

      const category = "Wallet Connect v2";

      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.page(category, pageName, allProperties, analyticsOptions);
    },
    [userProperties]
  );

  return {
    start,
    identify,
    track,
    page,
  };
}
