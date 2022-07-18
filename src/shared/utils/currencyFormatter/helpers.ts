import { hasToLocaleStringSupport } from './constants'

/**
 * Get formatted currency string
 */
export const getFormattedCurrency = (
	locale: string,
	supportsToLocaleString: boolean = hasToLocaleStringSupport,
): string => {
	// Fallback list that mimics the output of toLocaleString
	const toLocaleStringsMock: Record<string, string> = {
		en: '10,000.2',
		es: '10.000,2',
		fr: '10 000,2',
		ja: '10,000.2',
		ko: '10,000.2',
		ru: '10 000,2',
		zh: '10,000.2',
	}

	return supportsToLocaleString
		? (10000.2).toLocaleString(locale)
		: toLocaleStringsMock[locale] || toLocaleStringsMock.en
}
