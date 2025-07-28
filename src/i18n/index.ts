import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import mrTranslations from './locales/mr.json';

const resources = {
  en: {
    translation: enTranslations
  },
  mr: {
    translation: mrTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true,
    },

    whitelist: ['en', 'mr'],
    
    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
    }
  });

// Add event listener for language changes to ensure UI updates
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  // Force a small delay to ensure all components re-render
  setTimeout(() => {
    window.dispatchEvent(new Event('languagechange'));
  }, 50);
});

export default i18n;