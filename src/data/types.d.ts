export type ChainMetadata = {
  chainId: string | number
  name: string
  logo?: string
  rgb?: string
  rpc?: string
}

interface Chains {
  [key: string]: ChainMetadata
}
export type Network = {
  chainId: number | string
  namespace: string
  ticker: string
  displayName: string
}
