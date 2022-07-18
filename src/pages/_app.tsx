import { useRouter } from 'next/router'
// import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import { StyleProvider } from '@ledgerhq/react-ui'
import { ThemeNames } from '@ledgerhq/react-ui/styles'
import GlobalStyle from '@/styles/globalStyle'

function MyApp({ Component, pageProps }: AppProps) {
	const router = useRouter()
	const { theme = "dark" } = router.query;

	return (
		<>
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

export default MyApp
