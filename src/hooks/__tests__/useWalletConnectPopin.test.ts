import useWalletConnectPopin from "@/hooks/useWalletConnectPopin";
import { act, renderHook } from "@/tests-tools/test.utils";

describe("useWalletConnectPopin", () => {
  it("should initialize isModalOpen as false", () => {
    const { result } = renderHook(() => useWalletConnectPopin());
    expect(result.current.isModalOpen).toBe(false);
  });

  it("should open the modal when openModal is called", () => {
    const { result } = renderHook(() => useWalletConnectPopin());
    act(() => result.current.openModal());
    expect(result.current.isModalOpen).toBe(true);
  });

  it("should close the modal when closeModal is called", () => {
    const { result } = renderHook(() => useWalletConnectPopin());
    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);
  });
});
