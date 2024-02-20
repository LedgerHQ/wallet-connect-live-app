import { useEffect } from "react";
import { useConnect } from "@/hooks/useConnect";
import useWalletConnect from "@/hooks/useWalletConnect";


type Props = {
  initialURI?: string;
}

export function WalletConnectInit({ initialURI }: Props) {
  useWalletConnect();

  const { onConnect } = useConnect();

  // Try connecting only once with the provided uri
  useEffect(() => {
    if (initialURI) {
      try {
        const uri = new URL(initialURI);

        void onConnect(uri);
      } catch (error) {
        // TODO maybe improve this error handling
        console.error("Invalid initialURI: ", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
