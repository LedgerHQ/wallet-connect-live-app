import { captureException, captureMessage, SeverityLevel } from '@sentry/nextjs'

export const useErrors = () => {
	const captureError = (
		error: Error,
		customTags?: {
			[key: string]: string
		},
	) => {
		captureException(error, {
			tags: customTags,
		})
	}

	const captureInfoMessage = (error: string, severity?: SeverityLevel) => {
		captureMessage(error, severity)
	}

	const throwError = (error: string) => {
		throw new Error(error)
	}

	return {
		captureError,
		captureInfoMessage,
		throwError,
	}
}
