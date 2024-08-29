import { ValidationStatus } from "@/types/types";
import { Box, Text } from "@ledgerhq/react-ui";
import {
  CircledCheckSolidMedium,
  CircledCrossSolidMedium,
  InfoAltFillMedium,
  WarningSolidMedium,
} from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components";

type Props = {
  verification: ValidationStatus;
  type?: "icon" | "full";
  [key: string]: unknown;
};

const VerificationLabel = ({
  verification,
  type = "full",
  ...style
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const sharedStyle = {
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    columnGap: 3,
    paddingY: 2,
    paddingX: 4,
    width: "max-content",
    ...style,
  };

  switch (verification) {
    case "VALID":
      return type === "full" ? (
        <></>
      ) : (
        <CircledCheckSolidMedium size={12} color={"green"} />
      );
    case "INVALID":
      return type === "full" ? (
        <Box backgroundColor={colors.error.c90} {...sharedStyle}>
          <WarningSolidMedium size={20} color={"red"} />

          <Text color={"red"}>
            {t("sessionProposal.validation.invalid.label")}
          </Text>
        </Box>
      ) : (
        <WarningSolidMedium size={12} color={"red"} />
      );
    case "SCAM":
      return type === "full" ? (
        <Box backgroundColor={colors.error.c90} {...sharedStyle}>
          <CircledCrossSolidMedium size={20} color={"red"} />
          <Text color={"red"}>
            {t("sessionProposal.validation.scam.label")}
          </Text>
        </Box>
      ) : (
        <CircledCrossSolidMedium size={12} color={"red"} />
      );
    default:
      return type === "full" ? (
        <Box backgroundColor={colors.warning.c90} {...sharedStyle}>
          <InfoAltFillMedium size={20} color={"orange"} />

          <Text color={"orange"}>
            {t("sessionProposal.validation.unknown.label")}
          </Text>
        </Box>
      ) : (
        <InfoAltFillMedium size={12} color={"orange"} />
      );
  }
};

export default VerificationLabel;
