import { createRoute } from "@tanstack/react-router";
import App from "@/components/screens/App";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { InputMode } from "@/types/types";
import { TabsIndexes } from "@/types/types";
import { rootRoute } from "@/routes/root";
// import useAnalytics from "@/hooks/common/useAnalytics";

type IndexSearch = {
  tab: TabsIndexes;
  uri?: string;
  mode?: InputMode;
};

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): IndexSearch => {
    // validate and parse the search params into a typed state

    const tab = search.tab ? Number(search.tab) : TabsIndexes.Connect;

    const uri =
      search.uri && typeof search.uri === "string" ? search.uri : undefined;

    const mode =
      search.mode === "scan" || search.mode === "text"
        ? search.mode
        : undefined;

    return {
      tab,
      uri,
      mode,
    };
  },
  component: function Index() {
    const { tab, uri, mode } = indexRoute.useSearch();
    useWalletConnectEventsManager();

    // TODO Migrate to analytics provider or jotai atom that will get the wallet-api infos by itself
    // const analytics = useAnalytics();

    // useEffect(() => {
    //   analytics.start(userId, walletInfo);
    // }, []);

    return <App tab={tab} mode={mode} initialURI={uri} />;
  },
});
