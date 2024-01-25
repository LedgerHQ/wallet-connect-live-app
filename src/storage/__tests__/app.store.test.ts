import { describe, expect, it } from 'vitest'
import { renderHook, act } from "@testing-library/react";

import { AppState, appSelector, useAppStore } from "../app.store";

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

  it("selectTheme should return the current theme", () => {
    const state: AppState = { theme: "light", setTheme: () => jest.fn() }; // Mocked state
    expect(appSelector.selectTheme(state)).toBe("light");
  });
});
