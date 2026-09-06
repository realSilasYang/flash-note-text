const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const https = require('node:https')

function runFontCommand (command, args, timeout = 10000) {
  const { execFile } = require('node:child_process')
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      encoding: 'utf8',
      windowsHide: true,
      timeout,
      maxBuffer: 4 * 1024 * 1024
    }, (error, stdout) => {
      if (error) reject(error)
      else resolve(stdout)
    })
  })
}

async function listLocalFonts () {
  if (process.platform === 'win32') {
    const script = [
      '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)',
      "@('HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts', 'HKCU:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts') | ForEach-Object {",
      "  if (Test-Path $_) { (Get-ItemProperty $_).PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object Name }",
      '}'
    ].join('; ')
    const output = await runFontCommand('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script
    ])
    const styleSuffix = /\s+(?:regular|normal|roman|book|medium|light|semilight|demilight|semibold|demibold|bold|extrabold|ultrabold|italic|oblique|condensed|narrow)(?:\s+(?:italic|oblique))?$/i
    const localizedStyleSuffix = /\s+(?:常规体|中黑体|中粗体|纤细体|极细体|超细体|粗体|斜体|细体)$/
    const families = output.split(/\r?\n/).flatMap(line => {
      const name = line
        .replace(/^@/, '')
        .replace(/\s+\((?:trueType|openType|type 1)\)(?:\(\d+\))?$/i, '')
        .trim()
      if (!name) return []
      return name.split(/\s+&+\s+/).map(font => {
        let family = font
        let previous
        do {
          previous = family
          family = family.replace(styleSuffix, '').replace(localizedStyleSuffix, '').trim()
        } while (family !== previous)
        return family
      }).filter(Boolean)
    })
    const uniqueFamilies = new Map()
    families.forEach(font => {
      const key = font.toLocaleLowerCase()
      if (!uniqueFamilies.has(key)) uniqueFamilies.set(key, font)
    })
    return [...uniqueFamilies.values()]
  }

  if (process.platform === 'darwin') {
    const data = JSON.parse(await runFontCommand('/usr/sbin/system_profiler', ['SPFontsDataType', '-json'], 15000))
    const families = []
    const collectFamilies = value => {
      if (!value || typeof value !== 'object') return
      if (typeof value.family === 'string') families.push(value.family)
      Object.values(value).forEach(collectFamilies)
    }
    collectFamilies(data)
    return families
  }

  return (await runFontCommand('fc-list', ['--format=%{family}\n']))
    .split(/\r?\n/)
    .flatMap(font => font.split(','))
    .map(font => font.trim())
    .filter(Boolean)
}

let localFontsPromise = null

window.fontServices = {
  listLocalFonts: () => {
    if (!localFontsPromise) {
      localFontsPromise = listLocalFonts().catch(error => {
        localFontsPromise = null
        throw error
      })
    }
    return localFontsPromise
  }
}

let encodingLibraries = null
function getEncodingLibraries () {
  if (!encodingLibraries) {
    encodingLibraries = {
      chardet: require('chardet'),
      iconv: require('iconv-lite')
    }
  }
  return encodingLibraries
}

const ENCODINGS = new Set(['utf8', 'utf8bom', 'utf16le', 'utf16lebom', 'utf16be', 'utf16bebom', 'utf32le', 'utf32lebom', 'utf32be', 'utf32bebom', 'gb18030', 'gbk', 'big5', 'shiftjis', 'euckr', 'windows1252', 'latin1'])
const MAX_TEXT_LENGTH = 200000
const MAX_FILE_BYTES = MAX_TEXT_LENGTH * 4 + 4
const LINE_ENDING_MAP_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function fileError (code, message, details = {}) {
  const error = new Error(message)
  error.code = code
  Object.assign(error, details)
  return error
}

function normalizeEncoding (encoding) {
  const value = String(encoding || '').toLowerCase().replace(/[-_ ]/g, '')
  if (value === 'utf8' || value === 'utf8bom') return value
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

function decodeUtf32 (buffer, littleEndian) {
  const characters = []
  for (let index = 0; index + 3 < buffer.length; index += 4) {
    const codePoint = littleEndian ? buffer.readUInt32LE(index) : buffer.readUInt32BE(index)
    const valid = codePoint <= 0x10ffff && !(codePoint >= 0xd800 && codePoint <= 0xdfff)
    characters.push(String.fromCodePoint(valid ? codePoint : 0xfffd))
  }
  if (buffer.length % 4 !== 0) characters.push('\ufffd')
  return characters.join('')
}

function encodeUtf32 (text, littleEndian) {
  const characters = Array.from(text)
  const buffer = Buffer.allocUnsafe(characters.length * 4)
  characters.forEach((character, index) => {
    const offset = index * 4
    if (littleEndian) buffer.writeUInt32LE(character.codePointAt(0), offset)
    else buffer.writeUInt32BE(character.codePointAt(0), offset)
  })
  return buffer
}

function decodeBuffer (buffer, encoding) {
  const normalized = normalizeEncoding(encoding)
  if (normalized === 'utf32le' || normalized === 'utf32lebom') return decodeUtf32(buffer, true)
  if (normalized === 'utf32be' || normalized === 'utf32bebom') return decodeUtf32(buffer, false)
  if (normalized === 'utf16be' || normalized === 'utf16bebom') {
    const swapped = Buffer.from(buffer)
    for (let index = 0; index + 1 < swapped.length; index += 2) {
      const first = swapped[index]
      swapped[index] = swapped[index + 1]
      swapped[index + 1] = first
    }
    return swapped.toString('utf16le')
  }
  if (normalized === 'utf8' || normalized === 'utf8bom') return buffer.toString('utf8')
  return getEncodingLibraries().iconv.decode(buffer, normalized === 'utf16lebom' ? 'utf16le' : normalized)
}

function encodeText (text, encoding) {
  const normalized = normalizeEncoding(encoding)
  if (normalized.startsWith('utf32')) {
    const littleEndian = normalized === 'utf32le' || normalized === 'utf32lebom'
    const encoded = encodeUtf32(text, littleEndian)
    if (normalized === 'utf32lebom') return Buffer.concat([Buffer.from([0xff, 0xfe, 0x00, 0x00]), encoded])
    if (normalized === 'utf32bebom') return Buffer.concat([Buffer.from([0x00, 0x00, 0xfe, 0xff]), encoded])
    return encoded
  }
  if (normalized === 'utf16be' || normalized === 'utf16bebom') {
    const littleEndian = Buffer.from(text, 'utf16le')
    for (let index = 0; index + 1 < littleEndian.length; index += 2) {
      const first = littleEndian[index]
      littleEndian[index] = littleEndian[index + 1]
      littleEndian[index + 1] = first
    }
    return normalized === 'utf16bebom'
      ? Buffer.concat([Buffer.from([0xfe, 0xff]), littleEndian])
      : littleEndian
  }
  if (normalized === 'utf8' || normalized === 'utf8bom') {
    const utf8 = Buffer.from(text, 'utf8')
    return normalized === 'utf8bom' ? Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), utf8]) : utf8
  }
  if (normalized === 'utf16lebom') {
    return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')])
  }
  return getEncodingLibraries().iconv.encode(text, normalized)
}

