import formatCurrencyUnit from "@/utils/currencyFormatter";
import { Flex, Text } from "@ledgerhq/react-ui";
import { Account, Currency } from "@ledgerhq/wallet-api-client";

export const AccountBalance = ({
  account,
  currency,
}: {
  account: Account;
  currency: Currency;
}) => {
  const currencyBalance = formatCurrencyUnit(
    {
      code: currency.ticker,
      magnitude: currency.decimals,
      name: currency.name,
    },
    account.balance,
    {
      showCode: true,
    },
  );
  return (
    <Flex flexDirection="column" mr={5}>
      <Text variant="small" fontWeight="medium" color="neutral.c70" mt={2}>
        {currencyBalance}
      </Text>
    </Flex>
  );
};
