function normalizeSearchValue (value) {
  return String(value || '').toLocaleLowerCase()
}

export function markdownToPlainText (value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, block => block.replace(/^```[^\n]*\n?|```$/g, ''))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)/gm, '')
    .replace(/[*_~`]/g, '')
}

export function filterHistoryEntries (history, query) {
  const normalizedQuery = normalizeSearchValue(query).trim()
  if (!normalizedQuery) return history

  return history.filter(item => matchesHistoryEntry(item, normalizedQuery, true))
}

export function matchesHistoryEntry (item, query, queryIsNormalized = false) {
  const normalizedQuery = queryIsNormalized ? String(query || '').trim() : normalizeSearchValue(query).trim()
  if (!normalizedQuery) return true
  return (
    normalizeSearchValue(item.title).includes(normalizedQuery) ||
    normalizeSearchValue(item.content).includes(normalizedQuery) ||
    (item.editorMode === 'markdown' && normalizeSearchValue(markdownToPlainText(item.content)).includes(normalizedQuery))
  )
}

export function getHistorySearchSnippet (item, query, maxLength = 44) {
  const source = item?.editorMode === 'markdown' ? markdownToPlainText(item?.content) : item?.content
  const content = String(source || '').replace(/\s+/g, ' ').trim()
  if (!content || content.length <= maxLength) return content

  const normalizedQuery = normalizeSearchValue(query).trim()
  const matchIndex = normalizedQuery
    ? normalizeSearchValue(content).indexOf(normalizedQuery)
    : -1
  const preferredStart = matchIndex >= 0
    ? matchIndex - Math.floor((maxLength - normalizedQuery.length) / 2)
    : 0
  const start = Math.max(0, Math.min(preferredStart, content.length - maxLength))
  const end = Math.min(content.length, start + maxLength)
  return `${start > 0 ? '...' : ''}${content.slice(start, end)}${end < content.length ? '...' : ''}`
}
