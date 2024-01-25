import { describe, expect, it } from 'vitest'
import { act, renderHook } from "@testing-library/react";

import { usePendingFlowStore } from "../pendingFlow.store";
import { PENDING_FLOW_MOCK } from "@/tests-tools/mocks/pendingFlow.mock";

describe("PendingFlow Store", () => {
  it("Should have initial state ok", () => {
    const { result } = renderHook(() => usePendingFlowStore());
    const { pendingFlow } = result.current;

    expect(pendingFlow).toBeUndefined();
  });

  it("should addPendingFlow", async () => {
    const { result } = renderHook(() => usePendingFlowStore());

    act(() => result.current.addPendingFlow(PENDING_FLOW_MOCK));
    expect(result.current.pendingFlow).toEqual(PENDING_FLOW_MOCK);
  });
  it("should clearPendingFlow", () => {
    const { result } = renderHook(() => usePendingFlowStore());

    act(() => result.current.addPendingFlow(PENDING_FLOW_MOCK));
    expect(result.current.pendingFlow).not.toBeUndefined();

    act(() => result.current.clearPendingFlow());
    expect(result.current.pendingFlow).toBeUndefined();
  });
});
