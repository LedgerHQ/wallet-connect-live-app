import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SnackbarProvider } from "notistack";

import { Flex, ProgressLoader, StyleProvider } from "@ledgerhq/react-ui";
import GlobalStyle from "@/styles/globalStyle";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { Container } from "@/styles/styles";
import { ErrorFallback } from "@/components/screens/ErrorFallback";
import { ErrorBoundary } from "@sentry/react";
import { ThemeNames } from "@ledgerhq/react-ui/styles/index";
import { Suspense, useEffect } from "react";
import { InputMode } from "@/types/types";
import i18n from "@/i18n";
import { TanStackRouterDevtools } from "@/components/TanStackRouterDevtools";
import { WalletConnectInit } from "@/components/WalletConnectInit";
import {
  ConnectionNotification,
  ErrorNotification,
} from "@/components/atoms/Notification";

// Create a client
const twentyFourHoursInMs = 1000 * 60 * 60 * 24;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // refetchOnWindowFocus: false,
      // refetchOnMount: false,
      // refetchOnReconnect: false,
      staleTime: twentyFourHoursInMs,
    },
  },
});

// We could make everything lazy at the top to avoid downloading code for the app when disabled
const isApplicationDisabled = Boolean(
  import.meta.env.VITE_APPLICATION_DISABLED === "true",
);

type RootSearch = {
  theme: ThemeNames;
  lang: string;
  uri?: string;
  requestId?: string;
  sessionTopic?: string;
  mode?: InputMode;
};

// All providers should be declared here
export const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>): RootSearch => {
    // TODO use a validation lib instead of manually checking
    const theme =
      search.theme &&
      typeof search.theme === "string" &&
      (search.theme === "dark" || search.theme === "light")
        ? search.theme
        : "dark";

    const lang =
      search.lang && typeof search.lang === "string" ? search.lang : "en";

    const uri =
      search.uri && typeof search.uri === "string" ? search.uri : undefined;

    const requestId =
      search.requestId &&
      (typeof search.requestId === "string" ||
        typeof search.requestId === "number")
        ? search.requestId
        : undefined;

    const sessionTopic =
      search.sessionTopic && typeof search.sessionTopic === "string"
        ? search.sessionTopic
        : undefined;

    const mode =
      search.mode === "scan" || search.mode === "text"
        ? search.mode
        : undefined;

    return {
      theme,
      lang,
      uri,
      requestId: requestId?.toString(),
      sessionTopic,
      mode,
    };
  },
  component: function Root() {
    const { lang, theme, uri, requestId, sessionTopic } = rootRoute.useSearch();

    useEffect(() => {
      void i18n.changeLanguage(lang);
    }, [lang]);

    return (
      <QueryClientProvider client={queryClient}>
        <StyleProvider selectedPalette={theme} fontsPath="/fonts">
          <GlobalStyle />
          <Container>
            <Suspense
              fallback={
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  flex={1}
                >
                  <ProgressLoader infinite showPercentage={false} />
                </Flex>
              }
            >
              <ErrorBoundary fallback={<ErrorFallback />}>
                {isApplicationDisabled ? (
                  <ApplicationDisabled />
                ) : (
                  <SnackbarProvider
                    Components={{
                      errorNotification: ErrorNotification,
                      connectionNotification: ConnectionNotification,
                    }}
                  >
                    <WalletConnectInit
                      initialURI={uri}
                      initialRequestId={requestId}
                      initialSessionTopic={sessionTopic}
                    />
                    <Outlet />
                  </SnackbarProvider>
                )}
              </ErrorBoundary>
            </Suspense>
          </Container>
          <TanStackRouterDevtools />
          <ReactQueryDevtools />
        </StyleProvider>
      </QueryClientProvider>
    );
  },
});
