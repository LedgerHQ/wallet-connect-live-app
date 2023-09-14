// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

const SENTRY_DNS = process.env.SENTRY_DNS || process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DNS) {
  Sentry.init({
    dsn: SENTRY_DNS,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0, // https://docs.sentry.io/platforms/javascript/performance
    autoSessionTracking: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#auto-session-tracking
    sendClientReports: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#send-client-reports
  })
} else {
  console.error("NO CONFIG FOR SENTRY (E)")
}
