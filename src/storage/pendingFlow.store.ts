import { EthTransaction } from '@/helpers/converters'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type PendingFlow = {
	id: number
	topic: string
	accountId: string
	message?: string
	isHex?: boolean
	ethTx?: EthTransaction
	// Boolean set to true if the tx had some data before storing it in the localStorage
	// We can then check if we still have some data once we retrieve it from the storage
	// and only trigger the signAndBroadcast transaction flow if the data is still there
	txHadSomeData?: boolean
}

interface PendingFlowState {
	pendingFlow: PendingFlow | undefined
	addPendingFlow: (pendingFlow: PendingFlow) => void
	clearPendingFlow: () => void
}

const usePendingFlowStore = create<PendingFlowState>()(
	persist(
		(set) => ({
			pendingFlow: undefined,
			addPendingFlow: (pendingFlow: PendingFlow) =>
				set(() => ({ pendingFlow })),
			clearPendingFlow: () => set(() => ({ pendingFlow: undefined })),
		}),
		{
			name: 'pending-flow-storage',
		},
	),
)

const pendingFlowSelector = {
	selectPendingFlow: (state: PendingFlowState): PendingFlow | undefined =>
		state.pendingFlow,
	addPendingFlow: (state: PendingFlowState) => state.addPendingFlow,
	clearPendingFlow: (state: PendingFlowState) => state.clearPendingFlow,
}

export { usePendingFlowStore, pendingFlowSelector }
