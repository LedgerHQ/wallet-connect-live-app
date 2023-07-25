import { StyleProvider } from '@ledgerhq/react-ui'

type PropsTheme = {
	children: React.ReactElement
	theme?: 'dark' | 'light'
}
export function MockTheme({ children, theme = 'dark' }: PropsTheme) {
	return (
		<StyleProvider selectedPalette={theme} fontsPath="/fonts">
			{children}
		</StyleProvider>
	)
}
