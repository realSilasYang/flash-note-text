export const MARKDOWN_BLANK_LINE = '\u00a0'

export function detachUnindentedImagesFromLists (markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const output = []
  let inCodeFence = false
  const listItemPattern = /^\s*(?:[-+*]|\d+[.)])\s+\S/
  const unindentedImagePattern = /^!\[[^\]\n]*\]\((?:[^()\n]|\([^)\n]*\))+\)\s*$/

  lines.forEach((line, index) => {
    if (/^\s*(?:```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence
      output.push(line)
      return
    }

    if (!inCodeFence && unindentedImagePattern.test(line)) {
      const previousLine = output[output.length - 1] || ''
      const nextLine = lines[index + 1] || ''
      if (listItemPattern.test(previousLine)) output.push('')
      output.push(line)
      if (listItemPattern.test(nextLine)) output.push('')
      return
    }

    output.push(line)
  })

  return output.join('\n')
}

export function preserveMarkdownBlankLines (markdown) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const preservedLines = []
  let inCodeFence = false

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence
      preservedLines.push(line)
      continue
    }

    if (!inCodeFence && line.trim() === '') {
      preservedLines.push('', MARKDOWN_BLANK_LINE, '')
      continue
    }

    preservedLines.push(line)
  }

  return preservedLines.join('\n')
}

function trimTrailingBlankLines (lines) {
  let end = lines.length
  while (end > 0 && !lines[end - 1].trim()) end -= 1
  return lines.slice(0, end)
}

export function splitShareImageSections (markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
  const sections = []
  let current = null
  let startIndex = 0
  const firstContentIndex = lines.findIndex(line => line.trim())
  const centeredHeadingMatch = firstContentIndex >= 0
    ? lines[firstContentIndex].trim().match(/^\[(.+)\]$/)
    : null

  if (centeredHeadingMatch?.[1].trim()) {
    current = {
      heading: centeredHeadingMatch[1].trim(),
      headingAlignment: 'center',
      lines: []
    }
    startIndex = firstContentIndex + 1
    while (startIndex < lines.length && !lines[startIndex].trim()) startIndex += 1
  }

  for (const line of lines.slice(startIndex)) {
    if (/^##\s+/.test(line)) {
      if (current) sections.push({ ...current, lines: trimTrailingBlankLines(current.lines) })
      current = { heading: line.replace(/^##\s+/, '').trim(), lines: [] }
      continue
    }

    if (current?.heading && current.lines.length === 0 && !line.trim()) continue
    if (!current) current = { heading: '', lines: [] }
    current.lines.push(line)
  }

  if (current) sections.push(current)

  return sections
    .map(section => ({
      heading: section.heading.trim(),
      ...(section.headingAlignment ? { headingAlignment: section.headingAlignment } : {}),
      content: section.lines.join('\n')
    }))
    .filter(section => section.heading || section.content.trim())
}
