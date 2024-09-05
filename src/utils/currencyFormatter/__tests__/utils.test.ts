import { describe, expect, it, vi } from "vitest";
import BigNumber from "bignumber.js";
import { defaultFormatOptions } from "../constants";
import { formatCurrencyUnitFragment, toLocaleString } from "../formatCurrency";
import { getFormattedCurrency } from "../helpers";
import { getLocaleSeparators } from "../separators";

const getNumberWithOptions = (
  str: string | number,
  options: Partial<typeof defaultFormatOptions>,
): string => toLocaleString(new BigNumber(str), "en", options);

describe("getFormattedCurrency tests", () => {
  it("should always return a string", () => {
    const enFormat = "10,000.2";
    expect(getFormattedCurrency("fr", true)).toBe("10 000,2");
    expect(getFormattedCurrency("en", true)).toBe(enFormat);
    expect(getFormattedCurrency("ban", true)).toBe(enFormat); // invalid locale uses en separators as default
    expect(getFormattedCurrency("en", false)).toBe(enFormat); // does not support toLocaleString method
    expect(getFormattedCurrency("ban", false)).toBe(enFormat); // does not support toLocaleString method and invalid locale
  });
});

describe("getLocaleSeparators tests", () => {
  it("should always return a decimals and thousands separators", () => {
    const enSeparators = {
      decimal: ".",
      thousands: ",",
    };
    expect(getLocaleSeparators("fr")).toEqual({
      decimal: ",",
      thousands: " ",
    });
    expect(getLocaleSeparators("en")).toEqual(enSeparators);
    expect(getLocaleSeparators("ban")).toEqual(enSeparators); // invalid locale uses en separators as default
  });
});

describe("getNumberWithOptions tests", () => {
  it("should use useGrouping option correctly", () => {
    const n = 123456789;
    expect(getNumberWithOptions(n, { useGrouping: false })).toBe("123456789");
    expect(getNumberWithOptions(n, { useGrouping: true })).toBe("123,456,789");

    expect(getNumberWithOptions(n, {})).toBe("123,456,789"); // defaults to true
  });
});

describe("formatCurrencyUnitFragment tests", () => {
  const unit = { code: "BTC", magnitude: 0, name: "bitcoin" };
  it("should validate big number input", () => {
    const consoleWarnMock = vi.spyOn(console, "warn").mockImplementation(() => {
      return;
    }); // mock console.warn to clean warnings while running this test

    expect(
      formatCurrencyUnitFragment(unit, new BigNumber("not a number")),
    ).toEqual([]);

    expect(formatCurrencyUnitFragment(unit, new BigNumber(Infinity))).toEqual(
      [],
    );
    expect(formatCurrencyUnitFragment(unit, 42 as never)).toEqual([]); // passing a literal value. TS enforces it to be a BigNumber, so as never was used

    consoleWarnMock.mockRestore(); // restore console.warn
  });

  it("should show all digits", () => {
    expect(
      formatCurrencyUnitFragment(unit, new BigNumber(123456789.876), {
        showAllDigits: true,
      }),
    ).toEqual([{ kind: "value", value: "123,456,789" }]);
  });

  it("should show disable rounding", () => {
    expect(
      formatCurrencyUnitFragment(unit, new BigNumber(12.345678), {
        disableRounding: true,
      }),
    ).toEqual([
      {
        kind: "value",
        value: "12",
      },
    ]);
  });

  it("should support negative floats", () => {
    expect(formatCurrencyUnitFragment(unit, new BigNumber(-12.345678))).toEqual(
      [
        { kind: "sign", value: "-" },
        {
          kind: "value",
          value: "12",
        },
      ],
    );
  });

  it("should always show sign", () => {
    expect(formatCurrencyUnitFragment(unit, new BigNumber(-12.345678))).toEqual(
      [
        { kind: "sign", value: "-" },
        {
          kind: "value",
          value: "12",
        },
      ],
    );

    expect(
      formatCurrencyUnitFragment(unit, new BigNumber(12.345678), {
        alwaysShowSign: true,
      }),
    ).toEqual([
      { kind: "sign", value: "+" },
      {
        kind: "value",
        value: "12",
      },
    ]);
  });

  it("should support discreet option", () => {
    expect(
      formatCurrencyUnitFragment(unit, new BigNumber(123456789.876), {
        discreet: true,
      }),
    ).toEqual([{ kind: "value", value: "***" }]);
  });

  it("return currency with and without code as a prefix or as suffix", () => {
    // no blank separator as a prefix
    expect(
      formatCurrencyUnitFragment(
        {
          code: "BTC",
          magnitude: 0,
          name: "bitcoin",
          prefixCode: true,
        },
        new BigNumber(123456789.876),
        { showCode: true },
      ),
    ).toEqual([
      { kind: "code", value: "BTC" },
      {
        kind: "value",
        value: "123,456,789",
      },
    ]);

    expect(
      formatCurrencyUnitFragment(
        {
          code: "BTC",
          magnitude: 0,
          name: "bitcoin",
        },
        new BigNumber(123456789.876),
        { showCode: true },
      ),
    ).toEqual([
      {
        kind: "value",
        value: "123,456,789",
      },
      {
        kind: "separator",
        value: " ",
      },
      { kind: "code", value: "BTC" },
    ]);
  });
});
