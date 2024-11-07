import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";

vi.mock("@reown/walletkit", () => {
  return {
    WalletKit: {
      init: vi.fn(() => ({
        engine: {
          signClient: {
            session: {
              getAll: vi.fn(() => []),
            },
            proposal: {
              getAll: vi.fn(() => []),
            },
          },
        },
        on: vi.fn<typeof window.addEventListener<keyof WindowEventMap>>(
          (eventName, callback, options) =>
            window.addEventListener(eventName, callback, options),
        ),
      })),
    },
  };
});

vi.mock("@walletconnect/core", () => {
  return {
    Core: vi.fn(() => {
      return {
        pairing: {
          pair: vi.fn(() => {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("session_proposal", {
                  detail: sessionProposal,
                }),
              );
            }, 200);
          }),
        },
        relayer: {
          on: vi.fn(),
        },
      };
    }),
  };
});
