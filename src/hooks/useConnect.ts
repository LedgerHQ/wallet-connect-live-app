import { coreAtom } from "@/store/web3wallet.store";
import { getErrorMessage } from "@/utils/helper.util";
import { UseNavigateResult } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

export function useConnect(
  navigate: UseNavigateResult<"/"> | UseNavigateResult<"/connect">,
) {
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
    [core],
  );

  const onConnect = useCallback(
    async (inputValue: URL) => {
      const uri = inputValue.toString();
      if (uri.includes("@1")) {
        await navigate({
          to: "/protocol-not-supported",
          // Remove the invalid uri from the search params
          // to avoid showing this page again if the user reload the current page
          search: ({ uri: _, ...search }) => search,
        });
      } else {
        try {
          await startProposal(uri);
        } catch (error: unknown) {
          enqueueSnackbar(getErrorMessage(error), {
            errorType: "Connection error",
            variant: "errorNotification",
            anchorOrigin: {
              vertical: "top",
              horizontal: "right",
            },
          });
          console.error(error);
        } finally {
          await navigate({
            to: "/",
            search: (search) => search,
          });
        }
      }
    },
    [navigate, startProposal],
  );

  return useMemo(
    () => ({
      onConnect,
    }),
    [onConnect],
  );
}