function bufferWithoutBom (buffer, encoding) {
  if (encoding === 'utf8bom') return buffer.subarray(3)
  if (encoding === 'utf16lebom' || encoding === 'utf16bebom') return buffer.subarray(2)
  if (encoding === 'utf32lebom' || encoding === 'utf32bebom') return buffer.subarray(4)
  return buffer
}

function getEncodingLossDetails (text, encoding) {
  const normalized = normalizeEncoding(encoding)
  const encoded = encodeText(text, normalized)
  const decoded = decodeBuffer(bufferWithoutBom(encoded, normalized), normalized)
  if (decoded === text) return null

  const characters = Array.from(text)
  const examples = []
  for (let index = 0; index < characters.length && examples.length < 8; index += 1) {
    const character = characters[index]
    const roundTrip = decodeBuffer(encodeText(character, normalized), normalized).replace(/^\ufeff/, '')
    if (roundTrip !== character) examples.push({ character, index })
  }
  return { count: examples.length, examples }
}

function detectEncoding (buffer) {
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xfe && buffer[2] === 0x00 && buffer[3] === 0x00) return { encoding: 'utf32lebom', bom: true, confidence: 1 }
  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xfe && buffer[3] === 0xff) return { encoding: 'utf32bebom', bom: true, confidence: 1 }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return { encoding: 'utf8bom', bom: true, confidence: 1 }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) return { encoding: 'utf16lebom', bom: true, confidence: 1 }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) return { encoding: 'utf16bebom', bom: true, confidence: 1 }

  let evenNul = 0
  let oddNul = 0
  const nulByModulo = [0, 0, 0, 0]
  for (let index = 0; index < Math.min(buffer.length, 4096); index += 1) {
    if (buffer[index] !== 0) continue
    nulByModulo[index % 4] += 1
    if (index % 2 === 0) evenNul += 1
    else oddNul += 1
  }
  const sampleLength = Math.min(buffer.length, 4096)
  const sampledCodePoints = Math.floor(sampleLength / 4)
  if (sampledCodePoints >= 1 && sampleLength % 4 === 0) {
    if (nulByModulo[1] + nulByModulo[2] + nulByModulo[3] >= sampledCodePoints * 2.5 && nulByModulo[0] < sampledCodePoints * 0.5) {
      return { encoding: 'utf32le', bom: false, confidence: 0.9 }
    }
    if (nulByModulo[0] + nulByModulo[1] + nulByModulo[2] >= sampledCodePoints * 2.5 && nulByModulo[3] < sampledCodePoints * 0.5) {
      return { encoding: 'utf32be', bom: false, confidence: 0.9 }
    }
  }
  const sampledPairs = Math.floor(sampleLength / 2)
  if (sampledPairs >= 1 && sampleLength % 2 === 0) {
    if (oddNul >= Math.ceil(sampledPairs * 0.6) && oddNul > evenNul * 2) return { encoding: 'utf16le', bom: false, confidence: 0.92 }
    if (evenNul >= Math.ceil(sampledPairs * 0.6) && evenNul > oddNul * 2) return { encoding: 'utf16be', bom: false, confidence: 0.92 }
  }

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return { encoding: 'utf8', bom: false, confidence: 0.88 }
  } catch {}

  const detectorNames = {
    gb18030: 'gb18030',
    gb2312: 'gb18030',
    big5: 'big5',
    shiftjis: 'shiftjis',
    euckr: 'euckr',
    windows1252: 'windows1252',
    iso88591: 'latin1'
  }
  const { chardet, iconv } = getEncodingLibraries()
  const detectorPriors = new Map()
  for (const candidate of chardet.analyse(buffer)) {
    const key = String(candidate.name || '').toLowerCase().replace(/[-_ ]/g, '')
    const encoding = detectorNames[key]
    const confidence = Number(candidate.confidence) || 0
    if (encoding && confidence >= 50) detectorPriors.set(encoding, Math.max(confidence, detectorPriors.get(encoding) || 0))
  }

  const candidates = ['gb18030', 'gbk', 'big5', 'shiftjis', 'euckr', 'windows1252', 'latin1']
  const scores = candidates.map(encoding => {
    const decoded = decodeBuffer(buffer, encoding)
    const replacementCount = (decoded.match(/�/g) || []).length
    const controlCount = (decoded.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g) || []).length
    const roundTrip = iconv.encode(decoded, encoding)
    const byteMismatch = roundTrip.equals(buffer) ? 0 : Math.max(1, Math.abs(roundTrip.length - buffer.length))
    const detectorConfidence = detectorPriors.get(encoding) || 0
    return { encoding, detectorConfidence, score: replacementCount * 100 + controlCount * 20 + byteMismatch - detectorConfidence }
  }).sort((left, right) => left.score - right.score)
  const scoreGap = (scores[1]?.score ?? scores[0].score) - scores[0].score
  const confidence = scores[0].detectorConfidence >= 80
    ? 0.9
    : scores[0].detectorConfidence >= 50
      ? 0.78
      : scoreGap > 10
        ? 0.72
        : scoreGap > 0
          ? 0.62
          : 0.45
  return { encoding: scores[0].encoding, bom: false, confidence, candidates: scores }
}

