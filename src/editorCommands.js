function clampSelection (text, selectionStart, selectionEnd) {
  const start = Math.max(0, Math.min(selectionStart, text.length))
  const end = Math.max(start, Math.min(selectionEnd, text.length))
  return { start, end }
}

export function insertLineBreak (text, selectionStart, selectionEnd) {
  const { start, end } = clampSelection(text, selectionStart, selectionEnd)
  return {
    text: text.slice(0, start) + '\n' + text.slice(end),
    selectionStart: start + 1,
    selectionEnd: start + 1
  }
}

export function deleteLineBreakBackward (text, selectionStart, selectionEnd) {
  const { start, end } = clampSelection(text, selectionStart, selectionEnd)
  if (start !== end || start === 0 || text[start - 1] !== '\n') return null

  return {
    text: text.slice(0, start - 1) + text.slice(start),
    selectionStart: start - 1,
    selectionEnd: start - 1
  }
}

export function deleteSelectedLines (text, selectionStart, selectionEnd) {
  const { start, end } = clampSelection(text, selectionStart, selectionEnd)
  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const effectiveEnd = end > lineStart && text[end - 1] === '\n' ? end - 1 : end
  const nextLineBreak = text.indexOf('\n', effectiveEnd)
  const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak
  const deleteStart = lineStart > 0 ? lineStart - 1 : lineStart
  const deleteEnd = lineStart === 0 && lineEnd < text.length ? lineEnd + 1 : lineEnd
  const nextText = text.slice(0, deleteStart) + text.slice(deleteEnd)
  const nextSelection = Math.min(lineStart, nextText.length)

  return {
    text: nextText,
    selectionStart: nextSelection,
    selectionEnd: nextSelection
  }
}

export function toggleMarkdownWrap (text, selectionStart, selectionEnd, marker) {
  const { start, end } = clampSelection(text, selectionStart, selectionEnd)
  const markerLength = marker.length

  if (start !== end && text.slice(start, start + markerLength) === marker && text.slice(end - markerLength, end) === marker && end - start >= markerLength * 2) {
    const content = text.slice(start + markerLength, end - markerLength)
    return {
      text: text.slice(0, start) + content + text.slice(end),
      selectionStart: start,
      selectionEnd: start + content.length
    }
  }

  if (start >= markerLength && text.slice(start - markerLength, start) === marker && text.slice(end, end + markerLength) === marker) {
    return {
      text: text.slice(0, start - markerLength) + text.slice(start, end) + text.slice(end + markerLength),
      selectionStart: start - markerLength,
      selectionEnd: end - markerLength
    }
  }

  const selectedText = text.slice(start, end)
  return {
    text: text.slice(0, start) + marker + selectedText + marker + text.slice(end),
    selectionStart: start + markerLength,
    selectionEnd: end + markerLength
  }
}

function getSelectedLineRange (text, selectionStart, selectionEnd) {
  const { start, end } = clampSelection(text, selectionStart, selectionEnd)
  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const effectiveEnd = end > lineStart && text[end - 1] === '\n' ? end - 1 : end
  const nextLineBreak = text.indexOf('\n', effectiveEnd)
  const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak
  return { start, end, lineStart, lineEnd }
}

export function changeIndent (text, selectionStart, selectionEnd, outdent = false, indent = '  ') {
  const range = getSelectedLineRange(text, selectionStart, selectionEnd)

  if (!outdent && range.start === range.end) {
    return {
      text: text.slice(0, range.start) + indent + text.slice(range.end),
      selectionStart: range.start + indent.length,
      selectionEnd: range.start + indent.length
    }
  }

  const block = text.slice(range.lineStart, range.lineEnd)
  const lines = block.split('\n')
  let firstLineDelta = 0
  let totalDelta = 0

  const changedLines = lines.map((line, index) => {
    let changedLine
    let delta

    if (outdent) {
      const removable = line.startsWith('\t') ? 1 : Math.min(indent.length, line.match(/^ */)?.[0].length ?? 0)
      changedLine = line.slice(removable)
      delta = -removable
    } else {
      changedLine = indent + line
      delta = indent.length
    }

    if (index === 0) firstLineDelta = delta
    totalDelta += delta
    return changedLine
  })

  const changedBlock = changedLines.join('\n')
  const nextStart = Math.max(range.lineStart, range.start + firstLineDelta)
  const nextEnd = Math.max(nextStart, range.end + totalDelta)

  return {
    text: text.slice(0, range.lineStart) + changedBlock + text.slice(range.lineEnd),
    selectionStart: nextStart,
    selectionEnd: nextEnd
  }
}

export function findLineStart (text, lineNumber) {
  if (!Number.isInteger(lineNumber) || lineNumber < 1) return -1
  if (lineNumber === 1) return 0

  let currentLine = 1
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '\n') continue
    currentLine += 1
    if (currentLine === lineNumber) return index + 1
  }
  return -1
}
