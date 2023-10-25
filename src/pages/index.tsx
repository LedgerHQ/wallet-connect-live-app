import { useState, useEffect } from "react";
import type { NextPage } from "next";
import Head from "next/head";

import { Container } from "@/styles/styles";
import { WalletApiClientProvider } from "@/shared/WalletApiClientProvider";
import WalletConnect from "@/components/screens";
import { ApplicationDisabled } from "@/components/screens/ApplicationDisabled";
import { useNavigation } from "@/hooks/common/useNavigation";

export { getServerSideProps } from "@/lib/serverProps";

const Index: NextPage = ({ initialized = true }: { initialized?: boolean }) => {
  const { router } = useNavigation();

  const isApplicationDisabled = Boolean(process.env.NEXT_PUBLIC_APPLICATION_DISABLED === "true");

  const { uri: rawURI, mode: rawInitialMode } = router.query;

  const uri = rawURI && typeof rawURI === "string" ? rawURI : undefined;

  const initialMode =
    rawInitialMode === "scan" || rawInitialMode === "text" ? rawInitialMode : undefined;

  const [isMounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Container>
      <Head>
        <title>Ledger WalletConnect</title>
        <meta name="Ledger WalletConnect" content="Ledger WalletConnect" />
      </Head>

      {isApplicationDisabled ? (
        <ApplicationDisabled />
      ) : isMounted ? (
        <WalletApiClientProvider>
          {(accounts, userId, walletInfo) =>
            initialized ? (
              <WalletConnect
                initialMode={initialMode}
                initialURI={uri}
                accounts={accounts}
                userId={userId}
                walletInfo={walletInfo}
              />
            ) : null
          }
        </WalletApiClientProvider>
      ) : null}
    </Container>
  );
};

export default Index;
