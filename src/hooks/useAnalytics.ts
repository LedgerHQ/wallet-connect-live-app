import { useCallback, useEffect, useMemo } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import useSessions from "./useSessions";
import {
  walletAPIuserIdAtom,
  walletAPIwalletInfoAtom,
} from "@/store/wallet-api.store";
import { analyticsWriteKeyAtom } from "@/store/analytics.store";

const analyticsOptions = { ip: "0.0.0.0" };

const APP_NAME = "Wallet Connect v2";
const version = import.meta.env.VITE_APP_VERSION;

export default function useAnalytics() {
  const web3wallet = useAtomValue(web3walletAtom);
  const sessions = useSessions(web3wallet);
  const sessionsLength = sessions.data.length;
  const { data: userId } = useAtomValue(walletAPIuserIdAtom);
  const { data: walletInfo } = useAtomValue(walletAPIwalletInfoAtom);
  const writeKey = useAtomValue(analyticsWriteKeyAtom);

  // Delayed Loading, benefits of not having to check for analytics in function calls
  // https://github.com/segmentio/analytics-next/tree/master/packages/browser#lazy--delayed-loading
  const analytics = useMemo(() => {
    return new AnalyticsBrowser();
  }, []);

  const userProperties = useMemo(() => {
    return {
      sessionsConnected: sessionsLength,
      live_app: APP_NAME,
      live_app_version: version,
      userId,
    };
  }, [sessionsLength, userId]);

  const identify = useCallback(() => {
    void analytics.identify(userId, userProperties, analyticsOptions);
  }, [analytics, userId, userProperties]);

  useEffect(() => {
    identify();
  }, [analytics, identify]);

  useEffect(() => {
    if (walletInfo.tracking && writeKey) {
      // NOTE: can only be called once !
      // https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#load

      analytics.load({ writeKey }); // destinations loaded, enqueued events are flushed
    }
  }, [analytics, walletInfo, writeKey]);

  const track = useCallback(
    (eventName: string, eventProperties?: Record<string, unknown>) => {
      console.log(`TRACKING - ${eventName}`);
      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.track(eventName, allProperties, analyticsOptions);
    },
    [analytics, userProperties]
  );

  const page = useCallback(
    (pageName: string, eventProperties?: Record<string, unknown>) => {
      const category = APP_NAME;

      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.page(category, pageName, allProperties, analyticsOptions);
    },
    [analytics, userProperties]
  );

  return useMemo(
    () => ({
      identify,
      page,
      track,
    }),
    [identify, page, track]
  );
}
