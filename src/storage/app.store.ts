import { NetworkConfig } from '@/types/types'
import { ThemeNames } from '@ledgerhq/react-ui/styles'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
	networks: NetworkConfig[]
	addNetworks: (networks: NetworkConfig[]) => void
	clearAppStore: () => void
	theme: ThemeNames
	setTheme: (theme: ThemeNames) => void
	isFromLedgerLive: boolean
	setFromLedgerLive: (isFromLedgerLive: boolean) => void
}

const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			networks: [],
			theme: 'dark',
			isFromLedgerLive: false,
			addNetworks: (networks) => set(() => ({ networks: networks })),
			setTheme: (theme) => set(() => ({ theme: theme })),
			setFromLedgerLive: (isFromLedgerLive) =>
				set(() => ({ isFromLedgerLive: isFromLedgerLive })),
			clearAppStore: () => set(() => ({ networks: [] })),
		}),
		{
			name: 'app-storage',
		},
	),
)

const appSelector = {
	selectNetworks: (state: AppState): NetworkConfig[] => state.networks,
	selectTheme: (state: AppState): ThemeNames => state.theme,
	addNetworks: (state: AppState) => state.addNetworks,
	setTheme: (state: AppState) => state.setTheme,
	clearAppStore: (state: AppState) => state.clearAppStore,
	selectIsFromLedgerLive: (state: AppState): boolean =>
		state.isFromLedgerLive,
	setFromLedgerLive: (state: AppState) => state.setFromLedgerLive,
}

export { useAppStore, appSelector }
