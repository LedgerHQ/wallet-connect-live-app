/**
 * Methods
 */
export const WALLET_METHODS = {
  WALLET_ADD_ETHEREUM_CHAIN: "wallet_addEthereumChain",
  WALLET_SWITCH_ETHEREUM_CHAIN: "wallet_switchEthereumChain",
  WALLET_GET_PERMISSIONS: "wallet_getPermissions",
  WALLET_REQUEST_PERMISSIONS: "wallet_requestPermissions",
  WALLET_REGISTER_ONBOARDING: "wallet_registerOnboarding",
  WALLET_WATCH_ASSET: "wallet_watchAsset",
  WALLET_SCAN_QR_CODE: "wallet_scanQRCode",
} as const;

export type WALLET_REQUESTS =
  | {
      method: typeof WALLET_METHODS.WALLET_ADD_ETHEREUM_CHAIN;
      params: [
        {
          chainId: string;
          chainName: string;
          rpcUrls: string[];
          iconUrls: string[];
          nativeCurrency: {
            name: string;
            symbol: string;
            decimals: number;
          };
          blockExplorerUrls: string[];
        },
      ];
    }
  | {
      method: typeof WALLET_METHODS.WALLET_SWITCH_ETHEREUM_CHAIN;
      params: [
        {
          chainId: string;
        },
      ];
    };
