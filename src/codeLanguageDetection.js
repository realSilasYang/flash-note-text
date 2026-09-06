import { getCodeFilenameInfo } from './editorMode'

const MAX_DETECTION_LENGTH = 32768

const HIGHLIGHT_LANGUAGE_MAP = Object.freeze({
  bash: 'Shell', c: 'C', cpp: 'C++', csharp: 'C#', css: 'CSS', diff: 'diff',
  go: 'Go', ini: 'Properties files', java: 'Java', javascript: 'JavaScript', json: 'JSON',
  kotlin: 'Kotlin', less: 'LESS', lua: 'Lua', objectivec: 'Objective-C',
  perl: 'Perl', php: 'PHP', python: 'Python', r: 'R', ruby: 'Ruby', rust: 'Rust',
  scss: 'SCSS', shell: 'Shell', sql: 'SQL', swift: 'Swift', typescript: 'TypeScript',
  vbnet: 'VB.NET', wasm: 'WebAssembly', xml: 'XML', yaml: 'YAML'
})

function result (language = null, confidence = 0, source = 'unknown', candidates = []) {
  const unique = []
  for (const candidate of candidates) {
    if (!candidate?.language || unique.some(item => item.language === candidate.language)) continue
    unique.push({ language: candidate.language, confidence: Math.max(0, Math.min(1, candidate.confidence || 0)) })
  }
  if (language && !unique.some(item => item.language === language)) unique.unshift({ language, confidence })
  return { language, confidence: Math.max(0, Math.min(1, confidence)), source, candidates: unique.slice(0, 3) }
}

function detectShebang (text) {
  const firstLine = String(text || '').split(/\r?\n/, 1)[0]
  if (!firstLine.startsWith('#!')) return null
  const checks = [
    [/\b(?:python\d*)\b/i, 'Python'], [/\b(?:node|deno|bun)\b/i, 'JavaScript'],
    [/\b(?:bash|zsh|ksh|fish|sh)\b/i, 'Shell'], [/\bruby\b/i, 'Ruby'],
    [/\bperl\b/i, 'Perl'], [/\bphp\b/i, 'PHP'], [/\blua\b/i, 'Lua'], [/\bRscript\b/, 'R']
  ]
  return checks.find(([pattern]) => pattern.test(firstLine))?.[1] || null
}

