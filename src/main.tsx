import { StrictMode, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes";
import "../i18n.ts";
import * as Sentry from "@sentry/react";
// import "./index.css";

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}

const SENTRY_DNS =
  import.meta.env.VITE_SENTRY_DNS ?? import.meta.env.VITE_PUBLIC_SENTRY_DSN;

if (SENTRY_DNS) {
  Sentry.init({
    dsn: SENTRY_DNS,
    environment: import.meta.env.MODE, // https://vitejs.dev/guide/env-and-mode#env-variables
    tracesSampleRate: 0, // https://docs.sentry.io/platforms/javascript/performance
    autoSessionTracking: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#auto-session-tracking
    sendClientReports: false, // https://docs.sentry.io/platforms/javascript/configuration/options/#send-client-reports
    // NOTE: routing instrumentation only supports react-router out of the box https://docs.sentry.io/platforms/javascript/guides/react/features/react-router/
  });
} else {
  console.error("NO CONFIG FOR SENTRY (S)");
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <Suspense>
        <RouterProvider router={router} />
      </Suspense>
    </StrictMode>
  );
}
