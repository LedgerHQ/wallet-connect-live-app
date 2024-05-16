import { GenericRow } from "@/components/atoms/GenericRow";
import { AccountsInChain } from "@/hooks/useProposal/util";
import { Account } from "@ledgerhq/wallet-api-client";
import { RowType } from "@/components/atoms/types";
import { getColor, getTicker, truncate } from "@/utils/helper.util";
import { space } from "@ledgerhq/react-ui/styles/theme";
import { CryptoIcon } from "@ledgerhq/react-ui";
import { AccountBalance } from "@/components/atoms/AccountBalance";

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
        rightElement={AccountBalance({ account })}
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