function detectAmbiguousExtension (extension, text) {
  const source = String(text || '')
  if (extension === 'h') {
    const cppScore = [
      /\bnamespace\s+[A-Za-z_]\w*/,
      /\btemplate\s*</,
      /\b(?:class|constexpr|decltype|noexcept|override)\b/,
      /\bstd::/,
      /\benum\s+class\b/,
      /\b(?:public|private|protected)\s*:/
    ].filter(pattern => pattern.test(source)).length
    const cScore = [
      /\b(?:_Atomic|_Generic|_Static_assert)\b/,
      /\brestrict\b/,
      /#include\s*<(?:stdbool|stdatomic|complex)\.h>/,
      /\btypedef\s+(?:struct|union|enum)\b/
    ].filter(pattern => pattern.test(source)).length
    if (cppScore > cScore && cppScore > 0) {
      return result('C++', cppScore > 1 ? 0.97 : 0.88, 'content-and-extension', [
        { language: 'C++', confidence: cppScore > 1 ? 0.97 : 0.88 },
        { language: 'C', confidence: 0.32 }
      ])
    }
    if (cScore > cppScore && cScore > 1) {
      return result('C', 0.86, 'content-and-extension', [
        { language: 'C', confidence: 0.86 },
        { language: 'C++', confidence: 0.34 }
      ])
    }
    return result(null, 0.52, 'ambiguous-extension', [
      { language: 'C', confidence: 0.52 },
      { language: 'C++', confidence: 0.48 }
    ])
  }
  if (extension === 'm') {
    const objectiveCScore = [/#import\s+[<"]/, /@(?:interface|implementation|property|protocol|autoreleasepool)\b/, /\[[A-Za-z_]\w*\s+\w+/].filter(pattern => pattern.test(source)).length
    const octaveScore = [/^\s*function\b/m, /^\s*%[^%]/m, /\b(?:zeros|ones|plot|disp|linspace)\s*\(/, /^\s*end\s*$/m].filter(pattern => pattern.test(source)).length
    if (octaveScore > objectiveCScore && octaveScore > 0) {
      const confidence = octaveScore > 1 ? 0.94 : 0.82
      return result('Octave', confidence, 'content-and-extension', [{ language: 'Octave', confidence }, { language: 'Objective-C', confidence: 0.3 }])
    }
    if (objectiveCScore > octaveScore && objectiveCScore > 0) {
      const confidence = objectiveCScore > 1 ? 0.96 : 0.84
      return result('Objective-C', confidence, 'content-and-extension', [{ language: 'Objective-C', confidence }, { language: 'Octave', confidence: 0.3 }])
    }
    return result(null, 0.5, 'ambiguous-extension', [
      { language: 'Objective-C', confidence: 0.5 },
      { language: 'Octave', confidence: 0.5 }
    ])
  }
  if (extension === 'pl') {
    const prologScore = [/:-/, /-->/, /^\s*[a-z]\w*\([^\n)]*\)\s*\.\s*$/m].filter(pattern => pattern.test(source)).length
    const perlScore = [/\buse\s+(?:strict|warnings)\b/, /\bmy\s+[$@%]/, /\bsub\s+\w+/, /[$@%][A-Za-z_]\w*/].filter(pattern => pattern.test(source)).length
    if (perlScore > prologScore && perlScore > 0) {
      const confidence = perlScore > 1 ? 0.94 : 0.82
      return result('Perl', confidence, 'content-and-extension', [{ language: 'Perl', confidence }])
    }
    return result(null, prologScore > perlScore ? 0.24 : 0.48, 'ambiguous-extension', [
      { language: 'Perl', confidence: prologScore > perlScore ? 0.24 : 0.48 }
    ])
  }
  return null
}

function normalizeHighlightLanguage (name, text) {
  if (name === 'xml') return /<!doctype\s+html|<html\b|<body\b|<div\b/i.test(text) ? 'HTML' : 'XML'
  return HIGHLIGHT_LANGUAGE_MAP[name] || null
}

function confidenceFromRelevance (best, second, sourceLength) {
  const relevance = Number(best?.relevance) || 0
  const margin = relevance - (Number(second?.relevance) || 0)
  const density = relevance / Math.max(1, Math.sqrt(Math.max(20, sourceLength) / 20))
  if (relevance >= 8 && margin >= 2) return 0.94
  if (relevance >= 5 && margin >= 1.5) return 0.86
  if (relevance >= 3 && margin >= 1 && density >= 1.2) return 0.74
  if (relevance >= 2 && margin >= 0.8) return 0.6
  return 0.35
}

export async function detectCodeLanguageFromSource ({ filename = '', text = '' } = {}) {
  const source = String(text || '').slice(0, MAX_DETECTION_LENGTH)
  const shebangLanguage = detectShebang(source)
  if (shebangLanguage) return result(shebangLanguage, 0.99, 'shebang', [{ language: shebangLanguage, confidence: 0.99 }])

  const fileInfo = getCodeFilenameInfo(filename)
  if (fileInfo.matched && !fileInfo.ambiguous) {
    return result(fileInfo.language, 0.99, 'filename', [{ language: fileInfo.language, confidence: 0.99 }])
  }
  if (fileInfo.ambiguous) {
    const ambiguous = detectAmbiguousExtension(fileInfo.extension, source)
    if (ambiguous) return ambiguous
  }
  if (!source.trim()) return result(null, 0, 'empty')

  const imported = await import(/* webpackChunkName: "code-language-detector" */ 'highlight.js/lib/common')
  const highlighter = imported.default || imported
  const detected = highlighter.highlightAuto(source)
  const bestLanguage = normalizeHighlightLanguage(detected.language, source)
  const secondLanguage = normalizeHighlightLanguage(detected.secondBest?.language, source)
  const confidence = confidenceFromRelevance(detected, detected.secondBest, source.length)
  const candidates = [
    bestLanguage ? { language: bestLanguage, confidence } : null,
    secondLanguage ? { language: secondLanguage, confidence: Math.max(0.2, confidence - 0.22) } : null
  ].filter(Boolean)
  return result(confidence >= 0.72 ? bestLanguage : null, confidence, 'content', candidates)
}
