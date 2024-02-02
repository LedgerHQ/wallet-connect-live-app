import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Flex, ProgressLoader, StyleProvider } from "@ledgerhq/react-ui";
import GlobalStyle from "@/styles/globalStyle";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { Container } from "@/styles/styles";
import { ErrorFallback } from "@/components/screens/ErrorFallback";
import { ErrorBoundary } from "@sentry/react";
import { ThemeNames } from "@ledgerhq/react-ui/styles/index";
import { Suspense, lazy, useEffect } from "react";
import i18n from "@/i18n";
import { getWalletAPITransport } from "@/utils/wallet-api";

// eslint-disable-next-line react-refresh/only-export-components
const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null // Render nothing in production
  : lazy(() =>
      // Lazy load in development
      import("@tanstack/router-devtools").then((res) => ({
        default: res.TanStackRouterDevtools,
        // For Embedded Mode
        // default: res.TanStackRouterDevtoolsPanel
      }))
    );

const transport = getWalletAPITransport();

// Create a client
const queryClient = new QueryClient();

// We could make everything lazy at the top to avoid downloading code for the app when disabled
const isApplicationDisabled = Boolean(
  import.meta.env.VITE_APPLICATION_DISABLED === "true"
);

type RootSearch = {
  theme: ThemeNames;
  lang: string;
};

// All providers should be declared here
export const rootRoute = createRootRoute({
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
  component: function Root() {
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
                  {isApplicationDisabled ? <ApplicationDisabled /> : <Outlet />}
                </ErrorBoundary>
              </Suspense>
            </Container>
            <TanStackRouterDevtools />
            <ReactQueryDevtools />
          </WalletAPIProvider>
        </StyleProvider>
      </QueryClientProvider>
    );
  },
});
