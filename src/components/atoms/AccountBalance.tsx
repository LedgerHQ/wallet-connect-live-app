import formatCurrencyUnit from "@/utils/currencyFormatter";
import { getNetwork } from "@/utils/helper.util";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Account } from "@ledgerhq/wallet-api-client";

export const AccountBalance = ({ account }: { account: Account }) => {
  const network = getNetwork(account.currency);
  const unit = {
    code: network.ticker,
    magnitude: 18,
    name: network.displayName,
  };
  const currencyBalance = formatCurrencyUnit(unit, account.balance, {
    showCode: true,
  });
  return (
    <Flex flexDirection="column" mr={5}>
      <Text variant="body" fontWeight="semiBold" color="neutral.c100">
        {/* NOTE: is there an easy way to get $ (fiat) value of currency from liveapp */}
      </Text>

      <Text variant="small" fontWeight="medium" color="neutral.c70" mt={2}>
        {currencyBalance}
      </Text>
    </Flex>
  );
};
