import { Navigate, createRoute } from "@tanstack/react-router";
import SessionProposal from "@/components/screens/SessionProposal";
import { rootRoute } from "@/routes/root";
import { useAtomValue } from "jotai";
import { oneClickAuthPayloadAtom } from "@/store/walletKit.store";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { EIP155_CHAINS } from "@/data/network.config";
import { ProposalTypes } from "@walletconnect/types";
import { OneClickAuthPayload } from "@/types/types";

const convertPayloadToProposal = (
  payload?: OneClickAuthPayload,
):
  | (ProposalTypes.Struct & {
      oneClickAuthPayload?: OneClickAuthPayload;
    })
  | null => {
  const supportedMethods = Object.values(EIP155_SIGNING_METHODS);
  const supportedChains = Object.values(EIP155_CHAINS).map(
    (network) => network.namespace,
  );

  if (!payload) return null;

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
    const proposal = convertPayloadToProposal(oneClickAuthPayload);

    if (!proposal) {
      return (
        <Navigate from="/oneclickauth" to="/" search={(search) => search} />
      );
    }

    return <SessionProposal proposal={proposal} />;
  },
});