function isLikelyBinary (buffer, detectedEncoding) {
  if (detectedEncoding.startsWith('utf16') || detectedEncoding.startsWith('utf32')) return false
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192))
  if (sample.length === 0) return false
  let suspicious = 0
  for (const byte of sample) {
    if (byte === 0 || (byte < 7 || (byte > 13 && byte < 32))) suspicious += 1
  }
  return suspicious / sample.length > 0.02
}

function normalizePath (value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('文件路径不能为空')
  return path.resolve(value)
}

function getLineEndingInfo (text) {
  let crlf = 0
  let lf = 0
  let cr = 0
  const codes = []
  const matches = text.matchAll(/\r\n|\r|\n/g)
  for (const match of matches) {
    const ending = match[0]
    const code = ending === '\r\n' ? 1 : ending === '\r' ? 2 : 0
    codes.push(code)
    if (code === 1) crlf += 1
    else if (code === 2) cr += 1
    else lf += 1
  }
  const usedKinds = [crlf > 0, lf > 0, cr > 0].filter(Boolean).length
  const dominant = crlf >= lf && crlf >= cr && crlf > 0 ? 'crlf' : cr > lf && cr > 0 ? 'cr' : 'lf'
  if (usedKinds <= 1) return { lineEnding: dominant, dominantLineEnding: dominant }
  let packed = ''
  for (let index = 0; index < codes.length; index += 3) {
    packed += LINE_ENDING_MAP_ALPHABET[(codes[index] << 4) | ((codes[index + 1] || 0) << 2) | (codes[index + 2] || 0)]
  }
  return { lineEnding: 'mixed', dominantLineEnding: dominant, lineEndingMap: `${codes.length.toString(36)}:${packed}` }
}

function normalizeLineEnding (text, lineEnding) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  if (lineEnding === 'crlf') return normalized.replace(/\n/g, '\r\n')
  if (lineEnding === 'cr') return normalized.replace(/\n/g, '\r')
  return normalized
}

function preserveLineEndings (text, lineEndingMap, fallback) {
  const separator = typeof lineEndingMap === 'string' ? lineEndingMap.indexOf(':') : -1
  const count = separator > 0 ? Number.parseInt(lineEndingMap.slice(0, separator), 36) : 0
  const packed = separator > 0 ? lineEndingMap.slice(separator + 1) : ''
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

function hasUsableLineEndingMap (text, lineEndingMap) {
  const separator = typeof lineEndingMap === 'string' ? lineEndingMap.indexOf(':') : -1
  if (separator <= 0) return false
  const count = Number.parseInt(lineEndingMap.slice(0, separator), 36)
  const packed = lineEndingMap.slice(separator + 1)
  const currentCount = (String(text).match(/\r\n|\r|\n/g) || []).length
  return Number.isInteger(count) && count === currentCount &&
    packed.length >= Math.ceil(count / 3) && /^[A-Za-z0-9_-]*$/.test(packed)
}

function readFile (filename, forcedEncoding = '') {
  const filePath = normalizePath(filename)
  const stat = fs.statSync(filePath)
  if (!stat.isFile()) throw fileError('NOT_A_FILE', '所选路径不是文件')
  if (stat.size > MAX_FILE_BYTES) {
    throw fileError('FILE_TOO_LARGE', `文件过大，最多支持 ${MAX_TEXT_LENGTH} 个字符`, { size: stat.size, maxBytes: MAX_FILE_BYTES })
  }
  const buffer = fs.readFileSync(filePath)
  const detected = detectEncoding(buffer)
  const encoding = forcedEncoding ? normalizeEncoding(forcedEncoding) : detected.encoding
  if (isLikelyBinary(buffer, encoding)) throw fileError('BINARY_FILE', '该文件可能是二进制文件，无法作为文本打开')
  let content = decodeBuffer(buffer, encoding)
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1)
  if (content.length > MAX_TEXT_LENGTH) {
    throw fileError('TEXT_TOO_LONG', `文本不能超过 ${MAX_TEXT_LENGTH} 个字符`, { length: content.length })
  }
  const lineEndingInfo = getLineEndingInfo(content)
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return {
    path: filePath,
    name: path.basename(filePath),
    content,
    encoding,
    ...lineEndingInfo,
    size: buffer.length,
    confidence: forcedEncoding ? 1 : detected.confidence,
    candidates: detected.candidates || []
  }
}

function prepareFileBuffer (content, encoding, lineEnding, options = {}) {
  const source = String(content)
  if (source.length > MAX_TEXT_LENGTH) throw fileError('TEXT_TOO_LONG', `文本不能超过 ${MAX_TEXT_LENGTH} 个字符`)
  const fallbackLineEnding = ['crlf', 'cr', 'lf'].includes(options.dominantLineEnding) ? options.dominantLineEnding : 'lf'
  const preserveMixed = lineEnding === 'mixed' && hasUsableLineEndingMap(source, options.lineEndingMap)
  const effectiveLineEnding = lineEnding === 'mixed' && !preserveMixed ? fallbackLineEnding : lineEnding
  const nextContent = preserveMixed
    ? preserveLineEndings(source, options.lineEndingMap, fallbackLineEnding)
    : normalizeLineEnding(source, effectiveLineEnding)
  const loss = getEncodingLossDetails(nextContent, encoding)
  if (loss) {
    throw fileError('ENCODING_LOSS', '所选编码无法保存部分字符', { encoding: normalizeEncoding(encoding), ...loss })
  }
  return {
    buffer: encodeText(nextContent, encoding),
    encoding: normalizeEncoding(encoding),
    lineEnding: effectiveLineEnding
  }
}

