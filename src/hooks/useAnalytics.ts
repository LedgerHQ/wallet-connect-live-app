import { useCallback, useEffect, useMemo } from "react";
import { AnalyticsBrowser } from "@segment/analytics-next";
import { walletKitAtom } from "@/store/walletKit.store";
import { atom, useAtomValue } from "jotai";
import useSessions from "./useSessions";
import { walletInfosAtom, walletUserIdAtom } from "@/store/wallet-api.store";

const analyticsOptions = { ip: "0.0.0.0" };

const APP_NAME = "Wallet Connect v2";
const version = import.meta.env.VITE_APP_VERSION;

const analyticsAtom = atom((get) => {
  const analytics = new AnalyticsBrowser();

  // Using .then instead of await to return instantly the analytics object
  // And not wait for the infos before allowing the user to move in the UI
  // Then load analytics only once when we get the infos
  void get(walletInfosAtom).then(({ wallet: { name }, tracking }) => {
    let writeKey: string | undefined;
    if (name === "ledger-live-desktop") {
      writeKey = import.meta.env.VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP;
    } else if (name === "ledger-live-mobile") {
      writeKey = import.meta.env.VITE_PUBLIC_SEGMENT_API_KEY_MOBILE;
    }

    if (tracking && writeKey) {
      analytics.load({ writeKey });
    }
  });

  // We have to return in an array or object to get the correct type in the end
  // Not sure what's happening, it's going to the implemented type of the base class `AnalyticsBuffered`
  // And then always shows `[Analytics, Context]` as the type when get the value with `useAtomValue`
  // Maybe related to the way jotai types the hook with the promise
  return [analytics];
});

export default function useAnalytics() {
  const [analytics] = useAtomValue(analyticsAtom);
  const userId = useAtomValue(walletUserIdAtom);
  const walletKit = useAtomValue(walletKitAtom);
  const sessions = useSessions(walletKit);
  const sessionsConnected = sessions.data.length;

  const userProperties = useMemo(() => {
    return {
      sessionsConnected,
      live_app: APP_NAME,
      live_app_version: version,
      userId,
    };
  }, [sessionsConnected, userId]);

  useEffect(() => {
    void analytics.identify(userId, userProperties, analyticsOptions);
  }, [analytics, userId, userProperties]);

  const track = useCallback(
    (eventName: string, eventProperties?: Record<string, unknown>) => {
      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.track(eventName, allProperties, analyticsOptions);
    },
    [analytics, userProperties],
  );

  const page = useCallback(
    (pageName: string, eventProperties?: Record<string, unknown>) => {
      const allProperties = {
        ...userProperties,
        ...eventProperties,
      };
      void analytics.page(APP_NAME, pageName, allProperties, analyticsOptions);
    },
    [analytics, userProperties],
  );

  return useMemo(
    () => ({
      track,
      page,
    }),
    [track, page],
  );
}
