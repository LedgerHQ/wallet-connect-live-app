import { createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from ".";

export const proposalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proposal",
  component: SessionProposal,
});
