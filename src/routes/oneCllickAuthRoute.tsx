import { createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";
import { useAtomValue } from "jotai";
import { oneClickAuthPayloadAtom } from "@/store/walletKit.store";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { EIP155_CHAINS } from "@/data/network.config";
import { AuthTypes, ProposalTypes } from "@walletconnect/types";

const convertPayloadToProposal = (
  payload: AuthTypes.BaseEventArgs<AuthTypes.SessionAuthenticateRequestParams>,
): ProposalTypes.Struct & {
  oneClickAuthPayload?: AuthTypes.BaseEventArgs<AuthTypes.SessionAuthenticateRequestParams>;
} => {
  const supportedMethods = Object.values(EIP155_SIGNING_METHODS);
  const supportedChains = Object.values(EIP155_CHAINS).map(
    (network) => network.namespace,
  );

  return {
    id: payload.id,
    expiryTimestamp: payload.params.expiryTimestamp,
    relays: [],
    proposer: payload.params.requester,
    requiredNamespaces: {
      eip155: {
        chains: supportedChains,
        methods: supportedMethods,
        events: [],
      },
    },
    optionalNamespaces: {},
    pairingTopic: payload.topic,
    oneClickAuthPayload: payload,
  };
};

export const oneCllickAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/oneclickauth",
  component: function Proposal() {
    const oneClickAuthPayload = useAtomValue(oneClickAuthPayloadAtom);
    const proposal = convertPayloadToProposal(oneClickAuthPayload!);

    return <SessionProposal proposal={proposal} />;
  },
});
