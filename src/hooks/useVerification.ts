import { web3walletAtom } from "@/store/web3wallet.store";
import { VerificationStatus } from "@/types/types";
import { ProposalTypes } from "@walletconnect/types";
import { useAtomValue } from "jotai";

const useVerification = (
  proposal: ProposalTypes.Struct,
): VerificationStatus => {
  const web3wallet = useAtomValue(web3walletAtom);

  return (proposal.proposer.metadata.verifyUrl ??
    web3wallet.core.pairing
      .getPairings()
      .find((pairing) => pairing.topic === proposal.pairingTopic)?.peerMetadata
      ?.verifyUrl ??
    "UNKNOWN") as VerificationStatus;
};
export default useVerification;
