const ENCODING_LABELS = Object.freeze({
  utf8: 'UTF-8',
  utf8bom: 'UTF-8 BOM',
  utf16le: 'UTF-16 LE',
  utf16lebom: 'UTF-16 LE BOM',
  utf16be: 'UTF-16 BE',
  utf16bebom: 'UTF-16 BE BOM',
  utf32le: 'UTF-32 LE',
  utf32lebom: 'UTF-32 LE BOM',
  utf32be: 'UTF-32 BE',
  utf32bebom: 'UTF-32 BE BOM',
  gb18030: 'GB18030',
  gbk: 'GBK',
  big5: 'Big5',
  shiftjis: 'Shift_JIS',
  euckr: 'EUC-KR',
  windows1252: 'Windows-1252',
  latin1: 'Latin-1'
})
const LINE_ENDING_MAP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export const ENCODING_OPTIONS = Object.freeze(Object.entries(ENCODING_LABELS).map(([value, label]) => ({ value, label })))

export function normalizeEncoding (encoding) {
  const value = String(encoding || '').toLowerCase().replace(/[-_ ]/g, '')
  if (value === 'utf8bom') return 'utf8bom'
  if (value === 'utf8') return 'utf8'
  if (value === 'utf16lebom' || value === 'ucs2lebom') return 'utf16lebom'
  if (value === 'utf16bebom') return 'utf16bebom'
  if (value === 'utf16' || value === 'utf16le' || value === 'ucs2' || value === 'ucs2le') return 'utf16le'
  if (value === 'utf16be') return 'utf16be'
  if (value === 'utf32lebom') return 'utf32lebom'
  if (value === 'utf32bebom') return 'utf32bebom'
  if (value === 'utf32' || value === 'utf32le') return 'utf32le'
  if (value === 'utf32be') return 'utf32be'
  if (value === 'gb2312' || value === 'gbk') return 'gbk'
  if (value === 'gb18030') return 'gb18030'
  if (value === 'big5' || value === 'big5hkscs') return 'big5'
  if (value === 'shiftjis' || value === 'sjis' || value === 'windows31j') return 'shiftjis'
  if (value === 'euckr' || value === 'ksc5601' || value === 'windows949' || value === 'cp949') return 'euckr'
  if (value === 'windows1252' || value === 'cp1252') return 'windows1252'
  if (value === 'latin1' || value === 'iso88591') return 'latin1'
  return 'utf8'
}

export function getEncodingLabel (encoding) {
  return ENCODING_LABELS[normalizeEncoding(encoding)] || ENCODING_LABELS.utf8
}

export function getLineEndingLabel (lineEnding, language = 'zh-CN') {
  if (lineEnding === 'mixed') return t(language, 'lineEnding.mixed')
  return lineEnding === 'crlf' ? 'Windows (CRLF)' : lineEnding === 'cr' ? t(language, 'lineEnding.classicMac') : 'Unix (LF)'
}

export function normalizeLineEnding (text, lineEnding) {
  const normalized = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (lineEnding === 'crlf') return normalized.replace(/\n/g, '\r\n')
  if (lineEnding === 'cr') return normalized.replace(/\n/g, '\r')
  return normalized
}

export function collectLineEndings (text) {
  return String(text).match(/\r\n|\r|\n/g) || []
}

export function encodeLineEndingMap (lineEndings) {
  const codes = []
  for (const ending of Array.isArray(lineEndings) ? lineEndings : []) {
    const code = ending === '\r\n' ? 1 : ending === '\r' ? 2 : ending === '\n' ? 0 : -1
    if (code >= 0) codes.push(code)
  }
  let packed = ''
  for (let index = 0; index < codes.length; index += 3) {
    packed += LINE_ENDING_MAP_ALPHABET[(codes[index] << 4) | ((codes[index + 1] || 0) << 2) | (codes[index + 2] || 0)]
  }
  return `${codes.length.toString(36)}:${packed}`
}

export function applyPreservedLineEndingMap (text, lineEndingMap, fallback = 'lf') {
  const separator = typeof lineEndingMap === 'string' ? lineEndingMap.indexOf(':') : -1
  const count = separator > 0 ? Number.parseInt(lineEndingMap.slice(0, separator), 36) : 0
  const packed = separator > 0 ? lineEndingMap.slice(separator + 1) : ''
  const currentCount = (String(text).match(/\r\n|\r|\n/g) || []).length
  if (!Number.isInteger(count) || count !== currentCount || packed.length < Math.ceil(count / 3) || !/^[A-Za-z0-9_-]*$/.test(packed)) {
    return normalizeLineEnding(text, fallback)
  }
  let index = 0
  const readEnding = () => {
    if (index >= count) return null
    const packedValue = LINE_ENDING_MAP_ALPHABET.indexOf(packed[Math.floor(index / 3)])
    if (packedValue < 0) return null
    const shift = 4 - (index % 3) * 2
    const code = (packedValue >> shift) & 3
    index += 1
    return code === 1 ? '\r\n' : code === 2 ? '\r' : code === 0 ? '\n' : null
  }
  return String(text).replace(/\r\n|\r|\n/g, () => {
    const ending = readEnding()
    if (ending) return ending
    return fallback === 'crlf' ? '\r\n' : fallback === 'cr' ? '\r' : '\n'
  })
}

export function applyPreservedLineEndings (text, lineEndings, fallback = 'lf') {
  return applyPreservedLineEndingMap(text, encodeLineEndingMap(lineEndings), fallback)
}

export function detectLineEnding (text) {
  const value = String(text)
  const crlf = (value.match(/\r\n/g) || []).length
  const lf = (value.match(/(?<!\r)\n/g) || []).length
  const cr = (value.match(/\r(?!\n)/g) || []).length
  const usedKinds = [crlf > 0, lf > 0, cr > 0].filter(Boolean).length
  if (usedKinds > 1) return 'mixed'
  if (crlf >= lf && crlf >= cr && crlf > 0) return 'crlf'
  if (cr > lf && cr > 0) return 'cr'
  return 'lf'
}
import { t } from './locales'
