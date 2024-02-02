import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";

vi.mock("@walletconnect/web3wallet", () => {
  return {
    Web3Wallet: {
      init: vi.fn(() => ({
        getActiveSessions: vi.fn(() => []),
        on: vi.fn<Parameters<typeof window.addEventListener>>(
          (eventName, callback) => window.addEventListener(eventName, callback)
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
                })
              );
            }, 200);
          }),
        },
      };
    }),
  };
});
