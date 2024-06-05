import formatCurrencyUnit from "@/utils/currencyFormatter";
import { getNetwork } from "@/utils/helper.util";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/wallet-api-client";

  // TODO: how to get decimal places for the currency, defaulting to 18 for now.
export const AccountBalance = ({ account }: { account: Account }) => {
  const network = getNetwork(account.currency);
  const unit = {
    code: network.ticker,
    magnitude: network.decimals || 18,
    name: network.displayName,
  };
  const currencyBalance = formatCurrencyUnit(unit, account.balance, {
    showCode: true,
  });
  console.log({currencyBalance})
  return (
    <Flex flexDirection="column" mr={5}>
      <Text variant="small" fontWeight="medium" color="neutral.c70" mt={2}>
        {currencyBalance}
      </Text>
    </Flex>
  );
};
