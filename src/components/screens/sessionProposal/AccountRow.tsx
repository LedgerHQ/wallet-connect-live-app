import { GenericRow } from "@/components/atoms/GenericRow";
import { Account, Currency } from "@ledgerhq/wallet-api-client";
import { RowType } from "@/components/atoms/types";
import { truncate } from "@/utils/helper.util";
import { CryptoIcon } from "@ledgerhq/react-ui";
import { AccountBalance } from "@/components/atoms/AccountBalance";
import { ListItem } from "@/components/atoms/containers/Elements";

type Props = {
  account: Account;
  currency: Currency;
  selectedAccounts: string[];
  handleClick: (account: string) => void;
};

export function AccountRow({
  account,
  currency,
  selectedAccounts,
  handleClick,
}: Props) {
  return (
    <ListItem>
      <GenericRow
        title={account.name}
        subtitle={truncate(account.address, 10)}
        isSelected={selectedAccounts.includes(account.id)}
        rightElement={AccountBalance({ account, currency })}
        onClick={() => handleClick(account.id)}
        RightIcon={
          <CryptoIcon
            name={currency.ticker}
            circleIcon
            size={20}
            color={currency.color}
          />
        }
        rowType={RowType.Select}
      />
    </ListItem>
  );
}
