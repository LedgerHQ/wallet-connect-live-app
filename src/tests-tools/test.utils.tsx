import { StyleProvider } from '@ledgerhq/react-ui'
import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import React from 'react'

type PropsTheme = {
  children: React.ReactNode
  theme?: 'dark' | 'light'
}

/**
 *
 * @param children Your component you want to render
 * @param theme Theme of your app, by default it's dark
 * @returns Your component wrapped with LedgerLive's StyleProvider
 */
const AllProviders = ({ children, theme = 'dark' }: PropsTheme) => {
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

/**
 *
 * @param ui your ReactElement you want to render during test
 * @param options
 * @returns your component wrapped with theme and userEvent setuped
 */
const setupUserEventWithRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => ({
  user: userEvent.setup(),
  ...customRender(ui, options),
})

export * from '@testing-library/react'
export { setupUserEventWithRender as render }
