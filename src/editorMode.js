import { t } from './locales'

export const EDITOR_MODES = Object.freeze([
  { value: 'text' },
  { value: 'markdown' },
  { value: 'code' }
])

export const AUTO_CODE_LANGUAGE = 'auto'
export const PLAIN_CODE_LANGUAGE = 'plain'
export const DEFAULT_CODE_LANGUAGE = AUTO_CODE_LANGUAGE

const CODE_EXTENSION_LANGUAGES = Object.freeze({
  c: 'C', h: 'C', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++', cs: 'C#',
  css: 'CSS', scss: 'SCSS', sass: 'Sass', less: 'LESS', go: 'Go', html: 'HTML', htm: 'HTML',
  java: 'Java', js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JSX', json: 'JSON',
  kt: 'Kotlin', kts: 'Kotlin', lua: 'Lua', php: 'PHP', py: 'Python', r: 'R', rb: 'Ruby', rs: 'Rust',
  sh: 'Shell', bash: 'Shell', zsh: 'Shell', fish: 'Shell', sql: 'SQL', swift: 'Swift', toml: 'TOML',
  ts: 'TypeScript', tsx: 'TSX', vue: 'Vue', wasm: 'WebAssembly', xml: 'XML', yaml: 'YAML', yml: 'YAML',
  ps1: 'PowerShell', vb: 'VB.NET', vbs: 'VBScript', dart: 'Dart',
  erl: 'Erlang', fs: 'F#', fsx: 'F#', groovy: 'Groovy', hs: 'Haskell', jl: 'Julia', m: 'Objective-C',
  mm: 'Objective-C++', pl: 'Perl', pm: 'Perl', scala: 'Scala', scm: 'Scheme', tex: 'LaTeX',
  ini: 'Properties files', properties: 'Properties files', proto: 'ProtoBuf', v: 'Verilog', vh: 'Verilog',
  sv: 'SystemVerilog', vhd: 'VHDL', vhdl: 'VHDL', dockerfile: 'Dockerfile'
})

let codeLanguageOptionsPromise

export function normalizeEditorMode (mode) {
  return mode === 'markdown' || mode === 'code' ? mode : 'text'
}

export function normalizeCodeLanguage (value) {
  const normalized = typeof value === 'string' ? value.trim().slice(0, 80) : ''
  return normalized || DEFAULT_CODE_LANGUAGE
}

export function getCodeFilenameInfo (filename) {
  const value = String(filename || '')
  const baseName = value.split(/[\\/]/).pop() || ''
  if (/^dockerfile$/i.test(baseName)) return { language: 'Dockerfile', matched: true, ambiguous: false }
  if (/^cmakelists\.txt$/i.test(baseName)) return { language: 'CMake', matched: true, ambiguous: false }
  if (/^(gemfile|rakefile)$/i.test(baseName)) return { language: 'Ruby', matched: true, ambiguous: false }
  if (/^jenkinsfile$/i.test(baseName)) return { language: 'Groovy', matched: true, ambiguous: false }
  const extension = baseName.includes('.') ? baseName.split('.').pop().toLowerCase() : ''
  const language = CODE_EXTENSION_LANGUAGES[extension] || null
  return {
    language,
    extension,
    matched: Boolean(language),
    ambiguous: ['h', 'm', 'pl'].includes(extension)
  }
}

export function detectCodeLanguage (filename) {
  return getCodeFilenameInfo(filename).language
}

export function detectEditorMode (filename) {
  const value = String(filename || '').toLowerCase()
  if (/\.(md|markdown|mdown|mkdn)$/.test(value)) return 'markdown'
  const extension = value.split(/[\\/]/).pop()?.split('.').pop()
  return CODE_EXTENSION_LANGUAGES[extension] || /^(dockerfile|cmakelists\.txt|gemfile|rakefile|jenkinsfile)$/i.test(value.split(/[\\/]/).pop() || '') ? 'code' : 'text'
}

export function getEditorModeLabel (mode, language = 'zh-CN') {
  return t(language, `mode.${normalizeEditorMode(mode)}`)
}

export function loadCodeLanguageOptions () {
  if (!codeLanguageOptionsPromise) {
    codeLanguageOptionsPromise = import('@codemirror/language-data').then(({ languages }) => (
      languages.map(language => ({ value: language.name, label: language.name }))
    ))
  }
  return codeLanguageOptionsPromise
}

export function getDefaultCodeExtension (language) {
  const normalized = normalizeCodeLanguage(language)
  const entry = Object.entries(CODE_EXTENSION_LANGUAGES).find(([, name]) => name === normalized)
  return entry?.[0] || 'txt'
}
