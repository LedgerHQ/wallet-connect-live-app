import { Router, Route, RootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import App from "@/components/screens";
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
  const initialized = useInitialization();
  useWalletConnectEventsManager(initialized);

  return (
    <StyleProvider selectedPalette={theme} fontsPath="/fonts">
      <WalletAPIProvider transport={transport}>
        <GlobalStyle />
        <Outlet />
        <TanStackRouterDevtools />
      </WalletAPIProvider>
    </StyleProvider>
  );
}

// All providers should be declared here
export const rootRoute = new RootRoute({
  component: Root,
});

const walletInfo = {
  tracking: false,
  wallet: {
    name: "test",
    version: "test",
  },
};

type IndexSearch = {
  tab?: TabsIndexes;
};

export const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): IndexSearch => {
    // validate and parse the search params into a typed state
    return {
      tab: Number(search.tab ?? TabsIndexes.Connect),
    };
  },
  component: function Index() {
    return <App accounts={[]} userId="" walletInfo={walletInfo} />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  detailRoute,
  proposalRoute,
  protocolNotSupportedRoute,
]);

export const router = new Router({ routeTree });
