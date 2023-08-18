import { getFormattedCurrency } from "./helpers"

type GetSeparators = (locale: string) => {
  decimal: string
  thousands: string
}

/**
 * Get localized decimal and thousands separators
 */
export const getLocaleSeparators: GetSeparators = (locale) => {
  const formattedNumber = getFormattedCurrency(locale)

  let decimal = ""
  let thousands = ""

  for (const char of formattedNumber) {
    if (/[0-9]/.test(char)) continue // ignore numbers

    if (!thousands && typeof char === "string") {
      thousands = char // first non number (separator) found that indicates thousands
    } else if (typeof char === "string") {
      decimal = char // second non number (separator) found that indicates decimals
    }
  }

  return {
    decimal,
    thousands,
  }
}
