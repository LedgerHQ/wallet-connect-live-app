import { SUPPORTED_NETWORK } from "@/data/network.config"

export function isDataInvalid(data: Buffer | undefined) {
  return !data || Buffer.from(data.toString("hex"), "hex").toString("hex").length === 0
}

/**
 * Truncates string (in the middle) via given lenght value
 */
export function truncate(value: string, length: number) {
  if (value?.length <= length) {
    return value
  }

  const separator = "..."
  const stringLength = length - separator.length
  const frontLength = Math.ceil(stringLength / 2)
  const backLength = Math.floor(stringLength / 2)

  return value.substring(0, frontLength) + separator + value.substring(value.length - backLength)
}

/**
 * Get our address from params checking if params string contains one
 * of our wallet addresses
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWalletAddressFromParams(addresses: string[], params: any) {
  const paramsString = JSON.stringify(params)
  let address = ""

  addresses.forEach((addr) => {
    if (paramsString.toLowerCase().includes(addr.toLowerCase())) {
      address = addr
    }
  })

  return address
}

/**
 * Check if chain is part of EIP155 standard
 */
export function isEIP155Chain(chain: string) {
  return chain.includes("eip155")
}

/**
 * Check if chain is part of COSMOS standard
 */
export function isCosmosChain(chain: string) {
  return chain.includes("cosmos")
}

/**
 * Check if chain is part of SOLANA standard
 */
export function isSolanaChain(chain: string) {
  return chain.includes("solana")
}

/**
 * Check if chain is part of POLKADOT standard
 */
export function isPolkadotChain(chain: string) {
  return chain.includes("polkadot")
}

/**
 * Check if chain is part of NEAR standard
 */
export function isNearChain(chain: string) {
  return chain.includes("near")
}

/**
 * Check if chain is part of ELROND standard
 */
export function isElrondChain(chain: string) {
  return chain.includes("elrond")
}

/**
 * Formats url to to remove protocol
 */
export function formatUrl(url: string) {
  return url.split("//")[1]
}

export const getNetwork = (chain: string) => SUPPORTED_NETWORK[chain]

export const getTicker = (chain: string) => SUPPORTED_NETWORK[chain].ticker
export const getColor = (chain: string) => SUPPORTED_NETWORK[chain]?.color
export const getDisplayName = (chain: string) => SUPPORTED_NETWORK[chain]?.displayName ?? chain
export const getNamespace = (chain: string) => SUPPORTED_NETWORK[chain]?.namespace ?? chain

export const getCurrencyByChainId = (chainId: string) => {
  const elem = Object.entries(SUPPORTED_NETWORK).find(
    ([, network]) => network.namespace === chainId.toLowerCase(),
  )
  return elem?.[0] ?? chainId
}
