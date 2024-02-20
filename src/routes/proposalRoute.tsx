import { Navigate, createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import usePendingProposals from "@/hooks/usePendingProposals";

export const proposalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/proposal/$id",
  component: function Proposal() {
    const params = proposalRoute.useParams();

    const web3wallet = useAtomValue(web3walletAtom);
    const pendingProposals = usePendingProposals(web3wallet);
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
