import type { ThemeNames } from '@ledgerhq/react-ui/styles'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  theme: ThemeNames
  setTheme: (theme: ThemeNames) => void
}

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set(() => ({ theme: theme })),
    }),
    {
      name: 'app-storage',
    },
  ),
)

const appSelector = {
  selectTheme: (state: AppState): ThemeNames => state.theme,
  setTheme: (state: AppState) => state.setTheme,
}

export { appSelector, useAppStore }
