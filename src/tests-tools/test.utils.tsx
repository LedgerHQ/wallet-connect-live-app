import { ReactElement } from "react";
import { act, render, RenderOptions } from "@testing-library/react";
import { StyleProvider } from "@ledgerhq/react-ui";
import userEvent from "@testing-library/user-event";
import { getWalletAPITransport } from "src/routes";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import GlobalStyle from "@/styles/globalStyle";
import { Container } from "@/styles/styles";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";

type PropsTheme = {
  children: React.ReactNode;
  theme?: "dark" | "light";
};

/**
 *
 * @param children Your component you want to render
 * @param theme Theme of your app, by default it's dark
 * @returns Your component wrapped with LedgerLive's StyleProvider
 */
const AllProviders = ({ children, theme = "dark" }: PropsTheme) => {
  return (
    <StyleProvider selectedPalette={theme} fontsPath="/fonts">
      {children}
    </StyleProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllProviders, ...options });

/**
 *
 * @param ui your ReactElement you want to render during test
 * @param options
 * @returns your component wrapped with theme and userEvent setuped
 */
const setupUserEventWithRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => ({
  user: userEvent.setup(),
  ...customRender(ui, options),
});

export * from "@testing-library/react";
export { setupUserEventWithRender as render };

const Root = () => {
  const transport = getWalletAPITransport();
  return (
    <StyleProvider selectedPalette={"dark"} fontsPath="/fonts">
      <WalletAPIProvider transport={transport}>
        <GlobalStyle />
        <Container>
          <Outlet />
        </Container>
      </WalletAPIProvider>
    </StyleProvider>
  );
};

function createTestRouter(component: () => JSX.Element) {
  const rootRoute = createRootRoute({
    component: Root,
  });

  const componentRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
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
export async function renderComponent(component: () => JSX.Element) {
  const router = createTestRouter(component);
  render(<RouterProvider router={router} />);
  await act(async () => {
    return router.navigate({
      to: "/",
    });
  });
  return router;
}

export { renderComponent as renderWithRouter };
