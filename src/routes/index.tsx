import { Router, Route, RootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
import { Transport, WindowMessageTransport } from "@ledgerhq/wallet-api-client";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { InputMode } from "@/shared/types/types";
import { Container } from "@/styles/styles";
import {
  getSimulatorTransport,
  profiles,
} from "@ledgerhq/wallet-api-simulator";
// import useAnalytics from "@/hooks/common/useAnalytics";

// import {
//   getSimulatorTransport,
//   profiles,
// } from "@ledgerhq/wallet-api-simulator";

// const isSimulator =
//   typeof window === "undefined"
//     ? false
//     : new URLSearchParams(window.location.search).get("simulator");

export function getWalletAPITransport() {
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

let transport: Transport;
if (import.meta.env.VITE_TEST === "playwright") {
  transport = getSimulatorTransport(profiles.STANDARD);
} else {
  transport = getWalletAPITransport();
}

// Create a client
const queryClient = new QueryClient();

function Root() {
  const themeStored = useAppStore(appSelector.selectTheme);
  const setTheme = useAppStore(appSelector.setTheme);
  // TODO: we could probably use the search from tanstack router for lang and theme params
  const {
    i18n: { changeLanguage, language },
  } = useTranslation();

  // Migrate to analytics provider that will get the wallet-api infos by itself
  // const analytics = useAnalytics();

  // useEffect(() => {
  //   analytics.start(userId, walletInfo);
  // }, []);

  const { lang, theme } = rootRoute.useSearch();
  if (lang !== language) {
    changeLanguage(lang);
  }
  if ((theme == "dark" || theme == "light") && theme !== themeStored) {
    setTheme(theme);
  }

  const initialized = useInitialization();
  useWalletConnectEventsManager(initialized);

  return (
    <QueryClientProvider client={queryClient}>
      <StyleProvider selectedPalette={themeStored} fontsPath="/fonts">
        <WalletAPIProvider transport={transport}>
          <GlobalStyle />
          <Container>
            <Outlet />
          </Container>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </WalletAPIProvider>
      </StyleProvider>
    </QueryClientProvider>
  );
}

type RootSearch = {
  theme?: string;
  lang?: string;
};

// All providers should be declared here
export const rootRoute = new RootRoute({
  component: Root,
  validateSearch: (search: Record<string, unknown>): RootSearch => {
    const theme =
      search.theme && typeof search.theme === "string"
        ? search.theme
        : undefined;
    const lang =
      search.lang && typeof search.lang === "string" ? search.lang : undefined;

    return {
      theme,
      lang,
    };
  },
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
