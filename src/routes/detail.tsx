import { Route } from "@tanstack/react-router";
import { rootRoute } from ".";
import SessionDetail from "@/pages/detail";

export const detailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/detail/$topic",
  component: function Detail() {
    const params = detailRoute.useParams();

    return <SessionDetail topic={params.topic} />;
  },
});
