import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { AccountsInChain } from "@/hooks/useProposal/util";
import { Flex, Text } from "@ledgerhq/react-ui";
import { PlusMedium } from "@ledgerhq/react-ui/assets/icons";

type Props = {
  chains: AccountsInChain[];
  addNewAccounts: (currencies: string[]) => Promise<void>;
};

export const AddAccountPlaceholder = ({ chains, addNewAccounts }: Props) => {
  const { t } = useTranslation();

  const chainIds = useMemo(() => {
    if (!chains) return [];
    return chains.map((chain) => chain.chain);
  }, [chains]);

  return (
    <AddAccountButton onClick={() => addNewAccounts(chainIds)}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        marginBottom={2}
      >
        <Text ml={2} variant="bodyLineHeight" color="neutral.c100">
          {chains.length === 1
            ? t("sessionProposal.createAccountForChain", {
                chain: chains[0].displayName,
              })
            : t("sessionProposal.createAccount")}
        </Text>
        <PlusMedium />
      </Flex>
      <Flex
        flexDirection="row"
        width="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <Flex flexDirection="column" width="50%" rowGap={2}>
          <Flex
            flexDirection="row"
            borderRadius="3px"
            width="100%"
            height="15px"
            backgroundColor="neutral.c40"
          ></Flex>
          <Flex flexDirection="row" columnGap="2">
            <Flex
              width="70%"
              borderRadius="3px"
              height="15px"
              backgroundColor="neutral.c20"
            ></Flex>
            <Flex
              width="10%"
              borderRadius="3px"
              height="15px"
              backgroundColor="neutral.c20"
            ></Flex>
          </Flex>
        </Flex>
        <Flex
          flexDirection="column"
          borderRadius="3px"
          backgroundColor="neutral.c30"
          width="13%"
          height="15px"
        ></Flex>
      </Flex>
    </AddAccountButton>
  );
};

const AddAccountButton = styled.button`
  border: 1px dashed rgba(153, 153, 153, 0.3);
  margin-top: 12px;
  cursor: pointer;
  border-radius: 12px;
  padding: 12px;
  padding-top: 8px;
  color: #abadb6;
  font-weight: 600;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  height: auto;
  width: 100%;
  background-color: transparent;

  &:hover {
    cursor: pointer;
    border-color: ${(p) => p.theme.colors.neutral.c100};
    color: ${(p) => p.theme.colors.neutral.c100};
  }
`;
