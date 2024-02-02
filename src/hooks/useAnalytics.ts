import { useCallback, useMemo } from "react";
import { WalletInfo } from "@ledgerhq/wallet-api-client";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { web3walletAtom } from "@/store/web3wallet.store";
import { useAtomValue } from "jotai";
import useSessions from "./useSessions";
import { useState } from "react";

const analyticsOptions = { ip: "0.0.0.0" };

let analytics: AnalyticsBrowser | undefined;

const APP_NAME = "Wallet Connect v2";
const version = import.meta.env.VITE_APP_VERSION;

export default function useAnalytics() {
  const [userId, setUserId] = useState<string>();
  const web3wallet = useAtomValue(web3walletAtom);
  const sessions = useSessions(web3wallet);
  const sessionsLength = sessions.data.length;

  const userProperties = useMemo(() => {
    return {
      sessionsConnected: sessionsLength,
      live_app: APP_NAME,
      live_app_version: version,
      userId,
    };
  }, [sessionsLength, userId]);

  const identify = useCallback(() => {
    if (!analytics) return;

    void analytics.identify(userId, userProperties, analyticsOptions);
  }, [userId, userProperties]);

  const start = useCallback(
    (userIdReceived?: string, walletInfo?: WalletInfo["result"]) => {
      if (analytics ?? !userIdReceived ?? !walletInfo) return;
      setUserId(userIdReceived);

      const walletName = walletInfo.wallet.name;

      let writeKey: string | undefined = undefined;
      if (walletName === "ledger-live-desktop") {
        writeKey = import.meta.env.VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP;
      } else if (walletName === "ledger-live-mobile") {
        writeKey = import.meta.env.VITE_PUBLIC_SEGMENT_API_KEY_MOBILE;
      }

      if (walletInfo.tracking && writeKey) {
        analytics = AnalyticsBrowser.load({ writeKey });
        identify();
      }
    },
    [identify]
  );

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

      const category = APP_NAME;

      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.page(category, pageName, allProperties, analyticsOptions);
    },
    [userProperties]
  );

  return useMemo(
    () => ({
      start,
      identify,
      track,
      page,
    }),
    [start, identify, track, page]
  );
}
