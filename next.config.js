/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */

const { withSentryConfig } = require("@sentry/nextjs")
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
})

const { i18n } = require("./next-i18next.config")
const { version } = require("./package.json")

const nextConfig = {
  i18n,
  eslint: {
    dirs: ["src"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  publicRuntimeConfig: {
    version,
  },
}

module.exports = withBundleAnalyzer(nextConfig)

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  hideSourceMaps: false,
  org: "ledger",
  project: "wallet-connect-live-app",
})
