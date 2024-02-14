import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import SessionDetail from "@/components/screens/SessionDetail";
import { useEffect, useMemo } from "react";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import useSessions from "@/hooks/useSessions";

export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/detail/$topic",
  component: function Detail() {
    const navigate = useNavigate({ from: "/detail/$topic" });
    const params = detailRoute.useParams();

    const web3wallet = useAtomValue(web3walletAtom);
    const sessions = useSessions(web3wallet);
    const session = useMemo(
      () => sessions.data.find((elem) => elem.topic === params.topic),
      [params.topic, sessions.data]
    );

    useEffect(() => {
      if (!session) {
        void navigate({ to: "/", search: (search) => search });
      }
    }, [navigate, session]);

    if (!session) {
      return null;
    }

    return <SessionDetail session={session} />;
  },
});
