import { createHighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import { bundledLanguages, bundledLanguagesInfo } from 'shiki/langs'
import darculaExtendedTheme from './darculaExtendedTextMateTheme.json'

export const DARCULA_EXTENDED_THEME_NAME = darculaExtendedTheme.name

const LANGUAGE_ALIASES = Object.freeze({
  'angular template': 'angular-html',
  'c#': 'csharp',
  'c++': 'cpp',
  clojurescript: 'clojure',
  'closure stylesheets (gss)': 'css',
  cql: 'cql',
  cython: 'python',
  dtd: 'xml',
  edn: 'clojure',
  esper: 'sql',
  'f#': 'fsharp',
  fortran: 'fortran-free-form',
  gas: 'asm',
  idl: 'cpp',
  jinja: 'jinja',
  'json-ld': 'json',
  livescript: 'javascript',
  liquid: 'liquid',
  'mariadb sql': 'sql',
  mathematica: 'wolfram',
  'ms sql': 'sql',
  mysql: 'sql',
  ntriples: 'turtle',
  octave: 'matlab',
  pig: 'sql',
  'properties files': 'properties',
  plsql: 'plsql',
  postgresql: 'sql',
  'rpm changes': 'diff',
  'rpm spec': 'shellscript',
  shell: 'shellscript',
  sieve: 'shellscript',
  sml: 'common-lisp',
  solr: 'properties',
  spreadsheet: 'csv',
  squirrel: 'javascript',
  sqlite: 'sql',
  'stex': 'latex',
  'systemverilog': 'system-verilog',
  textile: 'markdown',
  'tiki wiki': 'wikitext',
  'tiddlywiki': 'wikitext',
  'ttcn_cfg': 'ini',
  'vb.net': 'vb',
  vbscript: 'vb',
  velocity: 'html',
  'web idl': 'typescript',
  webassembly: 'wasm',
  xquery: 'xml',
  z80: 'asm'
})

const languageNameIndex = new Map()
for (const language of bundledLanguagesInfo) {
  languageNameIndex.set(language.id.toLowerCase(), language.id)
  languageNameIndex.set(language.name.toLowerCase(), language.id)
  for (const alias of language.aliases || []) languageNameIndex.set(alias.toLowerCase(), language.id)
}

let highlighterPromise
const languageLoadPromises = new Map()

export function getTextMateHighlighter () {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      langs: [],
      themes: [darculaExtendedTheme],
      engine: createOnigurumaEngine(import('shiki/wasm')),
      warnings: false
    })
  }
  return highlighterPromise
}

export function resolveTextMateLanguage (languageName) {
  const normalized = String(languageName || '').trim().toLowerCase()
  if (!normalized || ['auto', 'plain', 'plaintext', 'text'].includes(normalized)) return null
  const languageId = LANGUAGE_ALIASES[normalized] || languageNameIndex.get(normalized)
  return languageId && bundledLanguages[languageId] ? languageId : null
}

export async function loadTextMateCodeHighlighting (languageName) {
  const language = resolveTextMateLanguage(languageName)
  if (!language) return null

  const highlighter = await getTextMateHighlighter()
  if (!highlighter.getLoadedLanguages().includes(language)) {
    let loadPromise = languageLoadPromises.get(language)
    if (!loadPromise) {
      loadPromise = highlighter.loadLanguage(bundledLanguages[language])
      languageLoadPromises.set(language, loadPromise)
    }
    await loadPromise
  }

  // 高亮扩展 codemirror-shiki 在高亮器准备完成后会派发一次通知。通过 CodeMirror
  // 通过 CodeMirror compartment 安装扩展时必须异步派发，否则通知会在重新配置事务中同步执行，
  // 可能导致当前更新过程被再次触发。
  return { highlighter: Promise.resolve(highlighter), language, theme: DARCULA_EXTENDED_THEME_NAME }
}
