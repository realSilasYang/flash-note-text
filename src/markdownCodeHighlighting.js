import hljs from 'highlight.js/lib/common'

const LANGUAGE_CLASS_PATTERN = /(?:^|\s)language-([^\s]+)/i

export function getMarkdownCodeLanguage (className) {
  return LANGUAGE_CLASS_PATTERN.exec(String(className || ''))?.[1]?.trim().toLowerCase() || ''
}

export function getMarkdownCodeLanguageLabel (language) {
  if (!language) return 'Text'
  return hljs.getLanguage(language)?.name || language
}

export function highlightMarkdownCode (source, className) {
  const code = String(source ?? '')
  const requestedLanguage = getMarkdownCodeLanguage(className)
  const highlightedLanguage = requestedLanguage && hljs.getLanguage(requestedLanguage)
    ? requestedLanguage
    : 'plaintext'

  try {
    return {
      html: hljs.highlight(code, { language: highlightedLanguage, ignoreIllegals: true }).value,
      language: requestedLanguage,
      label: getMarkdownCodeLanguageLabel(requestedLanguage),
      highlighted: highlightedLanguage !== 'plaintext'
    }
  } catch {
    return {
      html: hljs.highlight(code, { language: 'plaintext' }).value,
      language: requestedLanguage,
      label: getMarkdownCodeLanguageLabel(requestedLanguage),
      highlighted: false
    }
  }
}