function writePreparedFile (filename, prepared) {
  const filePath = normalizePath(filename)
  const encoded = prepared.buffer
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(temporaryPath, encoded)
  try {
    fs.renameSync(temporaryPath, filePath)
  } catch (error) {
    if (error?.code !== 'EEXIST' && error?.code !== 'EPERM') {
      try { fs.unlinkSync(temporaryPath) } catch {}
      throw error
    }
    fs.copyFileSync(temporaryPath, filePath)
    fs.unlinkSync(temporaryPath)
  }
  return { path: filePath, name: path.basename(filePath), encoding: prepared.encoding, lineEnding: prepared.lineEnding, size: encoded.length }
}

function writeFile (filename, content, encoding, lineEnding, options = {}) {
  return writePreparedFile(filename, prepareFileBuffer(content, encoding, lineEnding, options))
}

const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'log', 'csv', 'tsv', 'json', 'json5', 'xml', 'html', 'htm', 'css', 'scss', 'sass', 'less', 'js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'vue', 'yaml', 'yml', 'toml', 'ini', 'conf', 'properties', 'sql', 'py', 'java', 'kt', 'kts', 'c', 'h', 'cpp', 'cc', 'cxx', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'sh', 'bash', 'zsh', 'fish', 'bat', 'cmd', 'ps1', 'lua', 'dart', 'ex', 'exs', 'erl', 'fs', 'fsx', 'groovy', 'hs', 'jl', 'm', 'mm', 'pl', 'pm', 'r', 'scala', 'scm', 'sol', 'swift', 'tex', 'proto', 'v', 'vhd', 'vhdl', 'wasm']
const IMAGE_MIME_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', tif: 'image/tiff', tiff: 'image/tiff', svg: 'image/svg+xml' }

function normalizeFileDialogCopy (value) {
  const fallback = { openTitle: '打开文件', saveTitle: '保存文件', saveButton: '保存', textFiles: '文本文件', allFiles: '所有文件', defaultName: '闪念文本', detachRequired: '请先按 Ctrl+D 将「闪念文本」分离为独立窗口' }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback
  const copy = Object.fromEntries(Object.entries(fallback).map(([key, text]) => [
    key,
    typeof value[key] === 'string' && value[key].trim() ? value[key].trim() : text
  ]))
  copy.defaultName = copy.defaultName.replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim() || fallback.defaultName
  return copy
}

// 文件对话框可以安全地从插件主窗口打开。保留这个兼容入口，供仍沿用
// 为文件选择流程的调用方保留这个兼容入口，确保旧调用仍能继续使用。
function prepareFileDialog () {
  return Promise.resolve(true)
}

// 原生对话框打开期间，uTools 主窗口可能暂时隐藏。对话框关闭后立即恢复窗口，
// 确保用户选择文件不会被误判为插件流程结束。
function restoreMainWindowAfterDialog () {
  const api = window.utools
  if (!api || typeof api.showMainWindow !== 'function') return
  let windowType = 'main'
  try { windowType = api.getWindowType?.() || 'main' } catch {}
  if (windowType === 'main') {
    try { api.showMainWindow() } catch {}
  }
}

async function saveTextFile (defaultPath, editorMode, dialogCopy, content, encoding, lineEnding, options = {}) {
  if (!(await prepareFileDialog(dialogCopy?.detachRequired))) return null
  const prepared = prepareFileBuffer(content, encoding, lineEnding, options)
  const copy = normalizeFileDialogCopy(dialogCopy)
  const codeExtension = typeof options.codeExtension === 'string' && /^[a-z0-9]+$/i.test(options.codeExtension) ? options.codeExtension : 'txt'
  const codeLanguage = typeof options.codeLanguage === 'string' && options.codeLanguage.trim() ? options.codeLanguage.trim() : copy.textFiles
  const filePath = window.utools?.showSaveDialog({
    title: copy.saveTitle,
    defaultPath: defaultPath || path.join(window.utools?.getPath?.('downloads') || '', `${copy.defaultName}.${editorMode === 'markdown' ? 'md' : editorMode === 'code' ? codeExtension : 'txt'}`),
    buttonLabel: copy.saveButton,
    filters: editorMode === 'markdown'
      ? [{ name: 'Markdown', extensions: ['md', 'markdown'] }, { name: copy.allFiles, extensions: ['*'] }]
      : editorMode === 'code'
        ? [{ name: codeLanguage, extensions: [codeExtension] }, { name: copy.allFiles, extensions: ['*'] }]
        : [{ name: copy.textFiles, extensions: ['txt'] }, { name: copy.allFiles, extensions: ['*'] }]
  })
  restoreMainWindowAfterDialog()
  if (!filePath) return null
  return writePreparedFile(filePath, prepared)
}

window.fileServices = {
  encodings: [...ENCODINGS],
  maxTextLength: MAX_TEXT_LENGTH,
  detectEncoding,
  getEncodingLossDetails,
  readFile,
  writeFile,
  saveTextFile,
  prepareFileDialog,
  chooseOpenFile: async (dialogCopy) => {
    if (!(await prepareFileDialog(dialogCopy?.detachRequired))) return ''
    const copy = normalizeFileDialogCopy(dialogCopy)
    const filePaths = window.utools?.showOpenDialog({
      title: copy.openTitle,
      properties: ['openFile'],
      filters: [{ name: copy.textFiles, extensions: TEXT_EXTENSIONS }, { name: copy.allFiles, extensions: ['*'] }]
    })
    restoreMainWindowAfterDialog()
    return filePaths?.[0] || ''
  },
  chooseImageFile: async (dialogCopy = {}) => {
    if (!(await prepareFileDialog(dialogCopy?.detachRequired))) return null
    const title = typeof dialogCopy?.title === 'string' && dialogCopy.title.trim() ? dialogCopy.title.trim() : '选择参考图'
    const imageFiles = typeof dialogCopy?.imageFiles === 'string' && dialogCopy.imageFiles.trim() ? dialogCopy.imageFiles.trim() : '图片'
    const filePaths = window.utools?.showOpenDialog({
      title,
      properties: ['openFile'],
      filters: [{ name: imageFiles, extensions: Object.keys(IMAGE_MIME_TYPES) }]
    })
    restoreMainWindowAfterDialog()
    const filePath = filePaths?.[0] || ''
    if (!filePath) return null
    const bytes = fs.readFileSync(filePath)
    const prepared = await prepareReferenceImage(bytes)
    return {
      name: path.basename(filePath),
      size: prepared.size,
      type: prepared.mimeType,
      dataUrl: prepared.dataUrl,
      width: prepared.width,
      height: prepared.height
    }
  },
  chooseSaveFile: async (defaultPath, editorMode = 'text', dialogCopy) => {
    if (!(await prepareFileDialog(dialogCopy?.detachRequired))) return ''
    const copy = normalizeFileDialogCopy(dialogCopy)
    const filePath = window.utools?.showSaveDialog({
      title: copy.saveTitle,
      defaultPath: defaultPath || path.join(window.utools?.getPath?.('downloads') || '', `${copy.defaultName}.${editorMode === 'markdown' ? 'md' : 'txt'}`),
      buttonLabel: copy.saveButton,
      filters: editorMode === 'markdown'
        ? [{ name: 'Markdown', extensions: ['md', 'markdown'] }, { name: copy.allFiles, extensions: ['*'] }]
        : [{ name: copy.textFiles, extensions: ['txt'] }, { name: copy.allFiles, extensions: ['*'] }]
    })
    restoreMainWindowAfterDialog()
    return filePath || ''
  }
}

