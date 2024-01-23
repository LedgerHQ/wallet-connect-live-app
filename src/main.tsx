import { StrictMode, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./routes";
import "../i18n.ts";
import { useTranslation } from "react-i18next";
// import "./index.css";

declare module "@tanstack/react-router" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: typeof router;
  }
}
// init sentry here

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
