import zhCN from './zh-CN'
import zhHK from './zh-HK'
import zhTW from './zh-TW'
import en from './en'
import ja from './ja'
import vi from './vi'
import ko from './ko'
import es from './es'
import fr from './fr'
import ptBR from './pt-BR'
import ptPT from './pt-PT'
import ru from './ru'
import de from './de'
import it from './it'
import donationTranslations from './donationTranslations'
import shareTranslations from './shareTranslations'
import shareStudioTranslations from './shareStudioTranslations'
import mergeLocale from './mergeLocale'
import fontTranslations from './fontTranslations'
import sidebarSettingsTranslations from './sidebarSettingsTranslations'
import codeTranslations from './codeTranslations'
import helpImageTranslations from './helpImageTranslations'
import xiaohongshuTranslations from './xiaohongshuTranslations'
import imageSaveTranslations from './imageSaveTranslations'
import settingsActionTranslations from './settingsActionTranslations'
import textFormattingTranslations from './textFormattingTranslations'
import socialShareTranslations from './socialShareTranslations'
import editorShortcutTranslations from './editorShortcutTranslations'
import markdownEditorTranslations from './markdownEditorTranslations'
import markdownShortcutTranslations from './markdownShortcutTranslations'
import aiTranslations from './aiTranslations'

const withDonationTranslations = (code, locale) => ({
  ...locale,
  help: { ...locale.help, ...helpImageTranslations[code], ...editorShortcutTranslations[code] },
  settings: { ...locale.settings, ...fontTranslations[code], ...sidebarSettingsTranslations[code], ...imageSaveTranslations[code], ...settingsActionTranslations[code] },
  editor: { ...locale.editor, ...codeTranslations[code].editor, ...markdownEditorTranslations[code].editor },
  mode: { ...locale.mode, ...codeTranslations[code].mode },
  status: { ...locale.status, ...codeTranslations[code].status, ...markdownShortcutTranslations[code].status },
  formatting: textFormattingTranslations[code],
  donation: donationTranslations[code],
  share: mergeLocale(mergeLocale(mergeLocale(shareTranslations[code], shareStudioTranslations[code]), xiaohongshuTranslations[code]), socialShareTranslations[code]),
  ai: aiTranslations[code] || (code === 'en' ? aiTranslations.en : aiTranslations['zh-CN'])
})

const locales = {
  'zh-CN': withDonationTranslations('zh-CN', zhCN),
  'zh-HK': withDonationTranslations('zh-HK', zhHK),
  'zh-TW': withDonationTranslations('zh-TW', zhTW),
  en: withDonationTranslations('en', en),
  ja: withDonationTranslations('ja', ja),
  vi: withDonationTranslations('vi', vi),
  ko: withDonationTranslations('ko', ko),
  es: withDonationTranslations('es', es),
  fr: withDonationTranslations('fr', fr),
  'pt-BR': withDonationTranslations('pt-BR', ptBR),
  'pt-PT': withDonationTranslations('pt-PT', ptPT),
  ru: withDonationTranslations('ru', ru),
  de: withDonationTranslations('de', de),
  it: withDonationTranslations('it', it)
}

const pluralRulesCache = new Map()
const relativeTimeFormatCache = new Map()
const dateTimeFormatCache = new Map()
const numberFormatCache = new Map()

