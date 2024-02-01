import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import App from "@/components/screens/App";
import { detailRoute } from "./detail";
import { proposalRoute } from "./proposalRoute";
import { protocolNotSupportedRoute } from "./protocolNotSupportedRoute";
import { StyleProvider } from "@ledgerhq/react-ui";
import GlobalStyle from "@/styles/globalStyle";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import { WindowMessageTransport } from "@ledgerhq/wallet-api-client";
import useWalletConnectEventsManager from "@/hooks/useWalletConnectEventsManager";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { InputMode } from "@/types/types";
import { Container } from "@/styles/styles";
import { ErrorFallback } from "@/components/screens/ErrorFallback";
import { ErrorBoundary } from "@sentry/react";
import { ThemeNames } from "@ledgerhq/react-ui/styles/index";
import { useEffect } from "react";
import i18n from "@/i18n";
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

  // if (import.meta.env.VITE_TEST === "playwright") {
  // return getSimulatorTransport(profiles.STANDARD);
  // }

  const transport = new WindowMessageTransport();
  transport.connect();
  return transport;
}

const transport = getWalletAPITransport();

// Create a client
const queryClient = new QueryClient();

// We could make everything lazy at the top to avoid downloading code for the app when disabled
const isApplicationDisabled = Boolean(
  import.meta.env.VITE_APPLICATION_DISABLED === "true"
);

function Root() {
  const { lang, theme } = rootRoute.useSearch();

  useEffect(() => {
    void i18n.changeLanguage(lang);
  }, [lang]);

  return (
    <QueryClientProvider client={queryClient}>
      <StyleProvider selectedPalette={theme} fontsPath="/fonts">
        <WalletAPIProvider transport={transport}>
          <GlobalStyle />
          <Container>
            <ErrorBoundary fallback={<ErrorFallback />}>
              {isApplicationDisabled ? <ApplicationDisabled /> : <Outlet />}
            </ErrorBoundary>
          </Container>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </WalletAPIProvider>
      </StyleProvider>
    </QueryClientProvider>
  );
}

type RootSearch = {
  theme: ThemeNames;
  lang: string;
};

// All providers should be declared here
export const rootRoute = createRootRoute({
  component: Root,
  validateSearch: (search: Record<string, unknown>): RootSearch => {
    const theme =
      search.theme &&
      typeof search.theme === "string" &&
      (search.theme === "dark" || search.theme === "light")
        ? search.theme
        : "dark";
    const lang =
      search.lang && typeof search.lang === "string" ? search.lang : "en";

    return {
      theme,
      lang,
    };
  },
});

export enum TabsIndexes {
  Connect = 0,
  Sessions = 1,
}

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
    useWalletConnectEventsManager();

    // Migrate to analytics provider that will get the wallet-api infos by itself
    // const analytics = useAnalytics();

    // useEffect(() => {
    //   analytics.start(userId, walletInfo);
    // }, []);

    return <App />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  detailRoute,
  proposalRoute,
  protocolNotSupportedRoute,
]);

export const router = createRouter({ routeTree });
