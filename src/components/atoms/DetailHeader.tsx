import { Row } from "@/components/atoms/containers/Elements";
import { ImageWithPlaceholder } from "@/components/atoms/images/ImageWithPlaceholder";
import { formatUrl } from "@/utils/helper.util";
import { Flex, Text } from "@ledgerhq/react-ui";
import { ArrowLeftMedium } from "@ledgerhq/react-ui/assets/icons";
import { SessionTypes } from "@walletconnect/types";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

const DetailContainer = styled(Flex)`
  border-radius: 12px;
  background-color: ${(props) => props.theme.colors.neutral.c20};
  padding: 12px;
  flex-direction: column;
`;

const BackButton = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`;

type Props = {
  session: SessionTypes.Struct;
  onGoBack: () => void;
};

export default function DetailHeader({ session, onGoBack }: Props) {
  const { t } = useTranslation();

  const metadata = session.peer.metadata;

  return (
    <>
      <Flex mt={8} mb={8} alignItems="center">
        <BackButton onClick={onGoBack}>
          <ArrowLeftMedium size={24} color="neutral.c100" />
        </BackButton>

        <Text variant="h3" ml={5} color="neutral.c100">
          {t("sessions.detail.title")}
        </Text>
      </Flex>
      <DetailContainer>
        <Row justifyContent="space-between" alignItems="center">
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <ImageWithPlaceholder icon={metadata.icons[0]} />

            <Flex flexDirection="column" ml={5}>
              <Text variant="body" fontWeight="semiBold" color="neutral.c100">
                {metadata.name}
              </Text>

              <Text
                variant="small"
                fontWeight="medium"
                color="neutral.c70"
                mt={1}
              >
                {formatUrl(metadata.url)}
              </Text>
            </Flex>
          </Flex>
        </Row>

        <Row mt={10} justifyContent="space-between" alignItems="center">
          <Text variant="small" fontWeight="medium" color="neutral.c100">
            {t("sessions.detail.connected")}
          </Text>

          <Text variant="small" fontWeight="medium" color="neutral.c70">
            {new Date().toDateString()}
          </Text>
        </Row>
        <Row mt={6} justifyContent="space-between" alignItems="center">
          <Text variant="small" fontWeight="medium" color="neutral.c100">
            {t("sessions.detail.expires")}
          </Text>
          <Text variant="small" fontWeight="medium" color="neutral.c70">
            {
              //https://stackoverflow.com/a/37001827
              new Date(session.expiry * 1000).toDateString()
            }
          </Text>
        </Row>
      </DetailContainer>
    </>
  );
}
