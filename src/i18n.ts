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
      'ar': ['ar-AR', 'en'],
      'de': ['de-DE', 'en'],
      'es': ['es-ES', 'en'],
      'fr': ['fr-FR', 'en'],
      'ja': ['ja-JP', 'en'],
      'ko': ['ko-KR', 'en'],
      'pt': ['pt-BR', 'en'],
      'ru': ['ru-RU', 'en'],
      'tr': ['tr-TR', 'en'],
      'zh': ['zh-CN', 'en'],
      'default': ['en']
    },
  })
  .catch(err => console.error(err));

export default i18n;
