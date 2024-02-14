import { coreAtom } from "@/store/web3wallet.store";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";

export function useConnect() {
  const navigate = useNavigate();
  const core = useAtomValue(coreAtom);

  const startProposal = useCallback(
    (uri: string) => {
      try {
        const url = new URL(uri);

        switch (url.protocol) {
          // handle usual wallet connect URIs
          case "wc:": {
            return core.pairing.pair({ uri });
          }

          // handle Ledger Live specific URIs
          case "ledgerlive:": {
            const uriParam = url.searchParams.get("uri");

            if (url.pathname === "//wc" && uriParam) {
              return startProposal(uriParam);
            }
            break;
          }
        }
      } catch (error) {
        // bad urls are just ignored
        if (error instanceof TypeError) {
          return;
        }
        throw error;
      }
    },
    [core]
  );

  const onConnect = useCallback(
    async (inputValue: URL) => {
      try {
        const uri = inputValue.toString();
        if (uri.includes("@1")) {
          await navigate({
            to: "/protocol-not-supported",
            search: (search) => search,
          });
        } else {
          await startProposal(uri);
        }
      } catch (error: unknown) {
        console.error(error);
      } finally {
        await navigate({
          to: "/",
          search: (search) => search,
        });
      }
    },
    [navigate, startProposal]
  );

  return useMemo(
    () => ({
      onConnect,
    }),
    [onConnect]
  );
}
