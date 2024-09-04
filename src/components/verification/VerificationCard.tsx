import { VerificationStatus } from "@/types/types";
import { Box, Text } from "@ledgerhq/react-ui";
import {
  CircledCrossSolidMedium,
  InfoAltFillMedium,
  WarningSolidMedium,
} from "@ledgerhq/react-ui/assets/icons";
import { BaseStyledProps } from "@ledgerhq/react-ui/components/styled";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

type Props = {
  verification: VerificationStatus;
} & BaseStyledProps;

const VerificationCard = ({ verification, ...style }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const sharedStyle: BaseStyledProps = {
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    columnGap: 3,
    padding: 4,
    ...style,
  };

  switch (verification) {
    case "VALID":
      return null;
    case "INVALID":
      return (
        <Box backgroundColor={colors.error.c90} {...sharedStyle}>
          <WarningSolidMedium size={30} color={"red"} />
          <Box display={"flex"} flexDirection={"column"} rowGap={2}>
            <Text fontWeight="bold" color={"red"}>
              {t("sessionProposal.verification.invalid.title")}
            </Text>
            <Text color={"red"}>
              {t("sessionProposal.verification.invalid.description")}
            </Text>
          </Box>
        </Box>
      );
    case "SCAM":
      return (
        <Box backgroundColor={colors.error.c90} {...sharedStyle}>
          <CircledCrossSolidMedium size={30} color={"red"} />
          <Box display={"flex"} flexDirection={"column"} rowGap={2}>
            <Text fontWeight="bold" color={"red"}>
              {t("sessionProposal.verification.scam.title")}
            </Text>
            <Text color={"red"}>
              {t("sessionProposal.verification.scam.description")}
            </Text>
          </Box>
        </Box>
      );
    default:
      return (
        <Box backgroundColor={colors.warning.c90} {...sharedStyle}>
          <InfoAltFillMedium size={30} color={"orange"} />
          <Box display={"flex"} flexDirection={"column"} rowGap={2}>
            <Text fontWeight="bold" color={"orange"}>
              {t("sessionProposal.verification.unknown.title")}
            </Text>
            <Text color={"orange"}>
              {t("sessionProposal.verification.unknown.description")}
            </Text>
          </Box>
        </Box>
      );
  }
};

export default VerificationCard;
