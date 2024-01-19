// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@/styles/(.*)$": "<rootDir>/src/styles/$1",
    "^@/utils/(.*)$": "<rootDir>/src/shared/utils/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/storage/(.*)$": "<rootDir>/src/storage/$1",
    "^@/constants/(.*)$": "<rootDir>/src/shared/constants/$1",
    "^@/context/(.*)$": "<rootDir>/src/shared/context/$1",
    "^@/mocks/(.*)$": "<rootDir>/src/__mocks__/$1",
    "^@/helpers/(.*)$": "<rootDir>/src/shared/helpers/$1",
    "^@/mappers/(.*)$": "<rootDir>/src/shared/mappers/$1",
    "^@/types/(.*)$": "<rootDir>/src/shared/types/$1",
    "^@/shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@/icons/(.*)$": "<rootDir>/src/icons/$1",
    "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/fileMock.js",
  },
  testEnvironment: "jsdom",
  coveragePathIgnorePatterns: ["fileMock.js", "jest.*.js", "sentry.*.config.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/styles/**",
    "!src/components/**/styles.ts",
    "!src/tests-tools/**",
    "!src/data/**",
    "!src/icons/**",
  ],
  testMatch: ["**/__tests__/**/*.test.ts?(x)", "!**/__tests__/**/*.integration.test.ts"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