function writePng (filename, bytes) {
  const filePath = normalizePath(filename)
  const buffer = Buffer.isBuffer(bytes)
    ? bytes
    : bytes instanceof ArrayBuffer
      ? Buffer.from(bytes)
      : ArrayBuffer.isView(bytes)
        ? Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : null
  if (!buffer || buffer.length < 8 || !buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error('无效的 PNG 图片数据')
  }
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(temporaryPath, buffer)
  try {
    fs.renameSync(temporaryPath, filePath)
  } catch (error) {
    if (error?.code !== 'EEXIST' && error?.code !== 'EPERM') {
      try { fs.unlinkSync(temporaryPath) } catch {}
      throw error
    }
    fs.copyFileSync(temporaryPath, filePath)
    fs.unlinkSync(temporaryPath)
  }
  return { path: filePath, name: path.basename(filePath), size: buffer.length }
}

function getPngPagePath (filePath, pageIndex, pageCount) {
  if (pageCount <= 1) return filePath
  const suffix = String(pageIndex + 1).padStart(Math.max(2, String(pageCount).length), '0')
  const base = String(filePath).toLowerCase().endsWith('.png') ? String(filePath).slice(0, -4) : String(filePath)
  return `${base}-${suffix}.png`
}

function getDefaultImageSaveDirectory () {
  return path.resolve(window.utools?.getPath?.('downloads') || process.cwd())
}

function resolveImageSaveDirectory (value) {
  const directory = normalizePath(typeof value === 'string' && value.trim() ? value : getDefaultImageSaveDirectory())
  fs.mkdirSync(directory, { recursive: true })
  if (!fs.statSync(directory).isDirectory()) throw new Error('图片保存位置不是文件夹')
  return directory
}

function sanitizeImageFilename (value, format) {
  const extension = `.${format}`
  const rawName = String(value || '闪念文本')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .trim()
    .replace(/\.(?:png|jpe?g|webp|svg|gif|avif|heif|tiff?)$/i, '')
    .replace(/[. ]+$/g, '')
  let baseName = Array.from(rawName || '闪念文本').slice(0, 180).join('').replace(/[. ]+$/g, '') || '闪念文本'
  if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(baseName)) baseName = `_${baseName}`
  return `${baseName}${extension}`
}

function getAvailableImagePath (directory, filename, pageCount = 1) {
  const extension = path.extname(filename)
  const baseName = path.basename(filename, extension)
  for (let sequence = 1; sequence < 10000; sequence += 1) {
    const candidateName = sequence === 1 ? filename : `${baseName}-${sequence}${extension}`
    const candidatePath = path.join(directory, candidateName)
    const outputPaths = pageCount > 1
      ? Array.from({ length: pageCount }, (_, index) => getPngPagePath(candidatePath, index, pageCount))
      : [candidatePath]
    if (outputPaths.every(outputPath => !fs.existsSync(outputPath))) return candidatePath
  }
  throw new Error('图片保存位置中同名文件过多')
}

function normalizePngBytes (bytes) {
  const buffer = toImageBuffer(bytes)
  if (!buffer || buffer.length < 8 || !buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw new Error('无效的 PNG 图片数据')
  }
  return buffer
}

function toImageBuffer (bytes) {
  if (Buffer.isBuffer(bytes)) return bytes
  if (bytes instanceof ArrayBuffer) return Buffer.from(bytes)
  if (ArrayBuffer.isView(bytes)) return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (typeof bytes === 'string') return Buffer.from(bytes, 'utf8')
  return null
}

function toArrayBuffer (buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

function normalizeImageFormat (value, metadata = {}) {
  const format = String(value || '').toLowerCase()
  if (format === 'jpeg') return 'jpg'
  if (format === 'tiff') return 'tiff'
  if (format === 'heif' && String(metadata.compression || '').toLowerCase() === 'av1') return 'avif'
  return format
}

function imageMimeType (format) {
  if (format === 'jpg') return 'image/jpeg'
  if (format === 'svg') return 'image/svg+xml'
  if (format === 'tif' || format === 'tiff') return 'image/tiff'
  return `image/${format}`
}

function sniffImageFormat (buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')) return 'gif'
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 12).match(/^ftyp(?:avif|avis)$/)) return 'avif'
  if (buffer.length >= 4 && (buffer.toString('hex', 0, 4) === '49492a00' || buffer.toString('hex', 0, 4) === '4d4d002a')) return 'tiff'
  if (/<svg(?:\s|>)/i.test(buffer.toString('utf8', 0, Math.min(buffer.length, 4096)))) return 'svg'
  return ''
}

