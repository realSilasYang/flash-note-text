import { DEFAULT_CONTENT_FONT, DEFAULT_INTERFACE_FONT } from './constants'

export { DEFAULT_CONTENT_FONT, DEFAULT_INTERFACE_FONT }

const FALLBACK_FONT_FAMILIES = [
  'PingFang SC',
  'Microsoft YaHei',
  'Yu Gothic UI',
  'Meiryo',
  'Malgun Gothic',
  'Segoe UI',
  'Arial',
  'sans-serif'
]

const GENERIC_FONT_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
  'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
  'emoji', 'math', 'fangsong'
])

function containsControlCharacter (value) {
  return [...value].some(character => {
    const code = character.charCodeAt(0)
    return code <= 0x1F || code === 0x7F
  })
}

function normalizeFont (value, fallback) {
  if (typeof value !== 'string') return fallback
  const font = value.trim()
  if (!font || font.length > 120 || containsControlCharacter(font)) return fallback
  return font
}

export function normalizeInterfaceFont (value) {
  return normalizeFont(value, DEFAULT_INTERFACE_FONT)
}

export function normalizeContentFont (value) {
  return normalizeFont(value, DEFAULT_CONTENT_FONT)
}

function quoteNormalizedFontFamily (font) {
  if (GENERIC_FONT_FAMILIES.has(font.toLowerCase())) return font
  return `"${font.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function quoteFontFamily (value) {
  return quoteNormalizedFontFamily(normalizeInterfaceFont(value))
}

function createFontStack (selectedFont) {
  const seen = new Set([selectedFont.toLocaleLowerCase()])
  const families = [quoteNormalizedFontFamily(selectedFont)]
  FALLBACK_FONT_FAMILIES.forEach(font => {
    const key = font.toLocaleLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    families.push(quoteNormalizedFontFamily(font))
  })
  return families.join(', ')
}

export function createInterfaceFontStack (value) {
  return createFontStack(normalizeInterfaceFont(value))
}

export function createContentFontStack (value) {
  return createFontStack(normalizeContentFont(value))
}

export function normalizeLocalFontFamilies (fonts, locale, requiredFonts = []) {
  const uniqueFonts = new Map()
  const addFont = value => {
    const candidate = typeof value === 'string' ? value : value?.family
    if (typeof candidate !== 'string') return
    const font = candidate.trim()
    if (!font || font.length > 120 || containsControlCharacter(font)) return
    const key = font.toLocaleLowerCase()
    if (!uniqueFonts.has(key)) uniqueFonts.set(key, font)
  }

  addFont(DEFAULT_INTERFACE_FONT)
  addFont(DEFAULT_CONTENT_FONT)
  requiredFonts.forEach(addFont)
  if (Array.isArray(fonts)) fonts.forEach(addFont)

  const collator = new Intl.Collator(locale || undefined, { sensitivity: 'base', numeric: true })
  const pinnedKeys = new Set()
  const pinnedFonts = []
  ;[DEFAULT_INTERFACE_FONT, DEFAULT_CONTENT_FONT, ...requiredFonts].forEach(value => {
    const font = typeof value === 'string' ? value.trim() : value?.family?.trim()
    if (!font) return
    const key = font.toLocaleLowerCase()
    if (pinnedKeys.has(key) || !uniqueFonts.has(key)) return
    pinnedKeys.add(key)
    pinnedFonts.push(uniqueFonts.get(key))
  })
  const sortedFonts = Array.from(uniqueFonts.entries())
    .filter(([key]) => !pinnedKeys.has(key))
    .map(([, font]) => font)
    .sort(collator.compare)
  return [...pinnedFonts, ...sortedFonts]
}
