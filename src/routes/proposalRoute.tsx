import { Route } from "@tanstack/react-router";
import SessionProposal from "@/pages/proposal";
import { rootRoute } from ".";

export const proposalRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/proposal",
  component: SessionProposal,
});
