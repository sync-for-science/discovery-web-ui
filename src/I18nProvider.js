import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import i18n from 'i18next';
// import LanguageDetector from 'i18next-browser-languagedetector'; // for now: always en-US
import { initReactI18next, I18nextProvider } from 'react-i18next';

import enTranslations from './translations/en.json';

/**
 * https://www.i18next.com/principles/namespaces
 */
const defaultNamespace = 'common';

const defaultLocale = 'en-US';

// https://react.i18next.com/latest/using-with-hooks

i18n.use(initReactI18next).init({
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  ns: [defaultNamespace],
  defaultNS: defaultNamespace,
  debug: false,
  resources: {
    en: { [defaultNamespace]: enTranslations },
  },
  returnObjects: true, // support js Arrays and Objects in translation files
  saveMissing: true, // enables missingKeyHandler
  missingKeyHandler: (lng, ns, key, fallbackValue) => { // detect and fail specs, if missing key detected:
    console.warn('warning: missing translation: ', JSON.stringify({ // eslint-disable-line no-console
      lng, ns, key, fallbackValue,
    }, null, '  '));
  },
  react: {
    useSuspense: false,
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'b', 'i', 'strong'], // limited support for attributes -- use ReactMarkdown for <a href="...">
  },
});

const I18nContext = React.createContext({
  language: defaultLocale,
  setLanguage: () => {},
});

const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(defaultLocale);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={{
        language,
        setLanguage,
      }}
      >
        {children}
      </I18nContext.Provider>
    </I18nextProvider>
  );
};

I18nProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { i18n };

export default I18nProvider;
