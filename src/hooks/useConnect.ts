import {
  ConnectionEntry,
  recordConnectionEntryAtom,
} from "@/store/connectionEntry.store";
import { coreAtom } from "@/store/walletKit.store";
import { getErrorMessage } from "@/utils/helper.util";
import { UseNavigateResult } from "@tanstack/react-router";
import { parseUri } from "@walletconnect/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

export function useConnect(
  navigate: UseNavigateResult<"/"> | UseNavigateResult<"/connect">,
) {
  const core = useAtomValue(coreAtom);
  const recordConnectionEntry = useSetAtom(recordConnectionEntryAtom);

  const startProposal = useCallback(
    (uri: string, entry: ConnectionEntry) => {
      try {
        const url = new URL(uri);

        switch (url.protocol) {
          // handle usual wallet connect URIs
          case "wc:": {
            recordConnectionEntry({
              pairingTopic: parseUri(uri).topic,
              entry,
              activeTopics: core.pairing
                .getPairings()
                .map((pairing) => pairing.topic),
            });
            return core.pairing.pair({ uri });
          }

          // handle Ledger Live specific URIs
          case "ledgerlive:": {
            const uriParam = url.searchParams.get("uri");

            if (url.pathname === "//wc" && uriParam) {
              return startProposal(uriParam, entry);
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
    [core, recordConnectionEntry],
  );

  const onConnect = useCallback(
    async (inputValue: URL, entry: ConnectionEntry) => {
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
          await startProposal(uri, entry);
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
          // Remove the uri from the search params to avoid trying to connect again if the user reload the current page
          await navigate({
            search: ({ uri: _, ...search }) => search,
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