export const LANGUAGE_OPTIONS = Object.freeze([
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-HK', label: '繁體中文（香港）' },
  { value: 'zh-TW', label: '繁體中文（台灣）' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'ru', label: 'Русский' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' }
])

export const LANGUAGE_PREFERENCES = new Set(['auto', ...LANGUAGE_OPTIONS.map(option => option.value)])

export function normalizeLanguagePreference (preference) {
  if (preference === 'en-US') return 'en'
  return LANGUAGE_PREFERENCES.has(preference) ? preference : 'auto'
}

export function resolveLocale (preference = 'auto', systemLanguage) {
  const normalizedPreference = normalizeLanguagePreference(preference)
  if (normalizedPreference !== 'auto') return normalizedPreference

  const raw = String(systemLanguage || (typeof navigator !== 'undefined' ? navigator.languages?.[0] || navigator.language : '') || 'zh-CN')
  const normalized = raw.replace('_', '-').toLowerCase()
  const parts = normalized.split('-')
  if (parts[0] === 'zh' && (parts.includes('hk') || parts.includes('mo'))) return 'zh-HK'
  if (parts[0] === 'zh' && (parts.includes('tw') || parts.includes('hant'))) return 'zh-TW'
  if (parts[0] === 'zh') return 'zh-CN'
  if (normalized.startsWith('pt-br')) return 'pt-BR'
  if (normalized.startsWith('pt')) return 'pt-PT'
  const base = parts[0]
  return Object.prototype.hasOwnProperty.call(locales, base) ? base : 'zh-CN'
}

function readValue (source, key) {
  return key.split('.').reduce((value, part) => (
    value && typeof value === 'object' && part in value ? value[part] : undefined
  ), source)
}

function resolvePlural (value, locale, params) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || params.count == null) return value
  const exact = value[`=${params.count}`]
  if (typeof exact === 'string') return exact
  let pluralRules = pluralRulesCache.get(locale)
  if (!pluralRules) {
    pluralRules = new Intl.PluralRules(locale)
    pluralRulesCache.set(locale, pluralRules)
  }
  const category = pluralRules.select(Number(params.count))
  return value[category] ?? value.other
}

export function t (language, key, params = {}) {
  const locale = resolveLocale(language)
  let value = readValue(locales[locale], key)
  if (value === undefined) value = readValue(locales['zh-CN'], key)
  value = resolvePlural(value, locale, params)
  if (typeof value !== 'string') return key
  return value.replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  ))
}

export function formatRelativeTime (timestamp, language) {
  const locale = resolveLocale(language)
  const elapsed = Date.now() - Number(timestamp)
  if (elapsed < 60000) return t(locale, 'time.justNow')
  let relativeTimeFormat = relativeTimeFormatCache.get(locale)
  if (!relativeTimeFormat) {
    relativeTimeFormat = new Intl.RelativeTimeFormat(locale, { numeric: 'always' })
    relativeTimeFormatCache.set(locale, relativeTimeFormat)
  }
  if (elapsed < 3600000) return relativeTimeFormat.format(-Math.floor(elapsed / 60000), 'minute')
  if (elapsed < 86400000) return relativeTimeFormat.format(-Math.floor(elapsed / 3600000), 'hour')
  const date = new Date(timestamp)
  const now = new Date()
  const includeYear = date.getFullYear() !== now.getFullYear()
  const dateTimeKey = `${locale}:${includeYear ? 'year' : 'no-year'}`
  let dateTimeFormat = dateTimeFormatCache.get(dateTimeKey)
  if (!dateTimeFormat) {
    dateTimeFormat = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
      ...(includeYear ? { year: 'numeric' } : {})
    })
    dateTimeFormatCache.set(dateTimeKey, dateTimeFormat)
  }
  return dateTimeFormat.format(date)
}

export function formatHistoryAge (days, language = 'zh-CN') {
  const value = Math.max(1, Math.round(Number(days) || 1))
  if (value < 30) return t(language, 'age.days', { count: value })
  if (value < 365) return t(language, 'age.months', { count: Math.round(value / 30) })
  const years = value / 365
  const count = Number.isInteger(years) ? years : Number(years.toFixed(1))
  const locale = resolveLocale(language)
  let numberFormat = numberFormatCache.get(locale)
  if (!numberFormat) {
    numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
    numberFormatCache.set(locale, numberFormat)
  }
  return t(language, 'age.years', { count: numberFormat.format(count) })
}

export { locales }
