import { NetworkConfig } from '@/types/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
	networks: NetworkConfig[]
	addNetworks: (networks: NetworkConfig[]) => void
	clearAppStore: () => void
}

const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			networks: [],
			addNetworks: (networks) => set(() => ({ networks: networks })),
			clearAppStore: () => set(() => ({ networks: [] })),
		}),
		{
			name: 'app-storage',
		},
	),
)

const appSelector = {
	selectNetworks: (state: AppState): NetworkConfig[] => state.networks,
	addNetworks: (state: AppState) => state.addNetworks,
	clearAppStore: (state: AppState) => state.clearAppStore,
}

export { useAppStore, appSelector }
