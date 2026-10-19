import {
  VerifyRequestType,
  getVerifyContextKey,
  verifyContextByRequestAtom,
} from "@/store/walletKit.store";
import { VerificationStatus } from "@/types/types";
import { ProposalTypes } from "@walletconnect/types";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

const useVerification = (
  proposal: ProposalTypes.Struct,
  type: VerifyRequestType = "proposal",
): VerificationStatus => {
  const verifyContextByRequest = useAtomValue(verifyContextByRequestAtom);

  return useMemo<VerificationStatus>(() => {
    const context =
      verifyContextByRequest[getVerifyContextKey(type, proposal.id)];
    if (!context) {
      return "UNKNOWN";
    }

    if (context.verified.isScam) {
      return "SCAM";
    }

    return context.verified.validation;
  }, [proposal.id, type, verifyContextByRequest]);
};
export default useVerification;
