import { ErrorFallback } from "@/components/screens/ErrorFallback";
import GlobalStyle from "@/styles/globalStyle";
import { Container } from "@/styles/styles";
import { Flex, ProgressLoader, StyleProvider } from "@ledgerhq/react-ui";
import { ErrorBoundary } from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, render, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactElement, Suspense } from "react";

type PropsTheme = {
  children: React.ReactNode;
  theme?: "dark" | "light";
};

const twentyFourHoursInMs = 1000 * 60 * 60 * 24;
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // refetchOnWindowFocus: false,
      // refetchOnMount: false,
      // refetchOnReconnect: false,
      staleTime: twentyFourHoursInMs,
      retry: false,
    },
  },
});

/**
 *
 * @param children Your component you want to render
 * @param theme Theme of your app, by default it's dark
 * @returns Your component wrapped with LedgerLive's StyleProvider
 */
const AllProviders = ({ children, theme = "dark" }: PropsTheme) => {
  return (
    <QueryClientProvider client={queryClient}>
      <StyleProvider selectedPalette={theme} fontsPath="/fonts">
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
          {children}
        </Suspense>
      </StyleProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllProviders, ...options });

/**
 *
 * @param ui your ReactElement you want to render during test
 * @param options
 * @returns your component wrapped with theme and userEvent setuped
 */
const setupUserEventWithRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => ({
  user: userEvent.setup(),
  ...customRender(ui, options),
});

export * from "@testing-library/react";
export { setupUserEventWithRender as render };

const Root = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <StyleProvider selectedPalette={"dark"} fontsPath="/fonts">
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
              <Outlet />
            </ErrorBoundary>
          </Suspense>
        </Container>
      </StyleProvider>
    </QueryClientProvider>
  );
};

function createTestRouter(component: () => JSX.Element, path = "/") {
  const rootRoute = createRootRoute({
    component: Root,
  });

  const componentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path,
    component,
  });

  const router = createRouter({
    routeTree: rootRoute.addChildren([componentRoute]),
    history: createMemoryHistory(),
  });

  return router;
}
// const _router = createTestRouter(() => <></>);

// export function renderComponent(component: typeof _router) {
export async function renderComponent(
  component: () => JSX.Element,
  path: "/" | "/connect" | "/protocol-not-supported" = "/",
) {
  const router = createTestRouter(component, path);
  render(<RouterProvider<typeof router> router={router} />);

  await act(() => {
    return router.navigate({
      to: path,
      search: (search) => ({
        theme: "dark",
        lang: "en",
        ...search,
      }),
    });
  });
  return router;
}

export { renderComponent as renderWithRouter };
