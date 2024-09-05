import { Navigate, createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import SessionDetail from "@/components/screens/SessionDetail";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import useSessions from "@/hooks/useSessions";

export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/detail/$topic",
  component: function Detail() {
    const params = detailRoute.useParams();

    const web3wallet = useAtomValue(web3walletAtom);
    const sessions = useSessions(web3wallet);
    const session = useMemo(
      () => sessions.data.find((elem) => elem.topic === params.topic),
      [params.topic, sessions.data],
    );

    if (!session) {
      return (
        <Navigate from="/detail/$topic" to="/" search={(search) => search} />
      );
    }

    return <SessionDetail session={session} />;
  },
});
