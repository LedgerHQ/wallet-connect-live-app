export type ChainMetadata = {
  chainId: string | number;
  name: string;
  logo?: string;
  rgb?: string;
  rpc?: string;
};

export type Network = {
  chainId: number | string;
  namespace: string;
  ticker: string;
  displayName: string;
  color: string;
  decimals?: number;
};
