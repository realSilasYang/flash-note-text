export function escapeRegExp (value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findLiteralMatches (text, searchText) {
  if (!text || !searchText) return []

  const regex = new RegExp(escapeRegExp(searchText), 'giu')
  return Array.from(text.matchAll(regex), match => ({
    start: match.index,
    end: match.index + match[0].length
  }))
}

export function replaceLiteralMatches (text, searchText, replacement) {
  const matches = findLiteralMatches(text, searchText)
  if (matches.length === 0) return { text, count: 0 }

  const regex = new RegExp(escapeRegExp(searchText), 'giu')
  return {
    text: text.replace(regex, () => replacement),
    count: matches.length
  }
}
