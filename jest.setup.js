// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { styleSheetSerializer } from "jest-styled-components";
import { TextEncoder, TextDecoder } from "util";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { setConfig } from "next/config";
import config from "./next.config";

styleSheetSerializer.setStyleSheetSerializerOptions({
  addStyles: false,
  classNameFormatter: (idx) => {
    return `class${idx}`;
  },
});

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

/** MOCKED LIBS */
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock("@walletconnect/utils", () => {
  return {
    buildApprovedNamespaces: jest.fn(() => ({})),
  };
});

jest.mock("@ledgerhq/wallet-api-client", () => {
  return {
    WindowMessageTransport: jest.fn(() => {
      return {
        connect: jest.fn(),
        disconnect: jest.fn(),
      };
    }),
    WalletAPIClient: jest.fn(() => {
      return {
        account: {
          list: jest.fn(() => Promise.resolve([])),
        },
        wallet: {
          userId: jest.fn(() => Promise.resolve("testUserId")),
          info: jest.fn(() =>
            Promise.resolve({
              tracking: false,
              wallet: {
                name: "test-wallet",
                version: "1.0.0",
              },
            }),
          ),
        },
      };
    }),
  };
});

jest.mock("@walletconnect/web3wallet", () => {
  return {
    Web3Wallet: {
      init: jest.fn(() => ({
        getActiveSessions: jest.fn(() => []),
        on: jest.fn((eventName, callback) => window.addEventListener(eventName, callback)),
      })),
    },
  };
});

jest.mock("@walletconnect/core", () => {
  return {
    Core: jest.fn(() => {
      return {
        pairing: {
          pair: jest.fn(() => {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent("session_proposal", {
                  detail: sessionProposal,
                }),
              );
            }, 200);
          }),
        },
      };
    }),
  };
});

setConfig(config);
