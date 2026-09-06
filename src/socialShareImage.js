import { markdownToPlainText } from './historySearch'

export const SOCIAL_IMAGE_KINDS = Object.freeze(['x', 'zhihu', 'wechat'])

export const ZHIHU_THEMES = Object.freeze([
  { id: 'light', main: '#FFFFFF', text: '#111111', quote: '#EEEEEE', author: '#3B3B3B', brand: '#087CE8', footer: '#F7F7F7', footerText: '#111111', footerMuted: '#A9A9A9' },
  { id: 'ink', main: '#21211F', text: '#DDBD94', quote: '#6D675E', author: '#DDBD94', brand: '#B99D77', footer: '#DCC196', footerText: '#111111', footerMuted: '#95836A' },
  { id: 'blue', main: '#0166FF', text: '#FFFFFF', quote: '#5A98F8', author: '#FFFFFF', brand: '#B7D1F3', footer: '#FFFFFF', footerText: '#111111', footerMuted: '#A9A9A9' },
  { id: 'indigo', main: '#3E4C95', text: '#FFFFFF', quote: '#7884BB', author: '#FFFFFF', brand: '#B9BED5', footer: '#FFFFFF', footerText: '#111111', footerMuted: '#A9A9A9' },
  { id: 'cyan', main: '#1FADC3', text: '#FFFFFF', quote: '#68C4D1', author: '#FFFFFF', brand: '#B9DEE3', footer: '#FFFFFF', footerText: '#111111', footerMuted: '#A9A9A9' }
])

export function normalizeSocialImageKind (kind) {
  return SOCIAL_IMAGE_KINDS.includes(kind) ? kind : 'zhihu'
}

export function normalizeSocialShareText (text, editorMode = 'text') {
  const value = editorMode === 'markdown' ? markdownToPlainText(text) : String(text || '')
  return value.replace(/\r\n|\r/g, '\n').trim()
}

export function getSocialShareFirstLine (text, maxLength = 54, fallback = '') {
  const firstLine = String(text || '').split('\n').map(line => line.trim()).find(Boolean) || String(fallback || '')
  const characters = Array.from(firstLine)
  return characters.length > maxLength ? `${characters.slice(0, maxLength).join('')}…` : firstLine
}

export function getDefaultWechatHighlightRange (text) {
  const value = String(text || '')
  if (!value) return [0, 0]
  let start = Math.floor(value.length * 0.22)
  let end = Math.max(start + 1, Math.ceil(value.length * 0.74))
  const leadingBoundary = value.slice(0, start).search(/[^，。！？；：,.!?;:\n]*$/)
  if (leadingBoundary >= 0) start = leadingBoundary
  const trailingBoundary = value.slice(end).search(/[，。！？；：,.!?;:\n]/)
  if (trailingBoundary >= 0) end += trailingBoundary + 1
  return [Math.max(0, start), Math.min(value.length, end)]
}

function sanitizeFilenamePart (value) {
  return Array.from(String(value || ''))
    .filter(character => character.codePointAt(0) >= 32 && !'<>:"/\\|?*'.includes(character))
    .join('')
    .trim()
    .slice(0, 42)
}

export function buildSocialImageFilename (kind, title, content, options = {}) {
  const platform = sanitizeFilenamePart(options.platformName) || (normalizeSocialImageKind(kind) === 'x' ? 'X' : kind === 'wechat' ? '微信公众号' : '知乎')
  const base = sanitizeFilenamePart(title) || sanitizeFilenamePart(getSocialShareFirstLine(content, 28)) || sanitizeFilenamePart(options.defaultName) || 'Flash Note Text'
  return `${base} - ${platform}.png`
}

export function resolveZhihuTheme (themeId) {
  return ZHIHU_THEMES.find(theme => theme.id === themeId) || ZHIHU_THEMES[0]
}
