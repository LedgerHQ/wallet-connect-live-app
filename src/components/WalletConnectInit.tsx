import { useAtom } from "jotai";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flex, InfiniteLoader } from "@ledgerhq/react-ui";
import { useConnect } from "@/hooks/useConnect";
import useWalletConnect from "@/hooks/useWalletConnect";
import { walletConnectLoading } from "@/store/web3wallet.store";

type Props = {
  initialURI?: string;
  initialRequestId?: string;
  initialSessionTopic?: string;
};

export function WalletConnectInit({
  initialURI,
  initialRequestId,
  initialSessionTopic,
}: Props) {
  useWalletConnect();

  const { onConnect } = useConnect();
  const [loading, setLoading] = useAtom(walletConnectLoading);
  const navigate = useNavigate({ from: "/" });

  // Try connecting only once with the provided uri
  useEffect(() => {
    if (initialURI) {
      try {
        const uri = new URL(initialURI);

        setLoading(true);

        void onConnect(uri).finally(() => {
          setLoading(false);
        });
      } catch (error) {
        setLoading(false);
        // TODO maybe improve this error handling
        console.error("Invalid initialURI: ", error);
      }
    } else if (initialRequestId && initialSessionTopic) {
      setLoading(true);

      void navigate({
        to: "/detail/$topic",
        params: { topic: initialSessionTopic },
        search: ({ requestId: _r, sessionTopic: _s, ...search }) => search,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return loading ? (
    <Flex
      justifyContent="center"
      alignItems="center"
      position="absolute"
      top="0"
      bottom="0"
      left="0"
      right="0"
      zIndex={10}
      backgroundColor="rgba(0, 0, 0, 0.7)"
    >
      <InfiniteLoader />
    </Flex>
  ) : null;
}
