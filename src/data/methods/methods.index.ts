import { SupportedNamespace } from "../network.config"
import { COSMOS_SIGNING_METHODS } from "./COSMOSData.methods"
import { EIP155_SIGNING_METHODS } from "./EIP155Data.methods"

export const SUPPORTED_NAMESPACE_METHODS = {
  [SupportedNamespace.EIP155]: {
    ...EIP155_SIGNING_METHODS,
  },
  [SupportedNamespace.Cosmos]: {
    ...COSMOS_SIGNING_METHODS,
  },
}
