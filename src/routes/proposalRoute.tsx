import { Navigate, createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";

export const proposalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proposal/$id",
  component: function Proposal() {
    const params = proposalRoute.useParams();

    const web3wallet = useAtomValue(web3walletAtom);
    const proposal = useMemo(() => {
      try {
        return web3wallet.engine.signClient.proposal.get(Number(params.id));
      } catch {
        return undefined;
      }
    }, [params.id, web3wallet.engine.signClient.proposal]);

    if (!proposal) {
      return <Navigate to="/" search={(search) => search} />;
    }

    return <SessionProposal proposal={proposal} />;
  },
});
