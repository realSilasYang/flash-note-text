import { toBlob, toSvg } from 'html-to-image'
import { bundledLanguages } from 'shiki/langs'
import { getCodeImageTheme } from './codeImageThemes'
import { getTextMateHighlighter, resolveTextMateLanguage } from './textMateCodeHighlighting'
import tailwindDarkTheme from './tailwindCodeThemeDark.json'
import tailwindLightTheme from './tailwindCodeThemeLight.json'

export const CODE_IMAGE_PADDING_OPTIONS = Object.freeze([0, 16, 32, 64, 128])
export const CODE_IMAGE_EXPORT_SCALES = Object.freeze([2, 4, 6])
export const CODE_IMAGE_FONTS = Object.freeze([
  { id: 'theme', family: '' },
  { id: 'jetbrains-mono', family: '"JetBrains Mono", "Cascadia Code", Consolas, monospace' },
  { id: 'geist-mono', family: 'Geist Mono, "Cascadia Mono", Consolas, monospace' },
  { id: 'ibm-plex-mono', family: '"IBM Plex Mono", Consolas, monospace' },
  { id: 'fira-code', family: '"Fira Code", "Cascadia Code", Consolas, monospace' },
  { id: 'soehne-mono', family: '"Söhne Mono", "SFMono-Regular", Consolas, monospace' }
])

