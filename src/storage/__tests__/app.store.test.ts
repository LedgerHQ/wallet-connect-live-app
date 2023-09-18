import { renderHook, act } from "@testing-library/react";

import { useAppStore } from "../app.store";

describe("App Store", () => {
  it("Should have initial state ok", () => {
    const { result } = renderHook(() => useAppStore());
    const { theme } = result.current;

    expect(theme).toEqual("dark");
  });

  it("should setTheme", () => {
    const theme = "light";
    const { result } = renderHook(() => useAppStore());

    act(() => result.current.setTheme(theme));
    expect(result.current.theme).toEqual(theme);
  });
});
