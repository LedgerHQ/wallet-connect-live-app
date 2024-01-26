import { Router, Route, RootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useTranslation } from "react-i18next";
import App from "@/components/screens/Home";
import { detailRoute } from "./detail";
import { proposalRoute } from "./proposalRoute";
import { protocolNotSupportedRoute } from "./protocolNotSupportedRoute";
import { appSelector, useAppStore } from "@/storage/app.store";
import { StyleProvider } from "@ledgerhq/react-ui";
import GlobalStyle from "@/styles/globalStyle";
import { TabsIndexes } from "@/shared/navigation";
import useInitialization from "@/hooks/useInitialization";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import { WindowMessageTransport } from "@ledgerhq/wallet-api-client";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { InputMode } from "@/shared/types/types";
import { Container } from "@/styles/styles";
// import useAnalytics from "@/hooks/common/useAnalytics";

// import {
//   getSimulatorTransport,
//   profiles,
// } from "@ledgerhq/wallet-api-simulator";

// const isSimulator =
//   typeof window === "undefined"
//     ? false
//     : new URLSearchParams(window.location.search).get("simulator");

function getWalletAPITransport() {
  if (typeof window === "undefined") {
    return {
      onMessage: undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      send: () => {},
    };
  }

  // if (isSimulator) {
  //   return getSimulatorTransport(profiles.STANDARD);
  // }

  const transport = new WindowMessageTransport();
  transport.connect();
  return transport;
}

const transport = getWalletAPITransport();

function Root() {
  const theme = useAppStore(appSelector.selectTheme);

  // Migrate to analytics provider that will get the wallet-api infos by itself
  // const analytics = useAnalytics();

  // useEffect(() => {
  //   analytics.start(userId, walletInfo);
  // }, []);

  // TODO: we could probably use the search from tanstack router for lang and theme params
  const {
    i18n: { changeLanguage, language },
  } = useTranslation();
  let params = new URL(document.location.href).searchParams;
  let lng = params.get("lang");
  if (!!lng && lng !== language) {
    changeLanguage(lng);
  }

  const initialized = useInitialization();
  useWalletConnectEventsManager(initialized);

  return (
    <StyleProvider selectedPalette={theme} fontsPath="/fonts">
      <WalletAPIProvider transport={transport}>
        <GlobalStyle />
        <Container>
          <Outlet />
        </Container>
        <TanStackRouterDevtools />
      </WalletAPIProvider>
    </StyleProvider>
  );
}

// All providers should be declared here
export const rootRoute = new RootRoute({
  component: Root,
});

type IndexSearch = {
  tab: TabsIndexes;
  uri?: string;
  mode?: InputMode;
};

// We could make everything lazy at the top to avoid download code for the app when disabled
const isApplicationDisabled = Boolean(
  import.meta.env.VITE_APPLICATION_DISABLED === "true"
);

export const indexRoute = new Route({
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
    if (isApplicationDisabled) {
      return <ApplicationDisabled />;
    }

    return <App />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  detailRoute,
  proposalRoute,
  protocolNotSupportedRoute,
]);

export const router = new Router({ routeTree });
