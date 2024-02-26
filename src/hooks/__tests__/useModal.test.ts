import useModal from "@/hooks/useModal";
import { act, renderHook } from "@/tests/test.utils";

describe("useModal", () => {
  it("should initialize isModalOpen as false", () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.isModalOpen).toBe(false);
  });

  it("should open the modal when openModal is called", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.openModal());
    expect(result.current.isModalOpen).toBe(true);
  });

  it("should close the modal when closeModal is called", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);
  });
});
