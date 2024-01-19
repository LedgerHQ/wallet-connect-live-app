// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** @type {import('next').NextConfig} nextConfig */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["ar", "de", "en", "es", "fr", "ja", "ko", "pt", "ru", "tr", "zh"],
  },
  localePath: path.resolve("./public/locales"),
  compiler: {
    styledComponents: true,
  },
};
