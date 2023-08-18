import { StyleProvider } from '@ledgerhq/react-ui'
import type { ThemeNames } from '@ledgerhq/react-ui/styles'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { appWithTranslation } from 'next-i18next'
import { useEffect } from 'react'

import { appSelector, useAppStore } from '@/storage/app.store'
import GlobalStyle from '@/styles/globalStyle'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  const setTheme = useAppStore(appSelector.setTheme)
  const theme = useAppStore(appSelector.selectTheme)

  useEffect(() => {
    setTheme((router?.query?.theme as ThemeNames) || theme)
  }, [router?.query?.theme, setTheme, theme])

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <StyleProvider
        selectedPalette={theme as ThemeNames | undefined}
        fontsPath="/fonts"
      >
        <GlobalStyle />
        <Component {...pageProps} />
      </StyleProvider>
    </>
  )
}

export default appWithTranslation(MyApp)