function sharpInputOptions ({ animated = false, density = 192 } = {}) {
  return {
    animated: Boolean(animated),
    density,
    failOn: 'error',
    // 来自 uTools 的图片属于用户数据，不能因为分辨率较高就直接拒绝读取。
    limitInputPixels: false
  }
}

function publicImageMetadata (metadata, buffer) {
  const format = normalizeImageFormat(metadata.format || sniffImageFormat(buffer), metadata)
  const pages = Math.max(1, Number(metadata.pages || 1))
  return {
    channels: Number(metadata.channels || 0),
    format,
    hasAlpha: Boolean(metadata.hasAlpha),
    height: Number(metadata.height || 0),
    isAnimated: pages > 1,
    mimeType: imageMimeType(format),
    orientation: Number(metadata.orientation || 0),
    pages,
    size: buffer.length,
    width: Number(metadata.width || 0)
  }
}

async function inspectImage (bytes, options = {}) {
  const buffer = toImageBuffer(bytes)
  if (!buffer || buffer.length === 0) throw new Error('无效的图片数据')
  if (typeof window.utools?.sharp !== 'function') {
    const format = sniffImageFormat(buffer)
    if (!format) throw new Error('无法识别图片格式')
    return publicImageMetadata({ format }, buffer)
  }
  const metadata = await window.utools.sharp(buffer, sharpInputOptions(options)).metadata()
  if (!metadata?.format || !metadata?.width || !metadata?.height) throw new Error('无法读取图片元信息')
  return publicImageMetadata(metadata, buffer)
}

async function normalizeImage (bytes, options = {}) {
  const buffer = toImageBuffer(bytes)
  if (!buffer || buffer.length === 0) throw new Error('无效的图片数据')
  const requestedFormat = normalizeImageFormat(options.format || 'png')
  if (!['png', 'jpg', 'webp'].includes(requestedFormat)) throw new Error(`Sharp 不支持目标格式：${requestedFormat}`)
  const source = await inspectImage(buffer, { animated: options.animated, density: options.density })
  if (typeof window.utools?.sharp !== 'function') {
    if (source.format !== requestedFormat || options.maxWidth || options.maxHeight) throw new Error('当前 uTools 环境未提供 Sharp 图片转换能力')
    return { ...source, bytes: toArrayBuffer(buffer) }
  }

  const image = window.utools.sharp(buffer, sharpInputOptions({ animated: options.animated, density: options.density }))
  if (options.autoOrient !== false) image.rotate()
  if (options.maxWidth || options.maxHeight) {
    image.resize({
      width: options.maxWidth || undefined,
      height: options.maxHeight || undefined,
      fit: 'inside',
      withoutEnlargement: true
    })
  }
  if (requestedFormat === 'jpg') {
    image.flatten({ background: options.background || '#ffffff' }).jpeg({ quality: options.quality || 95 })
  } else if (requestedFormat === 'webp') {
    image.webp({ quality: options.quality || 92, effort: 4 })
  } else {
    image.png({ compressionLevel: 9 })
  }
  const output = toImageBuffer(await image.toBuffer())
  const metadata = await inspectImage(output)
  if (metadata.format !== requestedFormat) throw new Error('Sharp 图片输出格式不一致')
  return { ...metadata, bytes: toArrayBuffer(output) }
}

async function prepareReferenceImage (bytes) {
  const buffer = toImageBuffer(bytes)
  if (!buffer || buffer.length === 0) throw new Error('无效的参考图片数据')
  const metadata = await inspectImage(buffer, { animated: true })
  const directlySupported = ['png', 'jpg', 'webp', 'gif'].includes(metadata.format)
  const prepared = directlySupported
    ? { ...metadata, bytes: toArrayBuffer(buffer) }
    : await normalizeImage(buffer, { format: metadata.hasAlpha || metadata.format === 'svg' ? 'png' : 'webp', quality: 90 })
  const output = toImageBuffer(prepared.bytes)
  const { bytes: _bytes, ...result } = prepared
  return { ...result, dataUrl: `data:${prepared.mimeType};base64,${output.toString('base64')}` }
}

async function normalizeStoredImage (bytes, requestedFormat) {
  const buffer = toImageBuffer(bytes)
  const metadata = await inspectImage(buffer, { animated: true })
  let format = normalizeImageFormat(requestedFormat || metadata.format)
  if (!['png', 'jpg', 'webp', 'gif', 'svg'].includes(format)) format = ['png', 'jpg', 'webp', 'gif', 'svg'].includes(metadata.format) ? metadata.format : 'png'
  if ((format === 'svg' || format === 'gif' || (format === 'webp' && metadata.isAnimated)) && metadata.format === format) {
    return { ...metadata, bytes: toArrayBuffer(buffer) }
  }
  return normalizeImage(buffer, { format })
}