const CSS_VARIABLE_THEME = {
  name: 'flash-note-code-image-css-variables',
  type: 'dark',
  colors: {
    'editor.foreground': 'var(--ray-foreground)',
    'editor.background': 'transparent'
  },
  tokenColors: [
    { scope: ['string', 'markup.fenced_code', 'markup.inline', 'string.quoted.docstring.multi.python'], settings: { foreground: 'var(--ray-token-string)' } },
    { scope: ['comment', 'string.quoted.docstring.multi'], settings: { foreground: 'var(--ray-token-comment)' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.other.placeholder', 'constant.character.format.placeholder', 'variable.language.this', 'variable.other.object', 'variable.other.class', 'variable.other.constant', 'meta.property-name', 'meta.property-value', 'support'], settings: { foreground: 'var(--ray-token-constant)' } },
    { scope: ['keyword', 'storage.modifier', 'storage.type', 'storage.control.clojure', 'entity.name.tag.yaml', 'support.function.node', 'support.type.property-name.json', 'punctuation.separator.key-value', 'punctuation.definition.template-expression'], settings: { foreground: 'var(--ray-token-keyword)' } },
    { scope: ['variable.parameter.function'], settings: { foreground: 'var(--ray-token-parameter)' } },
    { scope: ['support.function', 'entity.name.type', 'entity.other.inherited-class', 'meta.function-call', 'meta.instance.constructor', 'entity.other.attribute-name', 'entity.name.function'], settings: { foreground: 'var(--ray-token-function)' } },
    { scope: ['entity.name.tag', 'string.quoted', 'string.regexp', 'string.interpolated', 'string.template', 'string.unquoted.plain.out.yaml', 'keyword.other.template'], settings: { foreground: 'var(--ray-token-string-expression)' } },
    { scope: ['punctuation.definition.arguments', 'punctuation.definition.dict', 'punctuation.separator', 'meta.function-call.arguments'], settings: { foreground: 'var(--ray-token-punctuation)' } },
    { scope: ['markup.underline.link', 'punctuation.definition.metadata.markdown'], settings: { foreground: 'var(--ray-token-link)', fontStyle: 'underline' } },
    { scope: ['constant.numeric.decimal', 'constant.language.boolean', 'meta.var.exp.ts'], settings: { foreground: 'var(--ray-token-number)' } },
    { scope: ['support.variable.property'], settings: { foreground: 'var(--ray-token-property)' } }
  ]
}

let cssThemeReadyPromise
let tailwindThemesReadyPromise
const screenshotLanguageLoads = new Map()

async function getScreenshotHighlighter (languageName, themeId) {
  const language = resolveTextMateLanguage(languageName)
  const highlighter = await getTextMateHighlighter()
  if (!cssThemeReadyPromise) {
    cssThemeReadyPromise = Promise.resolve(highlighter.loadTheme(CSS_VARIABLE_THEME)).catch(error => {
      cssThemeReadyPromise = null
      throw error
    })
  }
  await cssThemeReadyPromise
  if (themeId === 'tailwind') {
    if (!tailwindThemesReadyPromise) {
      tailwindThemesReadyPromise = Promise.all([
        highlighter.loadTheme(tailwindDarkTheme),
        highlighter.loadTheme(tailwindLightTheme)
      ]).catch(error => {
        tailwindThemesReadyPromise = null
        throw error
      })
    }
    await tailwindThemesReadyPromise
  }
  if (language && !highlighter.getLoadedLanguages().includes(language)) {
    let loading = screenshotLanguageLoads.get(language)
    if (!loading) {
      loading = highlighter.loadLanguage(bundledLanguages[language])
      screenshotLanguageLoads.set(language, loading)
    }
    await loading
  }
  return { highlighter, language }
}

export async function highlightCodeForImage (code, languageName, themeId = '', darkMode = true) {
  const { highlighter, language } = await getScreenshotHighlighter(languageName, themeId)
  if (!language) {
    return String(code || '').split('\n').map(line => [{ content: line || ' ', color: 'var(--ray-foreground)' }])
  }
  const result = highlighter.codeToTokens(String(code || ''), {
    lang: language,
    theme: themeId === 'tailwind'
      ? (darkMode ? tailwindDarkTheme.name : tailwindLightTheme.name)
      : CSS_VARIABLE_THEME.name
  })
  return result.tokens
}

const FORMATTERS = Object.freeze({
  JavaScript: { plugin: () => import('prettier/plugins/babel'), parser: 'babel', estree: true },
  TypeScript: { plugin: () => import('prettier/plugins/typescript'), parser: 'typescript', estree: true },
  TSX: { plugin: () => import('prettier/plugins/typescript'), parser: 'typescript', estree: true },
  Markdown: { plugin: () => import('prettier/plugins/markdown'), parser: 'markdown' },
  HTML: { plugin: () => import('prettier/plugins/html'), parser: 'html' },
  CSS: { plugin: () => import('prettier/plugins/postcss'), parser: 'css' },
  SCSS: { plugin: () => import('prettier/plugins/postcss'), parser: 'css' },
  YAML: { plugin: () => import('prettier/plugins/yaml'), parser: 'yaml' }
})

export const CODE_IMAGE_FORMAT_LANGUAGES = Object.freeze(Object.keys(FORMATTERS))

export async function formatCodeImageSource (code, language) {
  const formatter = FORMATTERS[language]
  if (!formatter) return String(code || '')
  const [{ format }, plugin, estree] = await Promise.all([
    import('prettier/standalone'),
    formatter.plugin(),
    formatter.estree ? import('prettier/plugins/estree') : Promise.resolve(null)
  ])
  const formatted = await format(String(code || ''), {
    parser: formatter.parser,
    plugins: [plugin.default || plugin, ...(estree ? [estree.default || estree] : [])],
    singleQuote: false,
    printWidth: 80
  })
  return formatted.replace(/\n$/, '')
}

export function getCodeImageThemeStyle (themeId, darkMode) {
  const theme = getCodeImageTheme(themeId)
  return {
    ...theme.syntax[darkMode ? 'dark' : 'light'],
    '--code-image-gradient': `linear-gradient(140deg, ${theme.background.from}, ${theme.background.to})`,
    '--code-image-font': CODE_IMAGE_FONTS.find(font => font.id === (theme.font || 'jetbrains-mono'))?.family ||
      CODE_IMAGE_FONTS[1].family
  }
}

function sanitizeFilenamePart (value, fallback) {
  const safe = Array.from(String(value || ''))
    .filter(character => character.codePointAt(0) >= 32 && !'<>:"/\\|?*'.includes(character))
    .join('')
    .trim()
    .slice(0, 80)
  return safe || fallback
}

export function buildCodeImageFilename (filename, extension = 'png') {
  const safe = sanitizeFilenamePart(filename, 'code')
  const withoutKnownExtension = safe.replace(/\.(?:png|svg)$/i, '')
  return `${withoutKnownExtension}.${extension}`
}

async function waitForImages (node) {
  await Promise.all(Array.from(node.querySelectorAll('img')).map(image => {
    if (image.complete && image.naturalWidth > 0) return image.decode?.().catch(() => {})
    return new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
    })
  }))
}

