import { Navigate, createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import usePendingProposals from "@/hooks/usePendingProposals";
// import sessionProposals from "@/data/mocks/sessionProposals";

export const proposalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proposal/$id",
  component: function Proposal() {
    const params = proposalRoute.useParams();

    const web3wallet = useAtomValue(web3walletAtom);
    const pendingProposals = usePendingProposals(web3wallet);
    // NOTE: keep for pair review to quickly go through main connection flows.
    // const proposal = sessionProposals.noSupport;
    // const proposal = sessionProposals.required;
    // const proposal = sessionProposals.requiredMissingOne;
    // const proposal = sessionProposals.requiredMissingMultiples;
    // const proposal = sessionProposals.many;
    const proposal = useMemo(
      () => pendingProposals.data.find((elem) => elem.id === Number(params.id)),
      [params.id, pendingProposals.data]
    );

    if (!proposal) {
      return <Navigate to="/" search={(search) => search} />;
    }

    return <SessionProposal proposal={proposal} />;
  },
});