function writeImageBytes (filename, bytes, format) {
  const filePath = normalizePath(filename)
  const buffer = format === 'png' ? normalizePngBytes(bytes) : Buffer.isBuffer(bytes)
    ? bytes
    : bytes instanceof ArrayBuffer
      ? Buffer.from(bytes)
      : ArrayBuffer.isView(bytes)
        ? Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : typeof bytes === 'string'
          ? Buffer.from(bytes, 'utf8')
          : null
  if (!buffer || buffer.length === 0) throw new Error('无效的图片数据')
  if (format === 'svg' && !/<svg(?:\s|>)/i.test(buffer.toString('utf8', 0, Math.min(buffer.length, 4096)))) {
    throw new Error('无效的 SVG 图片数据')
  }
  if (format === 'jpg' && !(buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)) {
    throw new Error('无效的 JPEG 图片数据')
  }
  if (format === 'webp' && !(buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')) {
    throw new Error('无效的 WebP 图片数据')
  }
  if (format === 'gif' && !(buffer.length >= 6 && (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a'))) {
    throw new Error('无效的 GIF 图片数据')
  }
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(temporaryPath, buffer)
  try {
    fs.renameSync(temporaryPath, filePath)
  } catch (error) {
    if (error?.code !== 'EEXIST' && error?.code !== 'EPERM') {
      try { fs.unlinkSync(temporaryPath) } catch {}
      throw error
    }
    fs.copyFileSync(temporaryPath, filePath)
    fs.unlinkSync(temporaryPath)
  }
  return { path: filePath, name: path.basename(filePath), size: buffer.length }
}

const XHS_IMAGE_MAX_REDIRECTS = 4

function isTrustedXhsImageUrl (value) {
  try {
    const parsed = new URL(String(value || ''))
    return parsed.protocol === 'https:' && (parsed.hostname === 'xhscdn.com' || parsed.hostname.endsWith('.xhscdn.com'))
  } catch {
    return false
  }
}

async function rasterizeImage (bytes, format = '') {
  const output = await normalizeImage(bytes, { format: 'png', density: format === 'svg' ? 192 : undefined })
  return output.bytes
}

async function decodeXhsImageDataUrl (value) {
  const match = String(value || '').match(/^data:image\/(png|jpeg|webp|gif|avif);base64,([A-Za-z0-9+/]+={0,2})$/i)
  if (!match) return null
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length) throw new Error('无效的小红书图片数据')
  const metadata = await inspectImage(buffer, { animated: true })
  const format = metadata.format
  const declaredFormat = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase()
  if (format !== declaredFormat) throw new Error('小红书图片格式不一致')
  return portableImageResult(buffer)
}

async function portableImageResult (buffer) {
  const metadata = await inspectImage(buffer, { animated: true })
  if (['png', 'jpg', 'webp', 'gif'].includes(metadata.format)) {
    return { ...metadata, bytes: toArrayBuffer(buffer) }
  }
  return normalizeImage(buffer, { format: 'png' })
}

function downloadXhsImage (url, redirectCount = 0) {
  if (!isTrustedXhsImageUrl(url)) return Promise.reject(new Error('小红书图片地址无效'))
  if (redirectCount > XHS_IMAGE_MAX_REDIRECTS) return Promise.reject(new Error('小红书图片重定向次数过多'))
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://creator.xiaohongshu.com/'
      }
    }, response => {
      const status = Number(response.statusCode || 0)
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume()
        const redirectedUrl = new URL(response.headers.location, url).href
        downloadXhsImage(redirectedUrl, redirectCount + 1).then(resolve, reject)
        return
      }
      if (status < 200 || status >= 300) {
        response.resume()
        reject(new Error(`小红书图片下载失败（${status || '网络错误'}）`))
        return
      }
      const chunks = []
      response.on('data', chunk => {
        chunks.push(chunk)
      })
      response.on('end', () => {
        portableImageResult(Buffer.concat(chunks)).then(resolve, reject)
      })
      response.on('error', reject)
    })
    request.setTimeout(20000, () => request.destroy(new Error('小红书图片下载超时')))
    request.on('error', reject)
  })
}

async function loadXhsImage (url) {
  try {
    const embedded = await decodeXhsImageDataUrl(url)
    if (embedded) return embedded
  } catch (error) {
    throw error
  }
  return downloadXhsImage(url)
}

function directAiError (code, message, status) {
  const error = new Error(message)
  error.code = code
  if (Number.isFinite(Number(status))) error.status = Number(status)
  return error
}

function directApiEndpoint (baseUrl, operation) {
  let endpoint
  try {
    endpoint = new URL(String(baseUrl || '').trim())
  } catch {
    throw directAiError('AI_DIRECT_CONFIG', '直连 API 地址必须是完整的 HTTP（S）地址。')
  }
  if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
    throw directAiError('AI_DIRECT_CONFIG', '直连 API 地址必须使用 HTTP 或 HTTPS 协议。')
  }
  const pathname = endpoint.pathname.replace(/\/+$/, '')
  const rootMatch = pathname.match(/^(.*)\/(?:chat\/completions|images\/(?:generations|edits))$/i)
  const root = rootMatch ? rootMatch[1] : pathname
  endpoint.pathname = `${root}/${operation}`.replace(/\/+/g, '/')
  return endpoint
}

function directImageData (dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/i)
  if (!match) throw directAiError('AI_DIRECT_CONFIG', '参考图片不是有效的 data URL。')
  const mimeType = match[1].toLowerCase()
  let bytes
  try {
    bytes = match[2]
      ? Buffer.from(match[3].replace(/\s+/g, ''), 'base64')
      : Buffer.from(decodeURIComponent(match[3]), 'utf8')
  } catch {
    throw directAiError('AI_DIRECT_CONFIG', '参考图片数据无法解码。')
  }
  if (!bytes.length) throw directAiError('AI_DIRECT_CONFIG', '参考图片不包含有效数据。')
  const extension = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/tiff': 'tiff',
    'image/svg+xml': 'svg'
  }[mimeType] || 'bin'
  return { bytes, filename: `reference.${extension}`, mimeType }
}

