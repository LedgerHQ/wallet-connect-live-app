import { createRoute } from "@tanstack/react-router";
import App from "@/components/screens/App";
import { rootRoute } from "@/routes/root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});
