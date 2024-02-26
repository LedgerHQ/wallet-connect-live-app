import { describe, expect, it } from 'vitest'
import BigNumber from "bignumber.js";
import formatCurrencyUnit from "..";
import { toLocaleString } from "../formatCurrency";

function getNumberWithMagnitude(str: string | number = "123456789") {
  const unit = { code: "BTC", magnitude: 3, name: "bitcoin" };
  const bigN = new BigNumber(str);

  return (magnitude: number) => {
    return formatCurrencyUnit({ ...unit, magnitude }, bigN);
  };
}

function getNumberWithLocale(str: string | number = "123456789", locale?: string) {
  const unit = { code: "BTC", magnitude: 1, name: "bitcoin" };
  const bigN = new BigNumber(str);

  return formatCurrencyUnit(unit, bigN, { locale });
}

function getNumberWithCode(showCode = false, str: string | number = "123456789") {
  const unit = { code: "BTC", magnitude: 3, name: "bitcoin" };
  const bigN = new BigNumber(str);

  return formatCurrencyUnit(unit, bigN, { showCode });
}

describe("Currency formatter test", () => {
  it("should return currency with and without code", () => {
    expect(getNumberWithCode()).toBe("123,456");
    expect(getNumberWithCode(true)).toBe("123,456 BTC");
  });

  it("should localize numbers", () => {
    const n = "123456789";
    expect(getNumberWithLocale(n, "fr")).toBe("12 345 678");
    expect(getNumberWithLocale(n, "pt")).toBe("12.345.678");
    expect(getNumberWithLocale(n)).toBe("12,345,678");

    expect(getNumberWithLocale(n, "ban")).toBe("12,345,678"); // invalid locale uses en separators as default

    expect(getNumberWithLocale(123456789.98765, "fr")).toBe("12 345 678"); // invalid locale uses en separators as default
  });

  it("should use magnitude correctly", () => {
    const n = 1234.4321;
    expect(getNumberWithMagnitude(n)(-5)).toBe("123,443,210");
    expect(getNumberWithMagnitude(n)(-4)).toBe("12,344,321");
    expect(getNumberWithMagnitude(n)(-3)).toBe("1,234,432");
    expect(getNumberWithMagnitude(n)(-2)).toBe("123,443");
    expect(getNumberWithMagnitude(n)(-1)).toBe("12,344");

    expect(getNumberWithMagnitude(n)(0)).toBe("1,234");

    expect(getNumberWithMagnitude(n)(1)).toBe("123.4");
    expect(getNumberWithMagnitude(n)(2)).toBe("12.34");
    expect(getNumberWithMagnitude(n)(3)).toBe("1.234");
    expect(getNumberWithMagnitude(n)(4)).toBe("0.1234");
    expect(getNumberWithMagnitude(n)(5)).toBe("0.01234");

    expect(getNumberWithMagnitude("10000000000000000")(18)).toBe("0.01");
  });
});

/**
 * IMPORTED TESTS FROM LEDGER LIVE DESKTOP
 */
