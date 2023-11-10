import { useRouter } from "next/router";
import Head from "next/head";
import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import { StyleProvider } from "@ledgerhq/react-ui";
import { ThemeNames } from "@ledgerhq/react-ui/styles";
import GlobalStyle from "@/styles/globalStyle";
import { useEffect } from "react";
import { useAppStore, appSelector } from "@/storage/app.store";
import { ErrorFallback } from "@/components/screens/errors/errorFallback";
import { ErrorBoundary } from "@sentry/nextjs";
import useHydratation from "@/hooks/useHydratation";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { initialized } = useHydratation();

  const setTheme = useAppStore(appSelector.setTheme);
  const theme = useAppStore(appSelector.selectTheme);

  useEffect(() => {
    setTheme((router?.query?.theme as ThemeNames) ?? theme);
  }, [router?.query?.theme]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <StyleProvider selectedPalette={theme as ThemeNames | undefined} fontsPath="/fonts">
        <GlobalStyle />
        <ErrorBoundary fallback={<ErrorFallback />}>
          <Component {...pageProps} initialized={initialized} />
        </ErrorBoundary>
      </StyleProvider>
    </>
  );
}

export default appWithTranslation(MyApp);
