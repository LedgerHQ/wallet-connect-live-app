import { Navigate, createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import useSessions from "@/hooks/useSessions";
import SessionUpdate from "@/components/screens/SessionUpdate";

export const updateRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/update/$topic/$id/$chainId",
  component: function Detail() {
    const params = updateRoute.useParams();

    const web3wallet = useAtomValue(web3walletAtom);
    const sessions = useSessions(web3wallet);
    const session = useMemo(
      () => sessions.data.find((elem) => elem.topic === params.topic),
      [params.topic, sessions.data],
    );

    if (!session) {
      return <Navigate to="/" search={(search) => search} />;
    }

    return (
      <SessionUpdate
        session={session}
        id={params.id as unknown as number}
        chainId={params.chainId}
      />
    );
  },
});
