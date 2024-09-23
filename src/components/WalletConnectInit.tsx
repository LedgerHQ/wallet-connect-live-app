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

  const navigate = useNavigate({ from: "/" });
  const { onConnect } = useConnect(navigate);
  const [loading, setLoading] = useAtom(walletConnectLoading);

  // Try connecting only once with the provided uri
  useEffect(() => {
    if (initialURI) {
      try {
        const uri = new URL(initialURI);

        setLoading(true);

        // If we don't have a pathname in the URI
        // It means that wallet connect is used by a native mobile app
        // The deep-link for requests is not containing requestId and/or sessionTopic
        // Like we usually see when connecting from the JS lib on the browser
        if (uri.pathname) {
          void onConnect(uri).finally(() => {
            setLoading(false);
          });
        } else {
          // Remove the invalid uri from the search params to avoid infinite loader if the user reload the current page
          void navigate({
            search: ({ uri: _, ...search }) => search,
          });
        }
      } catch (error) {
        setLoading(false);
        // Remove the invalid uri from the search params to avoid infinite loader if the user reload the current page
        void navigate({
          search: ({ uri: _, ...search }) => search,
        });
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
