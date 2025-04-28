import { Navigate, createRoute } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import SessionDetailEdit from "@/components/screens/SessionDetailEdit";
import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { walletKitAtom } from "@/store/walletKit.store";
import useSessions from "@/hooks/useSessions";

export const detailEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/detail/$topic/edit",
  component: function DetailEdit() {
    const params = detailEditRoute.useParams();

    const walletKit = useAtomValue(walletKitAtom);
    const sessions = useSessions(walletKit);
    const session = useMemo(
      () => sessions.data.find((elem) => elem.topic === params.topic),
      [params.topic, sessions.data],
    );

    if (!session) {
      return (
        <Navigate
          from="/detail/$topic/edit"
          to="/"
          search={(search) => search}
        />
      );
    }

    return <SessionDetailEdit session={session} />;
  },
});
