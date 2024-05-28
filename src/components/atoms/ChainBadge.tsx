import { AccountsInChain } from "@/hooks/useProposal/util";
import { getColor, getTicker } from "@/utils/helper.util";
import { CryptoIcon, Flex, Text } from "@ledgerhq/react-ui";
import { CheckAloneMedium } from "@ledgerhq/react-ui/assets/icons";

type Props = {
  chain: AccountsInChain;
  success?: boolean;
};
function ChainBadge({ chain, success }: Props) {
  return (
    <Flex
      columnGap={2}
      flexDirection={"row"}
      alignItems="center"
      justifyContent="center"
      backgroundColor={success ? "success.c10" : "neutral.c30"}
      padding={2}
      paddingRight={3}
      borderRadius="32px"
    >
      <CryptoIcon
        name={getTicker(chain.chain)}
        circleIcon
        size={20}
        color={getColor(chain.chain)}
      />
      <Text
        variant="small"
        fontWeight="medium"
        color="neutral.c100"
        textAlign="center"
        style={{ textWrap: "nowrap" }}
      >
        {chain.displayName}
      </Text>
      {success && <CheckAloneMedium size={16} color="success.c80" />}
    </Flex>
  );
}

export default ChainBadge;
