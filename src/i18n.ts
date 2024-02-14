import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    load: 'all',
    // resources: {}, // Where we can put translations' files, not needed if using react Backend
    lng: "en",     // Set the initial language of the App
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    fallbackLng: {
      'ar': ['ar-AR'],
      'de': ['de-DE'],
      'es': ['es-ES'],
      'fr': ['fr-FR'],
      'ja': ['ja-JP'],
      'ko': ['ko-KR'],
      'pt': ['pt-BR'],
      'ru': ['ru-RU'],
      'tr': ['tr-TR'],
      'zh': ['zh-CN'],
      'default': ['en']
    },
  })
  .catch(err => console.error(err));

export default i18n;
