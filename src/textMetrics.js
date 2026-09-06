export function countLines (text) {
  const value = String(text || '')
  let lines = 1
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) === 10) lines += 1
  }
  return lines
}

export function countLinesBeforeOffset (text, offset) {
  const value = String(text || '')
  const end = Math.max(0, Math.min(value.length, Number.isFinite(Number(offset)) ? Number(offset) : 0))
  let lines = 1
  for (let index = 0; index < end; index += 1) {
    if (value.charCodeAt(index) === 10) lines += 1
  }
  return lines
}

export function getEditorCurrentLine (editor, fallbackText = '', fallbackOffset = 0) {
  const hasEditorValue = typeof editor?.value === 'string'
  const value = hasEditorValue ? editor.value : String(fallbackText || '')
  const editorOffset = Number(editor?.selectionStart)
  const offset = hasEditorValue && Number.isFinite(editorOffset) ? editorOffset : fallbackOffset
  return countLinesBeforeOffset(value, offset)
}

export function getFirstNonEmptyLine (text) {
  const value = String(text || '')
  let lineStart = 0
  while (lineStart <= value.length) {
    const lineEnd = value.indexOf('\n', lineStart)
    const end = lineEnd < 0 ? value.length : lineEnd
    const line = value.slice(lineStart, end).replace(/\r$/, '').trim()
    if (line) return line
    if (lineEnd < 0) break
    lineStart = lineEnd + 1
  }
  return ''
}
