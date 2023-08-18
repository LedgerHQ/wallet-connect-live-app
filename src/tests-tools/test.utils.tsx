import React, { ReactElement } from "react"
import { render, RenderOptions } from "@testing-library/react"
import { StyleProvider } from "@ledgerhq/react-ui"
import userEvent from "@testing-library/user-event"

type PropsTheme = {
  children: React.ReactNode
  theme?: "dark" | "light"
}

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
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) =>
  render(ui, { wrapper: AllProviders, ...options })

/**
 *
 * @param ui your ReactElement you want to render during test
 * @param options
 * @returns your component wrapped with theme and userEvent setuped
 */
const setupUserEventWithRender = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => ({
  user: userEvent.setup(),
  ...customRender(ui, options),
})

export * from "@testing-library/react"
export { setupUserEventWithRender as render }
