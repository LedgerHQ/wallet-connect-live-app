import BigNumber from "bignumber.js";
import {
  defaultFormatOptions,
  nonBreakableSpace,
  prefixFormat,
  suffixFormat,
} from "./constants";
import { getLocaleSeparators } from "./separators";
import {
  FormatFragment,
  FormatFragmentTypes,
  SupportedOptions,
  Unit,
} from "./types";

/**
 * Returns a BigNumber format data structure based on locale
 */
const getLocaleFormat = (
  locale: string,
  useGrouping: boolean,
): BigNumber.Format => {
  const { decimal, thousands } = getLocaleSeparators(locale);
  return {
    decimalSeparator: decimal,
    groupSeparator: useGrouping ? thousands : "",
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: "\xA0", // non-breaking space
    fractionGroupSize: 0,
  };
};

/**
 * Returns a Big Number with format applied and correct decimal places
 */
const getFormattedBigNumber = (
  n: BigNumber,
  format: BigNumber.Format,
  decimalPlaces: number,
): string => {
  const configBigNumber = BigNumber.clone({
    FORMAT: format,
  });
  return new configBigNumber(n).toFormat(decimalPlaces, BigNumber.ROUND_FLOOR);
};

export const toLocaleString = (
  n: BigNumber,
  locale = "en",
  options: Partial<SupportedOptions> = {},
): string => {
  const {
    minDecimalPlaces = 0,
    maxDecimalPlaces = Math.max(minDecimalPlaces, 3),
  } = options;

  const grouping = options.useGrouping ?? true;
  const format = getLocaleFormat(locale, grouping);
  const nWithMaxDecimalPlaces = getFormattedBigNumber(
    n,
    format,
    maxDecimalPlaces,
  );

  if (maxDecimalPlaces !== minDecimalPlaces) {
    const nWithMinDecimalPlaces = getFormattedBigNumber(
      n,
      format,
      minDecimalPlaces,
    );
    let i = nWithMaxDecimalPlaces.length;

    // cleanup useless '0's from the right until the minDecimalPlaces
    while (i > nWithMinDecimalPlaces.length) {
      if (nWithMaxDecimalPlaces[i - 1] !== "0") {
        if (nWithMaxDecimalPlaces[i - 1] === format.decimalSeparator) {
          i--;
        }

        break; // we reach decimal. stop now.
      }

      i--;
    }

    return nWithMaxDecimalPlaces.slice(0, i);
  }

  return nWithMaxDecimalPlaces;
};

export function formatCurrencyUnitFragment(
  unit: Unit,
  value: BigNumber,
  _options?: Partial<typeof defaultFormatOptions>,
): FormatFragment[] {
  if (!BigNumber.isBigNumber(value)) {
    console.warn("formatCurrencyUnit called with value=", value);
    return [];
  }

  if (value.isNaN()) {
    console.warn("formatCurrencyUnit called with NaN value!");
    return [];
  }

  if (!value.isFinite()) {
    console.warn("formatCurrencyUnit called with infinite value=", value);
    return [];
  }

  const options: Partial<typeof defaultFormatOptions> = {};

  for (const k in _options) {
    // sanitize the undefined value
    if (_options[k as never] !== undefined) {
      options[k as never] = _options[k as never];
    }
  }

  const {
    showCode,
    alwaysShowSign,
    showAllDigits,
    locale,
    disableRounding,
    useGrouping,
    subMagnitude,
    discreet,
  } = { ...defaultFormatOptions, ...unit, ...options };
  const { magnitude, code } = unit;
  const floatValue = value.div(new BigNumber(10).pow(magnitude));
  const floatValueAbs = floatValue.abs();
  const minDecimalPlaces = showAllDigits ? magnitude : 0;
  const maxDecimalPlaces = disableRounding
    ? magnitude + subMagnitude
    : Math.max(
        minDecimalPlaces,
        Math.max(
          0, // dynamic max number of digits based on the value itself. to only show significant part
          Math.min(
            4 - Math.round(Math.log10(floatValueAbs.toNumber())),
            magnitude + subMagnitude,
            8,
          ),
        ),
      );

  const fragValueByKind = {
    sign:
      alwaysShowSign || floatValue.isNegative()
        ? floatValue.isNegative()
          ? "-"
          : "+"
        : null,
    code: showCode ? code : null,
    value: discreet
      ? "***"
      : toLocaleString(floatValueAbs, locale, {
          maxDecimalPlaces,
          minDecimalPlaces,
          useGrouping,
        }),
    separator: nonBreakableSpace,
  };
  const frags: FormatFragment[] = [];
  let nonSepIndex = -1;
  let sepConsumed = true;

  const prefixOrSuffixFormat = unit.prefixCode ? prefixFormat : suffixFormat;

  prefixOrSuffixFormat.forEach((kind) => {
    const v = fragValueByKind[kind as never];
    if (!v) return;
    const isSep = kind === "separator";
    if (sepConsumed && isSep) return;
    sepConsumed = isSep;
    if (!isSep) nonSepIndex = frags.length;
    frags.push({
      kind: kind as FormatFragmentTypes,
      value: v,
    });
  });
  frags.splice(nonSepIndex + 1); // remove extra space at the end

  return frags;
}

export function formatCurrencyUnit(
  unit: Unit,
  value: BigNumber,
  options?: Partial<typeof defaultFormatOptions>,
): string {
  const joinFragmentsSeparator =
    options?.joinFragmentsSeparator ??
    defaultFormatOptions.joinFragmentsSeparator;
  return formatCurrencyUnitFragment(unit, value, options)
    .map((f) => f.value)
    .join(joinFragmentsSeparator);
}
