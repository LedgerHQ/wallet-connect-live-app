import { useRouter } from 'next/router'
import Head from 'next/head'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import { StyleProvider } from '@ledgerhq/react-ui'
import { ThemeNames } from '@ledgerhq/react-ui/styles'
import GlobalStyle from '@/styles/globalStyle'

let initialTheme: ThemeNames

function MyApp({ Component, pageProps }: AppProps) {
	const router = useRouter()
	const theme = router?.query?.theme || initialTheme || 'dark'
	if (!initialTheme) {
		initialTheme = theme as ThemeNames
	}

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
