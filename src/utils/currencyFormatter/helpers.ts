import { hasToLocaleStringSupport } from "./constants";

/**
 * Get formatted currency string
 */
export const getFormattedCurrency = (
  locale: string,
  supportsToLocaleString: boolean = hasToLocaleStringSupport,
): string => {
  // Fallback list that mimics the output of toLocaleString
  const toLocaleStringsMock: Record<string, string> = {
    en: "10,000.2",
    es: "10.000,2",
    fr: "10 000,2",
    ja: "10,000.2",
    ko: "10,000.2",
    ru: "10 000,2",
    zh: "10,000.2",
  };

  return supportsToLocaleString
    ? (10000.2).toLocaleString(locale)
    : toLocaleStringsMock[locale] ?? toLocaleStringsMock.en;
};

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const isHexPrefixed = (str: string): boolean => {
  if (typeof str !== "string") {
    throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`);
  }

  return str.startsWith("0x");
};

// Copied from https://www.npmjs.com/package/ethereumjs-util
// add /^[0-9a-fA-F]+$/.test(stripHexPrefix(str)); to check if the string is a valid hex string
export const stripHexPrefix = (str: string): string => {
  if (typeof str !== "string")
    throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);

  return isHexPrefixed(str) && /^[0-9a-fA-F]+$/.test( str.slice(2)) ? str.slice(2) : str;
};


export function isValidUTF8(hexString: string) {
  try {
    const bytes = hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
    if (!bytes) throw new Error('Invalid hex string');

    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(new Uint8Array(bytes)); 
    return true;
  } catch {
    return false;
  }
}