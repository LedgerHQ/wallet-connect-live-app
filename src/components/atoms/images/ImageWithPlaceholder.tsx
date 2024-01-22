import { tryDecodeURI } from "@/shared/helpers/image";
import { WalletConnectMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTheme } from "styled-components";

type Props = {
  icon: string | null;
};
export const ImageWithPlaceholder = ({ icon }: Props) => {
  const { colors } = useTheme();

  if (!icon) {
    return null;
  }

  const iconImage = tryDecodeURI(icon);

  return iconImage ? (
    <img
      src={iconImage}
      alt="Picture of the proposer"
      width={32}
      style={{
        borderRadius: "8px",
      }}
      height={32}
    />
  ) : (
    <WalletConnectMedium
      size={30}
      style={{
        borderRadius: "8px",
        backgroundColor: colors.background.drawer,
        color: colors.neutral.c100,
      }}
    />
  );
};
