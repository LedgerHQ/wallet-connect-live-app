export const prefixFormat = ['sign', 'code', 'value']
export const suffixFormat = ['sign', 'value', 'separator', 'code']

export const nonBreakableSpace = ' '

export const defaultFormatOptions = {
	locale: 'en-EN',
	// show the currency code
	showCode: false,
	// always show the sign, even if it's a positive value
	alwaysShowSign: false,
	// override showAllDigits of the unit
	showAllDigits: false,
	// disable the feature that only show significant digits
	// and removes the negligible extra digits.
	// (rounding is dynamically applied based on the value. higher value means more rounding)
	disableRounding: false,
	// enable or not the thousands grouping (e.g; 1,234.00)
	useGrouping: true,
	// this allow to increase the number of digits displayed
	// even if the currency don't allow more than this (sub-cent)
	// a value of 1 can display USD 0.006 for instance. 2 can display USD 0.0065
	// NB even if you set 3, USD 4.50 will be display as USD 4.50 , not 4.5000 (extra zeros are not displayed)
	subMagnitude: 0,
	// discrete mode will hide amounts
	discreet: false,
	joinFragmentsSeparator: '',
}

/**
 * Checks if browser supports toLocaleString
 * FROM: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString#checking_for_support_for_locales_and_options_arguments
 */

export const hasToLocaleStringSupport = !!(
	typeof Intl == 'object' &&
	Intl &&
	typeof Intl.NumberFormat == 'function'
)
