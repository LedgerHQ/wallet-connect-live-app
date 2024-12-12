import { verifyContextByTopicAtom } from "@/store/walletKit.store";
import { VerificationStatus } from "@/types/types";
import { ProposalTypes } from "@walletconnect/types";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

const useVerification = (
  proposal: ProposalTypes.Struct,
): VerificationStatus => {
  const verifyContextByTopic = useAtomValue(verifyContextByTopicAtom);

  return useMemo<VerificationStatus>(() => {
    const context = verifyContextByTopic[proposal.pairingTopic];
    if (!context) {
      return "UNKNOWN";
    }

    if (context.verified.isScam) {
      return "SCAM";
    }

    return context.verified.validation;
  }, [proposal.pairingTopic, verifyContextByTopic]);
};
export default useVerification;
