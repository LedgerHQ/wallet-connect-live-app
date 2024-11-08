import { walletKitAtom } from "@/store/walletKit.store";
import { VerificationStatus } from "@/types/types";
import { ProposalTypes } from "@walletconnect/types";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

const useVerification = (
  proposal: ProposalTypes.Struct,
): VerificationStatus => {
  const walletKit = useAtomValue(walletKitAtom);

  return useMemo(
    () =>
      proposal.proposer.metadata.verifyUrl ??
      walletKit.core.pairing
        .getPairings()
        .find((pairing) => pairing.topic === proposal.pairingTopic)
        ?.peerMetadata?.verifyUrl ??
      "UNKNOWN",
    [
      proposal.pairingTopic,
      proposal.proposer.metadata.verifyUrl,
      walletKit.core.pairing,
    ],
  ) as VerificationStatus;
};
export default useVerification;
