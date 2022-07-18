export type Unit = {
	// display name of a given unit (example: satoshi)
	name: string
	// string to use when formatting the unit. like 'BTC' or 'USD'
	code: string
	// number of digits after the '.'
	magnitude: number
	// should it always print all digits even if they are 0 (usually: true for fiats, false for cryptos)
	showAllDigits?: boolean
	// true if the code should prefix amount when formatting
	prefixCode?: boolean
}

export type SupportedOptions = {
	minDecimalPlaces: number
	maxDecimalPlaces: number
	useGrouping: boolean
}

export type FormatFragment =
	| {
			kind: 'value'
			value: string
	  }
	| {
			kind: 'sign'
			value: string
	  }
	| {
			kind: 'code'
			value: string
	  }
	| {
			kind: 'separator'
			value: string
	  }
export type FormatFragmentTypes = 'value' | 'sign' | 'code' | 'separator'
