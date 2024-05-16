import ChainBadge from "@/components/atoms/ChainBadge";
import { AccountsInChain } from "@/hooks/useProposal/util";
import { getColor, getTicker } from "@/utils/helper.util";
import { CryptoIcon, Flex, Text } from "@ledgerhq/react-ui";
import { CheckAloneMedium, PlusMedium } from "@ledgerhq/react-ui/assets/icons";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = {
  entry: AccountsInChain;
  selectedAccounts: string[];
};

export const ChainRow = ({ entry, selectedAccounts }: Props) => {
  const atLeastOneAccountSelected = useMemo(
    () =>
      entry.accounts.some((account) => selectedAccounts.includes(account.id)),
    [entry, selectedAccounts],
  );

  return (
    <Flex
      columnGap={2}
      marginTop={6}
      marginBottom={3}
      flexDirection={"row"}
      alignItems="center"
      justifyContent="center"
      backgroundColor={
        atLeastOneAccountSelected ? "success.c10" : "neutral.c30"
      }
      padding={2}
      paddingRight={3}
      borderRadius={2}
      // borderTopLeftRadius={2}
      // borderTopRightRadius={2}
    >
      <CryptoIcon
        name={getTicker(entry.chain)}
        circleIcon
        size={20}
        color={getColor(entry.chain)}
      />
      <Text
        variant="small"
        fontWeight="medium"
        color="neutral.c100"
        textAlign="center"
        style={{ textWrap: "nowrap" }}
      >
        {entry.displayName}
      </Text>

      {atLeastOneAccountSelected ? (
        <CheckAloneMedium size={16} color="success.c80" />
      ) : (
        <Text
          variant="tiny"
          fontWeight="medium"
          color="neutral.c100"
          textAlign="center"
          style={{ textWrap: "nowrap" }}
        >
          {entry.isRequired && "(select at least one account)"}
        </Text>
      )}
    </Flex>
  );
};
