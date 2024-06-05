import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import inject from "@rollup/plugin-inject";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  build: {
    sourcemap: true, // Source map generation must be turned on
    rollupOptions: {
      plugins: [inject({ Buffer: ["buffer", "Buffer"] })],
    },
  },
  // TODO: separate config for playwright (or update wallet-api-simulator)
  // define: {
  //   'process': {env: {}},
  //   'global': {}
  // },
  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        presets: ["jotai/babel/preset"],
        plugins: ["babel-plugin-styled-components"],
      },
    }),
    nodePolyfills(),
    // react({
    //   include: /\.(jsx|tsx)$/,
    //   babel: {
    //     plugins: ["styled-components"],
    //     babelrc: false,
    //     configFile: false,
    //   },
    // }),
    // Put the Sentry vite plugin after all other plugins
    process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          org: "ledger",
          project: "wallet-connect-live-app",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          // env: process.env.NODE_ENV,
        })
      : undefined,
  ],
  test: {
    exclude: [...configDefaults.exclude, "tests_playwright/*"],
    globals: true, // so cleanup() runs after each test.
    setupFiles: "./vitest.setup.ts",
    coverage: {
      provider: "v8", // or 'v8'
    },
    // environment: 'happy-dom' // https://vitest.dev/config/#environment
    environment: "jsdom", // https://vitest.dev/config/#environment
  },
});
