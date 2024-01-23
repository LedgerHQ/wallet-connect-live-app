import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: "en",
    debug: true,

    // interpolation: {
    //   escapeValue: false, // not needed for react as it escapes by default
    // },
    // resources: {}, // Where we're gonna put translations' files
    lng: "en",     // Set the initial language of the App
    defaultNS: 'common',
  });

export default i18n;
