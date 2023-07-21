// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
	dsn: process.env.SENTRY_DNS,
	tracesSampleRate: 0, // https://docs.sentry.io/platforms/javascript/performance
	autoSessionTracking: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#auto-session-tracking
	sendClientReports: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#send-client-reports
})
