/**
 * i18n Configuration for Multi-language Support
 * [COPILOT-UPGRADE]: Added support for English, Hindi, Marathi, and more
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import mrTranslations from './locales/mr.json';

const resources = {
  en: enTranslations,
  hi: hiTranslations,
  mr: mrTranslations
};

// Detect user's preferred language
const detectLanguage = () => {
  const saved = localStorage.getItem('preferredLanguage');
  if (saved) return saved;

  const browserLang = navigator.language.split('-')[0];
  return ['en', 'hi', 'mr'].includes(browserLang) ? browserLang : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
  console.info('[COPILOT-UPGRADE]', `Language changed to: ${lng}`);
});

export default i18n;
