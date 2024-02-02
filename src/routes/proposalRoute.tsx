import { createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";

export const proposalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proposal",
  component: SessionProposal,
});
