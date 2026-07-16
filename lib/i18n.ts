import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../locales/en.json';
import ar from '../locales/ar.json';

const STORAGE_KEY = 'app_language';

// Detect persisted language
async function getInitialLanguage(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ar') return saved;
  } catch {
    // ignore — fall back to default
  }
  return 'en';
}

// Apply RTL setting
function applyRTL(lng: string) {
  const rtl = lng === 'ar';
  I18nManager.forceRTL(rtl);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

// Load persisted language on startup
getInitialLanguage().then((lng) => {
  i18n.changeLanguage(lng);
  applyRTL(lng);
});

// Persist + apply RTL whenever language changes
i18n.on('languageChanged', (lng) => {
  applyRTL(lng);
  AsyncStorage.setItem(STORAGE_KEY, lng).catch(() => {});
});

export default i18n;