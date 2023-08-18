import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { PendingFlow } from '@/types/types'

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

export { pendingFlowSelector, usePendingFlowStore }
