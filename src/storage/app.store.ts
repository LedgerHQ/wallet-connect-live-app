import { ThemeNames } from "@ledgerhq/react-ui/styles/index";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorageKeys } from "@/storage/types";

export type AppState = {
  theme: ThemeNames;
  setTheme: (theme: ThemeNames) => void;
};

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme: ThemeNames) => set(() => ({ theme: theme })),
    }),
    {
      name: StorageKeys.App,
    }
  )
);

const appSelector = {
  selectTheme: (state: AppState): ThemeNames => state.theme,
  setTheme: (state: AppState) => state.setTheme,
};

export { useAppStore, appSelector };
