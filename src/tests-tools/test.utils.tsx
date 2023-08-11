import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { StyleProvider } from '@ledgerhq/react-ui'
import userEvent from '@testing-library/user-event'

type PropsTheme = {
	children: React.ReactNode
	theme?: 'dark' | 'light'
}

const AllProviders = ({ children, theme = 'dark' }: PropsTheme) => {
	userEvent.setup()
	return (
		<StyleProvider selectedPalette={theme} fontsPath="/fonts">
			{children}
		</StyleProvider>
	)
}

const customRender = (
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
