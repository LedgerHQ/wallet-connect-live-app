import { SUPPORTED_NAMESPACE } from '../network.config'
import { COSMOS_SIGNING_METHODS } from './COSMOSData.methods'
import { EIP155_SIGNING_METHODS } from './EIP155Data.methods'

export const SUPPORTED_NAMESPACE_METHODS = {
	[SUPPORTED_NAMESPACE.eip155]: {
		...EIP155_SIGNING_METHODS,
	},
	[SUPPORTED_NAMESPACE.cosmos]: {
		...COSMOS_SIGNING_METHODS,
	},
}
