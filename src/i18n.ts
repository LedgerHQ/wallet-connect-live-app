import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: "en",
    debug: true,
    // resources: {}, // Where we can put translations' files, not needed if using react Backend
    lng: "en",     // Set the initial language of the App
    defaultNS: 'common',
  })
  .catch(err => console.error(err));

export default i18n;
