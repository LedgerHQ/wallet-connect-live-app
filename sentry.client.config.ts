// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/react";

const SENTRY_DNS = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DNS) {
  Sentry.init({
    dsn: SENTRY_DNS,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0, // https://docs.sentry.io/platforms/javascript/performance
    autoSessionTracking: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#auto-session-tracking
    sendClientReports: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#send-client-reports
  });
} else {
  console.error("NO CONFIG FOR SENTRY (C)");
}
