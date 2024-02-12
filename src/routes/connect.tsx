import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { Connect } from "@/components/screens/Connect";

export const connectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connect",
  component: function ConnectRoute() {
    const { mode } = rootRoute.useSearch();

    return <Connect mode={mode} />;
  },
});
