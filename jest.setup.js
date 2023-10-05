// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/extend-expect";
import { styleSheetSerializer } from "jest-styled-components";
import { TextEncoder, TextDecoder } from "util";

styleSheetSerializer.setStyleSheetSerializerOptions({
  addStyles: false,
  classNameFormatter: (idx) => {
    return `class${idx}`;
  },
});

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import { setConfig } from "next/config";
import config from "./next.config";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

setConfig(config);
