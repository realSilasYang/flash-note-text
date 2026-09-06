export function prepareHistoryForRestore (history, selectedHistoryId, selectedText, editorMode, options = {}) {
  return (Array.isArray(history) ? history : []).map(item => {
    const base = item._draftBase || item
    const entry = item._id === selectedHistoryId && options.persistSelectedText !== false
      ? { ...item, content: selectedText, editorMode, ...(options.codeLanguage ? { codeLanguage: options.codeLanguage } : {}) }
      : base
    if (entry._transient && options.persistTransientEntries === false) return entry
    const hasContent = typeof entry.content === 'string'
      ? Boolean(entry.content.trim())
      : Number(entry.contentLength) > 0
    if (!hasContent && !entry.title?.trim()) {
      const transient = { ...entry, content: typeof entry.content === 'string' ? entry.content : '', _transient: true }
      delete transient._rev
      return transient
    }
    if (!entry._transient) {
      const persistent = { ...entry }
      delete persistent._draft
      delete persistent._draftBase
      return persistent
    }
    const persistent = { ...entry }
    delete persistent._transient
    delete persistent._rev
    return persistent
  })
}
