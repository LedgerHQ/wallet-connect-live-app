export const getDefaultLanguage = (
	fallbackLang: string,
	locales?: string[],
	lang?: string,
	locale?: string,
): string => {
	if (lang && locales?.includes(lang)) return lang
	if (locale && locales?.includes(locale)) return locale
	return fallbackLang
}

export const compareETHAddresses = (addr1: string, addr2: string) => addr1.toLowerCase() === addr2.toLowerCase()