import { createRoute } from "@tanstack/react-router";
import { rootRoute } from ".";
import SessionDetail from "@/components/screens/SessionDetail";

export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/detail/$topic",
  component: function Detail() {
    const params = detailRoute.useParams();

    return <SessionDetail topic={params.topic} />;
  },
});
