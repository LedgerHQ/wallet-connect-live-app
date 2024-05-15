import { GenericRow } from "@/components/atoms/GenericRow";
import { AccountsInChain } from "@/hooks/useProposal/util";
import { Account } from "@ledgerhq/wallet-api-client";
import { RowType } from "@/components/atoms/types";
import { getColor, getTicker, truncate } from "@/utils/helper.util";
import { space } from "@ledgerhq/react-ui/styles/theme";
import { CryptoIcon, Flex, Text } from "@ledgerhq/react-ui";
import { formatCurrencyUnit } from "@/utils/currencyFormatter/formatCurrency";

const AccountBalance = ({
  account,
  entry,
}: {
  account: Account;
  entry: AccountsInChain;
}) => {
  const unit = {
    code: getTicker(entry.chain),
    magnitude: 18,
    name: entry.displayName,
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
export function AccountRow(
  account: Account,
  index: number,
  entry: AccountsInChain,
  selectedAccounts: string[],
  handleClick: (account: string) => void,
) {
  // TODO: how to get unit / or at least magnitude for the currency, defaulting to 18 for now.
  return (
    <li
      key={account.id}
      style={{
        marginBottom: index !== entry.accounts.length - 1 ? space[3] : 0,
      }}
    >
      <GenericRow
        title={account.name}
        subtitle={truncate(account.address, 10)}
        isSelected={selectedAccounts.includes(account.id)}
        rightElement={AccountBalance({ account, entry })}
        onClick={() => handleClick(account.id)}
        LeftIcon={
          <CryptoIcon
            name={getTicker(entry.chain)}
            circleIcon
            size={20}
            color={getColor(entry.chain)}
          />
        }
        rowType={RowType.Select}
      />
    </li>
  );
}
