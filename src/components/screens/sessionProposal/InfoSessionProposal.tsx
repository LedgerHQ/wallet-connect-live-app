import { Flex, Text } from "@ledgerhq/react-ui";
import { CheckAloneMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";

type InfoSessionProposalProps = {
  isInSessionDetails?: boolean;
};

export function InfoSessionProposal({
  isInSessionDetails,
}: InfoSessionProposalProps) {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="column">
      <Text variant="small" fontWeight="medium" color="neutral.c70" mb={6}>
        {isInSessionDetails
          ? t("sessionProposal.info2")
          : t("sessionProposal.info")}
      </Text>

      {[0, 1].map((e) => (
        <Flex mt={3} key={e} alignItems="center">
          <CheckAloneMedium size={16} color="success.c80" />

          <Text ml={4} variant="small" fontWeight="medium" color="neutral.c100">
            {t(`sessionProposal.infoBullet.${e}`)}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
