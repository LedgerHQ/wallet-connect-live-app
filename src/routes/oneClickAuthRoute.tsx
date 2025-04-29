import { Navigate, createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";
import { useAtomValue } from "jotai";
import { oneClickAuthPayloadAtom } from "@/store/walletKit.store";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { EIP155_CHAINS } from "@/data/network.config";
import { ProposalTypes } from "@walletconnect/types";
import { OneClickAuthPayload } from "@/types/types";
import { useMemo } from "react";

const supportedMethods = Object.values(EIP155_SIGNING_METHODS);
const supportedChains = Object.values(EIP155_CHAINS).map(
  (network) => network.namespace,
);

const convertPayloadToFakeProposal = (
  payload?: OneClickAuthPayload,
): ProposalTypes.Struct | null => {
  if (!payload) return null;

  return {
    id: payload.id,
    expiryTimestamp: payload.params.expiryTimestamp,
    relays: [],
    proposer: payload.params.requester,
    requiredNamespaces: {},
    optionalNamespaces: {
      eip155: {
        chains: supportedChains,
        methods: supportedMethods,
        events: [],
      },
    },
    pairingTopic: payload.topic,
  };
};

export const oneClickAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/oneclickauth",
  component: function Proposal() {
    const oneClickAuthPayload = useAtomValue(oneClickAuthPayloadAtom);
    const proposal = useMemo(
      () => convertPayloadToFakeProposal(oneClickAuthPayload),
      [oneClickAuthPayload],
    );

    if (!proposal) {
      return (
        <Navigate from="/oneclickauth" to="/" search={(search) => search} />
      );
    }

    return (
      <SessionProposal
        proposal={proposal}
        oneClickAuthPayload={oneClickAuthPayload}
      />
    );
  },
});
