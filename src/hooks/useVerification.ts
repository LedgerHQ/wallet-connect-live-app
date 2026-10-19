import { verifyContextByProposalIdAtom } from "@/store/walletKit.store";
import { VerificationStatus } from "@/types/types";
import { ProposalTypes } from "@walletconnect/types";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

const useVerification = (
  proposal: ProposalTypes.Struct,
): VerificationStatus => {
  const verifyContextByProposalId = useAtomValue(verifyContextByProposalIdAtom);

  return useMemo<VerificationStatus>(() => {
    const context = verifyContextByProposalId[proposal.id]?.context;
    if (!context) {
      return "UNKNOWN";
    }

    if (context.verified.isScam) {
      return "SCAM";
    }

    return context.verified.validation;
  }, [proposal.id, verifyContextByProposalId]);
};
export default useVerification;
