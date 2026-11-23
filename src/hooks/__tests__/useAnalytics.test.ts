import { createHookWrapper } from "@/tests/hook-test.utils";
import { renderHook, waitFor } from "@/tests/test.utils";
import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { identify, track, page, load, walletInfo } = vi.hoisted(() => ({
  identify: vi.fn(),
  track: vi.fn(),
  page: vi.fn(),
  load: vi.fn(),
  walletInfo: { current: { name: "ledger-live-desktop", tracking: false } },
}));

vi.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: vi.fn(() => ({ identify, track, page, load })),
}));

vi.mock("@/store/wallet-api.store", async () => {
  const { atom } = await import("jotai");
  return {
    walletInfoAtom: atom(() =>
      Promise.resolve({
        tracking: walletInfo.current.tracking,
        wallet: { name: walletInfo.current.name, version: "1.0.0" },
      }),
    ),
    walletUserIdAtom: atom(() => Promise.resolve("user-id")),
  };
});

vi.mock("@/store/walletKit.store", async () => {
  const { atom } = await import("jotai");
  return { walletKitAtom: atom({}) };
});

vi.mock("../useSessions", () => ({
  default: vi.fn(() => ({ data: [{}, {}] })),
}));

const { default: useAnalytics } = await import("../useAnalytics");

const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Electron/31.0.0 Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

function renderUseAnalytics(
  walletName: string,
  userAgent: string,
  tracking = false,
) {
  walletInfo.current.name = walletName;
  walletInfo.current.tracking = tracking;
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(userAgent);
  const store = createStore();
  return renderHook(() => useAnalytics(), {
    wrapper: createHookWrapper(store),
  });
}

const baseProperties = {
  sessionsConnected: 2,
  live_app: "Wallet Connect v2",
  live_app_version: import.meta.env.VITE_APP_VERSION,
  userId: "user-id",
};

const analyticsOptions = { ip: "0.0.0.0" };

describe("useAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it.each([
    ["ledger-live-desktop", "VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP"],
    ["ledger-live-mobile", "VITE_PUBLIC_SEGMENT_API_KEY_MOBILE"],
  ])(
    "loads segment for %s with %s when tracking is enabled",
    async (walletName, envKey) => {
      vi.stubEnv(envKey, "write-key");

      renderUseAnalytics(walletName, MAC_UA, true);

      await waitFor(() =>
        expect(load).toHaveBeenCalledWith({ writeKey: "write-key" }),
      );
    },
  );

  it("does not load segment when tracking is disabled", async () => {
    vi.stubEnv("VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP", "write-key");

    renderUseAnalytics("ledger-live-desktop", MAC_UA);

    await waitFor(() => expect(identify).toHaveBeenCalled());
    expect(load).not.toHaveBeenCalled();
  });

  describe("on Ledger Wallet Desktop", () => {
    const desktopProperties = {
      ...baseProperties,
      platform: "desktop",
      osType: "Darwin",
    };

    it("identifies the user with platform and osType", async () => {
      renderUseAnalytics("ledger-live-desktop", MAC_UA);

      await waitFor(() =>
        expect(identify).toHaveBeenCalledWith(
          "user-id",
          desktopProperties,
          analyticsOptions,
        ),
      );
    });

    it("tracks events with platform and osType", async () => {
      const { result } = renderUseAnalytics("ledger-live-desktop", MAC_UA);
      await waitFor(() => expect(result.current).not.toBeNull());

      result.current.track("button_clicked", { button: "connect" });

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        { ...desktopProperties, button: "connect" },
        analyticsOptions,
      );
    });

    it("tracks pages with platform and osType", async () => {
      const { result } = renderUseAnalytics("ledger-live-desktop", MAC_UA);
      await waitFor(() => expect(result.current).not.toBeNull());

      result.current.page("Connect", { source: "home" });

      expect(page).toHaveBeenCalledWith(
        "Wallet Connect v2",
        "Connect",
        { ...desktopProperties, source: "home" },
        analyticsOptions,
      );
    });
  });

  describe("on Ledger Wallet Mobile", () => {
    const mobileProperties = {
      ...baseProperties,
      platform: "mobile",
      platformOS: "ios",
    };

    it("identifies the user with platform and platformOS", async () => {
      renderUseAnalytics("ledger-live-mobile", IPHONE_UA);

      await waitFor(() =>
        expect(identify).toHaveBeenCalledWith(
          "user-id",
          mobileProperties,
          analyticsOptions,
        ),
      );
    });

    it("tracks events with platform and platformOS", async () => {
      const { result } = renderUseAnalytics("ledger-live-mobile", IPHONE_UA);
      await waitFor(() => expect(result.current).not.toBeNull());

      result.current.track("button_clicked");

      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        mobileProperties,
        analyticsOptions,
      );
    });

    it("tracks pages with platform and platformOS", async () => {
      const { result } = renderUseAnalytics("ledger-live-mobile", IPHONE_UA);
      await waitFor(() => expect(result.current).not.toBeNull());

      result.current.page("Connect");

      expect(page).toHaveBeenCalledWith(
        "Wallet Connect v2",
        "Connect",
        mobileProperties,
        analyticsOptions,
      );
    });
  });

  it("sends an unknown platform for other wallets", async () => {
    const { result } = renderUseAnalytics("other-wallet", MAC_UA);
    await waitFor(() => expect(result.current).not.toBeNull());

    result.current.track("button_clicked");

    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      { ...baseProperties, platform: "unknown" },
      analyticsOptions,
    );
  });
});
