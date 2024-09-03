import { GenericRow } from "@/components/atoms/GenericRow";
import { RowType } from "@/components/atoms/types";
import { ImageWithPlaceholder } from "@/components/atoms/images/ImageWithPlaceholder";
import { formatUrl } from "@/utils/helper.util";
import { Box } from "@ledgerhq/react-ui";
import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ProposalTypes } from "@walletconnect/types";
import useAnalytics from "@/hooks/useAnalytics";
import VerificationLabel from "./verification/VerificationLabel";
import useVerification from "@/hooks/useVerification";

const ProposalRow = ({ proposal }: { proposal: ProposalTypes.Struct }) => {
  const navigate = useNavigate({ from: "/" });
  const analytics = useAnalytics();

  const verificationStatus = useVerification(proposal);

  const goToSessionProposal = useCallback(
    (id: number) => {
      void navigate({
        to: "/proposal/$id",
        params: { id: id.toString() },
        search: (search) => search,
      });
      analytics.track("button_clicked", {
        button: "Session Proposal",
        page: "Wallet Connect Sessions",
      });
    },
    [analytics, navigate],
  );

  return (
    <Box mt={3}>
      <GenericRow
        title={proposal.proposer.metadata.name}
        subtitle={formatUrl(proposal.proposer.metadata.url)}
        LeftIcon={
          <ImageWithPlaceholder
            icon={proposal.proposer.metadata.icons[0] ?? null}
          />
        }
        RightIcon={
          <VerificationLabel type="icon" verification={verificationStatus} />
        }
        rowType={RowType.Detail}
        onClick={() => goToSessionProposal(proposal.id)}
      />
    </Box>
  );
};

export default ProposalRow;
