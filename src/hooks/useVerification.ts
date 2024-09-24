import { web3walletAtom } from "@/store/web3wallet.store";
import { VerificationStatus } from "@/types/types";
import { ProposalTypes } from "@walletconnect/types";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

const useVerification = (
  proposal: ProposalTypes.Struct,
): VerificationStatus => {
  const web3wallet = useAtomValue(web3walletAtom);

  proposal;

  return useMemo(
    () =>
      proposal.proposer.metadata.verifyUrl ??
      web3wallet.core.pairing
        .getPairings()
        .find((pairing) => pairing.topic === proposal.pairingTopic)
        ?.peerMetadata?.verifyUrl ??
      "UNKNOWN",
    [
      proposal.pairingTopic,
      proposal.proposer.metadata.verifyUrl,
      web3wallet.core.pairing,
    ],
  ) as VerificationStatus;
};
export default useVerification;
