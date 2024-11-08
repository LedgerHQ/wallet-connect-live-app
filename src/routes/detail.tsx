import { Navigate, createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import SessionDetail from "@/components/screens/SessionDetail";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { walletKitAtom } from "@/store/walletKit.store";
import useSessions from "@/hooks/useSessions";

export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/detail/$topic",
  component: function Detail() {
    const params = detailRoute.useParams();

    const walletKit = useAtomValue(walletKitAtom);
    const sessions = useSessions(walletKit);
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
