import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'

/** English is the source of truth: every key is authored here first, and every
 *  other language pack is a translation of this file. Missing keys anywhere
 *  else fall back to EN rather than rendering a raw key at the user.
 */
export const DEFAULT_LANGUAGE = 'en'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'lv', label: 'Latvian', nativeLabel: 'Latviešu' },
] as const

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

/** Language packs other than EN load on demand, so a first paint never waits
 *  on a translation file the visitor may not need. */
const LAZY_PACKS: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  de: () => import('./locales/de.json'),
  fr: () => import('./locales/fr.json'),
  es: () => import('./locales/es.json'),
  lv: () => import('./locales/lv.json'),
}

export async function loadLanguage(code: string) {
  if (code === DEFAULT_LANGUAGE || i18n.hasResourceBundle(code, 'translation')) {
    return i18n.changeLanguage(code)
  }
  const load = LAZY_PACKS[code]
  if (!load) {
    console.warn(`[i18n] No language pack for "${code}" — staying on ${i18n.language}.`)
    return
  }
  const pack = await load()
  i18n.addResourceBundle(code, 'translation', pack.default, true, true)
  return i18n.changeLanguage(code)
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    lng: undefined, // let the detector decide, falling back to EN
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bartefy.lang',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false }, // React already escapes
    returnNull: false,
  })

/** Keep <html lang> honest for screen readers and the browser's own translate
 *  prompt. */
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export default i18n