describe("Ledger Live Desktop imported tests", () => {
  it("basic toLocaleString usage", () => {
    expect(toLocaleString(new BigNumber(0))).toBe("0");
    expect(toLocaleString(new BigNumber(8))).toBe("8");
    expect(toLocaleString(new BigNumber(123))).toBe("123");
    expect(toLocaleString(new BigNumber(0.001))).toBe("0.001");
    expect(toLocaleString(new BigNumber(13.1))).toBe("13.1");
    expect(toLocaleString(new BigNumber(123.01))).toBe("123.01");
    expect(toLocaleString(new BigNumber(123.012))).toBe("123.012");
    expect(toLocaleString(new BigNumber(1123))).toBe("1,123");
    expect(toLocaleString(new BigNumber("9999999999999999"))).toBe("9,999,999,999,999,999");
    expect(toLocaleString(new BigNumber("9999999999999.99"))).toBe("9,999,999,999,999.99");
  });
  it("toLocaleString to default maxDecimalPlaces to 3", () => {
    expect(toLocaleString(new BigNumber(4.44444))).toBe("4.444");
    expect(toLocaleString(new BigNumber(444444.444444444))).toBe("444,444.444");
    expect(toLocaleString(new BigNumber(0.444444444))).toBe("0.444");
    expect(toLocaleString(new BigNumber(9.99999))).toBe("9.999");
    expect(toLocaleString(new BigNumber(111111.111111111))).toBe("111,111.111");
    expect(toLocaleString(new BigNumber(0.999999999))).toBe("0.999");
    expect(toLocaleString(new BigNumber(9.5))).toBe("9.5");
    expect(toLocaleString(new BigNumber(9.9))).toBe("9.9");
    expect(toLocaleString(new BigNumber(99.6))).toBe("99.6");
    expect(toLocaleString(new BigNumber(99.8))).toBe("99.8");
    expect(toLocaleString(new BigNumber(999.7))).toBe("999.7");
    expect(toLocaleString(new BigNumber(999.9))).toBe("999.9");
    expect(toLocaleString(new BigNumber(999999.7))).toBe("999,999.7");
    expect(toLocaleString(new BigNumber(999999.9))).toBe("999,999.9");
  });
  it("toLocaleString minDecimalPlaces", () => {
    expect(
      toLocaleString(new BigNumber(0), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("0.0");
    expect(
      toLocaleString(new BigNumber(8), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("8.0");
    expect(
      toLocaleString(new BigNumber(123), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("123.0");
    expect(
      toLocaleString(new BigNumber(0.001), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("0.001");
    expect(
      toLocaleString(new BigNumber(9.5), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("9.5");
    expect(
      toLocaleString(new BigNumber(9.6), "en", {
        minDecimalPlaces: 2,
      }),
    ).toBe("9.60");
    expect(
      toLocaleString(new BigNumber(13.1), "en", {
        minDecimalPlaces: 3,
      }),
    ).toBe("13.100");
    expect(
      toLocaleString(new BigNumber(123.01), "en", {
        minDecimalPlaces: 5,
      }),
    ).toBe("123.01000");
    expect(
      toLocaleString(new BigNumber(123.012), "en", {
        minDecimalPlaces: 10,
      }),
    ).toBe("123.0120000000");
    expect(
      toLocaleString(new BigNumber(1123), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("1,123.0");
    expect(
      toLocaleString(new BigNumber("9999999999999999"), "en", {
        minDecimalPlaces: 1,
      }),
    ).toBe("9,999,999,999,999,999.0");
    expect(
      toLocaleString(new BigNumber("9999999999999.999"), "en", {
        minDecimalPlaces: 5,
      }),
    ).toBe("9,999,999,999,999.99900");
  });

  it("toLocaleString minDecimalPlaces and maxDecimalPlaces", () => {
    expect(
      toLocaleString(new BigNumber(1), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("1.0");
    expect(
      toLocaleString(new BigNumber(1.003), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("1.003");
    expect(
      toLocaleString(new BigNumber(1.000003), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("1.0");
    expect(
      toLocaleString(new BigNumber(1.333333333333), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("1.33333");
    expect(
      toLocaleString(new BigNumber(0), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("0.0");
    expect(
      toLocaleString(new BigNumber(0.003), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("0.003");
    expect(
      toLocaleString(new BigNumber(0.000003), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 5,
      }),
    ).toBe("0.0");
    expect(
      toLocaleString(new BigNumber(9.7), "en", {
        minDecimalPlaces: 1,
        maxDecimalPlaces: 1,
      }),
    ).toBe("9.7");
    expect(
      toLocaleString(new BigNumber("4.4444444444444444444411111111111111"), "en", {
        maxDecimalPlaces: 20,
      }),
    ).toBe("4.44444444444444444444");
  });
});
