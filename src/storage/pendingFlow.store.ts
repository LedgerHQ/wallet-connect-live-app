import { PendingFlow } from "@/types/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorageKeys } from "@/storage/types";

type PendingFlowState = {
  pendingFlow: PendingFlow | undefined;
  addPendingFlow: (pendingFlow: PendingFlow) => void;
  clearPendingFlow: () => void;
};

const usePendingFlowStore = create<PendingFlowState>()(
  persist(
    (set) => ({
      pendingFlow: undefined,
      addPendingFlow: (pendingFlow: PendingFlow) =>
        set(() => ({ pendingFlow })),
      clearPendingFlow: () => set(() => ({ pendingFlow: undefined })),
    }),
    {
      name: StorageKeys.PendingFlow,
    }
  )
);

const pendingFlowSelector = {
  selectPendingFlow: (state: PendingFlowState): PendingFlow | undefined =>
    state.pendingFlow,
  addPendingFlow: (state: PendingFlowState) => state.addPendingFlow,
  clearPendingFlow: (state: PendingFlowState) => state.clearPendingFlow,
};

export { usePendingFlowStore, pendingFlowSelector };