function getCodeImageExportOptions (node, pixelRatio = 1) {
  const transparentBackground = node.dataset.transparentBackground === 'true'
  return {
    cacheBust: false,
    pixelRatio,
    skipAutoScale: true,
    width: node.offsetWidth,
    height: node.offsetHeight,
    filter: element => !element?.dataset?.ignoreInExport,
    ...(transparentBackground
      ? {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          style: { background: 'transparent', backgroundColor: 'transparent' }
        }
      : {})
  }
}

export async function renderCodeImagePng (node, pixelRatio = 4) {
  if (!node) throw new Error('代码图片画布不可用')
  await document.fonts?.ready
  await waitForImages(node)
  const blob = await toBlob(node, getCodeImageExportOptions(node, pixelRatio))
  if (!blob) throw new Error('PNG 图片生成失败')
  return blob
}

export async function renderCodeImageSvg (node) {
  if (!node) throw new Error('代码图片画布不可用')
  await document.fonts?.ready
  await waitForImages(node)
  return toSvg(node, getCodeImageExportOptions(node, 1))
}

export function svgDataUrlToText (dataUrl) {
  const comma = String(dataUrl || '').indexOf(',')
  if (comma < 0) throw new Error('无效的 SVG 图片数据')
  const metadata = dataUrl.slice(0, comma)
  const body = dataUrl.slice(comma + 1)
  if (!/;base64/i.test(metadata)) return decodeURIComponent(body)
  const binary = atob(body)
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function updateCodeIndentation (textarea, value, setValue, event) {
  if (!textarea) return false
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1

  if (event.key === 'Tab') {
    event.preventDefault()
    if (start === end) {
      const insert = event.shiftKey ? '' : '  '
      if (event.shiftKey) {
        const before = value.slice(lineStart, start)
        const remove = before.match(/^ {1,2}/)?.[0].length || 0
        if (!remove) return true
        setValue(value.slice(0, lineStart) + value.slice(lineStart + remove))
        requestAnimationFrame(() => textarea.setSelectionRange(Math.max(lineStart, start - remove), Math.max(lineStart, end - remove)))
      } else {
        setValue(value.slice(0, start) + insert + value.slice(end))
        requestAnimationFrame(() => textarea.setSelectionRange(start + insert.length, start + insert.length))
      }
      return true
    }

    const selectionLineEnd = end > start && value[end - 1] === '\n' ? end - 1 : end
    const blockEnd = value.indexOf('\n', selectionLineEnd)
    const effectiveEnd = blockEnd < 0 ? value.length : blockEnd
    const selected = value.slice(lineStart, effectiveEnd)
    const lines = selected.split('\n')
    const transformed = event.shiftKey
      ? lines.map(line => line.replace(/^ {1,2}/, '')).join('\n')
      : lines.map(line => `  ${line}`).join('\n')
    setValue(value.slice(0, lineStart) + transformed + value.slice(effectiveEnd))
    requestAnimationFrame(() => textarea.setSelectionRange(lineStart, lineStart + transformed.length))
    return true
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const currentLine = value.slice(lineStart, start)
    let indentation = currentLine.match(/^\s*/)?.[0] || ''
    if (/[{[(:>]\s*$/.test(currentLine)) indentation += '  '
    const insert = `\n${indentation}`
    setValue(value.slice(0, start) + insert + value.slice(end))
    requestAnimationFrame(() => textarea.setSelectionRange(start + insert.length, start + insert.length))
    return true
  }

  if (event.key === '}' && start === end) {
    const currentLine = value.slice(lineStart, start)
    if (/^\s{2,}$/.test(currentLine)) {
      event.preventDefault()
      const next = value.slice(0, start - 2) + '}' + value.slice(end)
      setValue(next)
      requestAnimationFrame(() => textarea.setSelectionRange(start - 1, start - 1))
      return true
    }
  }
  return false
}