function createMultipartImagePayload ({ model, prompt, referenceDataUrl }) {
  const boundary = `----FlashNoteImage${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
  const chunks = []
  const appendText = (name, value) => {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`, 'utf8'))
  }
  appendText('model', model)
  appendText('prompt', prompt)
  const image = directImageData(referenceDataUrl)
  chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${image.filename}"\r\nContent-Type: ${image.mimeType}\r\n\r\n`, 'utf8'))
  chunks.push(image.bytes)
  chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8'))
  return {
    body: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`
  }
}

function createDirectAiRequest ({ config, request, image }) {
  const baseUrl = String(config?.baseUrl || '').trim()
  const apiKey = String(config?.apiKey || '').trim()
  const model = String(request?.model || config?.model || '').trim()
  if (!baseUrl || !model) {
    throw directAiError('AI_DIRECT_CONFIG', '直连 API 地址和模型不能为空。')
  }
  if (image) {
    const prompt = String(image.prompt || '').trim()
    if (!prompt) throw directAiError('AI_DIRECT_CONFIG', '图片生成提示词不能为空。')
    if (image.referenceDataUrl) {
      const payload = createMultipartImagePayload({ model, prompt, referenceDataUrl: image.referenceDataUrl })
      return {
        endpoint: directApiEndpoint(baseUrl, 'images/edits'),
        body: payload.body,
        contentType: payload.contentType,
        apiKey
      }
    }
    return {
      endpoint: directApiEndpoint(baseUrl, 'images/generations'),
      body: Buffer.from(JSON.stringify({ model, prompt }), 'utf8'),
      contentType: 'application/json',
      apiKey
    }
  }
  const body = { ...(request || {}), model, stream: false }
  return {
    endpoint: directApiEndpoint(baseUrl, 'chat/completions'),
    body: Buffer.from(JSON.stringify(body), 'utf8'),
    contentType: 'application/json',
    apiKey
  }
}

function parseDirectAiResponse (buffer, headers) {
  const contentType = String(headers?.['content-type'] || '').toLowerCase()
  if (contentType.startsWith('image/')) {
    return {
      type: 'image',
      mime_type: contentType.split(';', 1)[0],
      data: buffer.toString('base64')
    }
  }
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '').trim()
  if (!text) throw directAiError('AI_DIRECT_INVALID_RESPONSE', '直连 API 返回了空响应。')
  try {
    return JSON.parse(text)
  } catch {
    if (contentType.includes('json')) {
      throw directAiError('AI_DIRECT_INVALID_RESPONSE', '直连 API 返回了无效 JSON。')
    }
    return text
  }
}

function directAiRequest (input) {
  let activeRequest = null
  let aborted = false
  const operation = new Promise((resolve, reject) => {
    let prepared
    try {
      prepared = createDirectAiRequest(input || {})
    } catch (error) {
      reject(error)
      return
    }
    const transport = prepared.endpoint.protocol === 'https:' ? https : http
    const headers = {
      Accept: 'application/json, image/*;q=0.9, text/plain;q=0.8',
      'Content-Type': prepared.contentType,
      'Content-Length': String(prepared.body.length)
    }
    if (prepared.apiKey) headers.Authorization = `Bearer ${prepared.apiKey}`
    // 由于 uTools 会把渲染层的 URL 实现暴露给 preload 脚本，将该对象作为第一个参数
    // 传入，可避免部分 Node 版本把后面的 options 误识别为响应监听器。
    const requestOptions = {
      protocol: prepared.endpoint.protocol,
      hostname: prepared.endpoint.hostname,
      ...(prepared.endpoint.port ? { port: prepared.endpoint.port } : {}),
      path: `${prepared.endpoint.pathname}${prepared.endpoint.search}`,
      method: 'POST',
      headers
    }
    activeRequest = transport.request(requestOptions, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(Buffer.from(chunk)))
      response.on('error', reject)
      response.on('end', () => {
        const body = Buffer.concat(chunks)
        const status = Number(response.statusCode || 0)
        if (status < 200 || status >= 300) {
          const detail = body.toString('utf8').replace(/\s+/g, ' ').trim().slice(0, 2000)
          reject(directAiError('AI_CALL_FAILED', detail || `直连 API 请求失败（${status || '网络错误'}）。`, status || undefined))
          return
        }
        try {
          resolve(parseDirectAiResponse(body, response.headers))
        } catch (error) {
          reject(error)
        }
      })
    })
    activeRequest.on('error', error => {
      if (aborted) reject(directAiError('AI_ABORTED', 'AI 请求已取消。'))
      else reject(error)
    })
    activeRequest.end(prepared.body)
  })
  operation.abort = () => {
    aborted = true
    activeRequest?.destroy()
  }
  return operation
}

window.aiServices = {
  request: directAiRequest
}

window.imageServices = {
  getDefaultSaveDirectory: getDefaultImageSaveDirectory,
  chooseSaveDirectory: async (currentDirectory, title = '选择图片保存文件夹', detachMessage) => {
    if (!(await prepareFileDialog(detachMessage))) return ''
    let defaultPath = getDefaultImageSaveDirectory()
    try {
      if (typeof currentDirectory === 'string' && currentDirectory.trim() && fs.statSync(path.resolve(currentDirectory)).isDirectory()) {
        defaultPath = path.resolve(currentDirectory)
      }
    } catch {}
    const paths = window.utools?.showOpenDialog({
      title: typeof title === 'string' && title.trim() ? title.trim() : '选择图片保存文件夹',
      defaultPath,
      properties: ['openDirectory', 'createDirectory']
    })
    restoreMainWindowAfterDialog()
    return paths?.[0] || ''
  },
  savePngPages: async (defaultName, pages, saveDirectory) => {
    if (!Array.isArray(pages) || pages.length === 0) throw new Error('没有可保存的 PNG 图片')
    const normalizedPages = await Promise.all(pages.map(async bytes => (await normalizeImage(bytes, { format: 'png' })).bytes))
    const directory = resolveImageSaveDirectory(saveDirectory)
    const filePath = getAvailableImagePath(directory, sanitizeImageFilename(defaultName, 'png'), normalizedPages.length)
    const files = normalizedPages.map((bytes, index) => writePng(getPngPagePath(filePath, index, normalizedPages.length), bytes))
    return { path: filePath, files }
  },
  saveImage: async (defaultName, format, bytes, saveDirectory) => {
    const normalized = await normalizeStoredImage(bytes, format)
    const directory = resolveImageSaveDirectory(saveDirectory)
    const filePath = getAvailableImagePath(directory, sanitizeImageFilename(defaultName, normalized.format))
    return writeImageBytes(filePath, normalized.bytes, normalized.format)
  },
  copyPng: async (bytes) => {
    const normalized = await normalizeImage(bytes, { format: 'png' })
    const buffer = normalizePngBytes(normalized.bytes)
    return Boolean(window.utools?.copyImage?.(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)))
  },
  copyImage: async (bytes) => {
    const normalized = await normalizeImage(bytes, { format: 'png' })
    const buffer = normalizePngBytes(normalized.bytes)
    return Boolean(window.utools?.copyImage?.(new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)))
  },
  inspectImage,
  normalizeImage,
  prepareReferenceImage,
  rasterizeImage,
  fetchXhsImage: loadXhsImage
}
