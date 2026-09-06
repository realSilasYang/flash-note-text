export const TEXT_FORMATTING_ACTIONS = Object.freeze([
  'reflowLines',
  'escapedBreaks',
  'removeWhitespace',
  'ghostCharactersToSpaces',
  'removeHalfwidthSpaces',
  'removeBlankLines',
  'removeCitationNumbers',
  'removeLinks',
  'spaceCjkLatin',
  'punctuationToCjk',
  'punctuationToLatin'
])

const EXTRA_LINE_BREAK_CHARACTERS = [0x0B, 0x0C, 0x85, 0x2028, 0x2029]
  .map(codePoint => String.fromCodePoint(codePoint))
  .join('')
const LINE_BREAK_CHARACTER_CLASS = `\\r\\n${EXTRA_LINE_BREAK_CHARACTERS}`
const LINE_BREAK_PATTERN = new RegExp(`\\r\\n|[${LINE_BREAK_CHARACTER_CLASS}]`, 'g')
const LINE_WITH_ENDING_PATTERN = new RegExp(`([^${LINE_BREAK_CHARACTER_CLASS}]*)(\\r\\n|[${LINE_BREAK_CHARACTER_CLASS}]|$)`, 'g')
const CJK_CHARACTER = /[\p{Script_Extensions=Han}\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Hangul}\p{Script_Extensions=Bopomofo}]/u
const LATIN_CHARACTER = /\p{Script_Extensions=Latin}/u
const LATIN_OR_NUMBER = /[\p{Script_Extensions=Latin}\p{Number}]/u
const MATHEMATICAL_LATIN = /[\u{1D400}-\u{1D7FF}]/u
const WORD_CHARACTER = /[\p{Letter}\p{Number}]/u
const MARK_CHARACTER = /(?:\p{Mark}|\u309B|\u309C|\uFE0E|\uFE0F)/u
const HORIZONTAL_WHITESPACE = /[\p{Zs}\t\uFEFF\u200B\u2060]/gu
const GHOST_CHARACTER_PATTERN = /[\u00A0\u00AD\u1680\u180E\u200B\u200C\u200E\u200F\u202A-\u202E\u202F\u205F\u2060-\u2064\u2066-\u2069\u3000\uFEFF]/gu
const BLANK_LINE = /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u
const SPACE_SEPARATED_SCRIPT = /[\p{Script_Extensions=Latin}\p{Script_Extensions=Greek}\p{Script_Extensions=Cyrillic}\p{Script_Extensions=Armenian}\p{Script_Extensions=Hebrew}\p{Script_Extensions=Arabic}\p{Script_Extensions=Georgian}\p{Script_Extensions=Ethiopic}\p{Script_Extensions=Devanagari}\p{Script_Extensions=Bengali}\p{Script_Extensions=Gurmukhi}\p{Script_Extensions=Gujarati}\p{Script_Extensions=Oriya}\p{Script_Extensions=Tamil}\p{Script_Extensions=Telugu}\p{Script_Extensions=Kannada}\p{Script_Extensions=Malayalam}\p{Script_Extensions=Sinhala}]/u
const CITATION_TOKEN_PATTERN = /(?:\[[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*\]|［[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*］|【[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*】|〔[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*〕|﹝[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*﹞|｟[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*｠)/gu
const ASCII_CITATION_TOKEN_PATTERN = /^\[[ \t]*\p{Decimal_Number}+(?:[ \t]*(?:[-–—~至到,，、;；～‑−])[ \t]*\p{Decimal_Number}+)*[ \t]*\]$/u
const CITATION_CLUSTER_GAP_PATTERN = /^[ \t]*(?:[,，、;；][ \t]*)?$/u
const DUPLICATE_SENTENCE_PUNCTUATION = new Set(['.', '。', '!', '！', '?', '？'])

function toText (text) {
  return String(text ?? '')
}

function normalizeLineBreaks (text) {
  return toText(text).replace(LINE_BREAK_PATTERN, '\n')
}

function isMarkCharacter (character) {
  return Boolean(character) && MARK_CHARACTER.test(character)
}

function isCjkCharacter (character) {
  return Boolean(character) && CJK_CHARACTER.test(character) && WORD_CHARACTER.test(character)
}

function isLatinOrNumberCharacter (character) {
  return Boolean(character) &&
    (LATIN_OR_NUMBER.test(character) || MATHEMATICAL_LATIN.test(character)) &&
    WORD_CHARACTER.test(character) &&
    !isCjkCharacter(character)
}

function isLatinCharacter (character) {
  return Boolean(character) && LATIN_CHARACTER.test(character) && WORD_CHARACTER.test(character)
}

function isWordCharacter (character) {
  return Boolean(character) && WORD_CHARACTER.test(character)
}

function isSpaceSeparatedCharacter (character) {
  return isWordCharacter(character) &&
    (Boolean(character) && (/[\p{Number}]/u.test(character) || SPACE_SEPARATED_SCRIPT.test(character)))
}

function firstBaseCharacter (value) {
  for (const character of [...value]) {
    if (!isMarkCharacter(character)) return character
  }
  return ''
}

function lastBaseCharacter (value) {
  const characters = [...value]
  for (let index = characters.length - 1; index >= 0; index -= 1) {
    if (!isMarkCharacter(characters[index])) return characters[index]
  }
  return ''
}

function adjacentBaseCharacter (characters, index, step) {
  for (let cursor = index + step; cursor >= 0 && cursor < characters.length; cursor += step) {
    if (!isMarkCharacter(characters[cursor])) return characters[cursor]
  }
  return ''
}

function shouldSeparateWrappedWords (left, right) {
  const leftCharacter = lastBaseCharacter(left)
  const rightCharacter = firstBaseCharacter(right)
  return isSpaceSeparatedCharacter(leftCharacter) &&
    isSpaceSeparatedCharacter(rightCharacter) &&
    !isCjkCharacter(leftCharacter) &&
    !isCjkCharacter(rightCharacter)
}

function isBlankLine (line) {
  return BLANK_LINE.test(line)
}

function containsMarkdownStructure (text) {
  for (const line of normalizeLineBreaks(text).split('\n')) {
    if (/^\s{0,3}(`{3,}|~{3,})/.test(line)) return true
    if (/^(?: {4}|\t)\S/u.test(line)) return true
    if (/^\s{0,3}(?:#{1,6}(?:\s|$)|>\s?|[-+*]\s+|\d+[.)]\s+|(?:\*\s*){3,}|(?:_\s*){3,}|(?:-\s*){3,}|[=-]{2,}\s*$|\[[^\]]+\]:\s*\S|<\/?[A-Za-z])/u.test(line)) return true
    if (/^\s{0,3}\|.*\|\s*$/u.test(line)) return true
  }
  return false
}

function reflowLines (text, options = {}) {
  const normalized = normalizeLineBreaks(text)
  if (options.editorMode === 'code' || (options.editorMode === 'markdown' && containsMarkdownStructure(normalized))) {
    return normalized
  }
  const paragraphs = []
  let paragraph = []

  for (const rawLine of normalized.split('\n')) {
    if (isBlankLine(rawLine)) {
      if (paragraph.length) paragraphs.push(paragraph)
      paragraph = []
      continue
    }
    const line = rawLine.trim()
    if (line) paragraph.push(line)
  }
  if (paragraph.length) paragraphs.push(paragraph)

  return paragraphs
    .map(lines => lines.reduce((result, line) => {
      if (!result) return line
      return result + (shouldSeparateWrappedWords(result, line) ? ' ' : '') + line
    }, ''))
    .join('\n\n')
}

function convertEscapedBreaks (text) {
  const source = toText(text)
  let result = ''

  for (let index = 0; index < source.length;) {
    if (source[index] !== '\\') {
      result += source[index]
      index += 1
      continue
    }

    const slashStart = index
    while (source[index] === '\\') index += 1
    const slashCount = index - slashStart
    const isEscapedBreak = slashCount % 2 === 1
    let breakLength = 0
    if (isEscapedBreak && source[index] === 'r') {
      if (source[index + 1] === '\\' && source[index + 2] === 'n') breakLength = 3
      else breakLength = 1
    } else if (isEscapedBreak && source[index] === 'n') {
      breakLength = 1
    }

    if (breakLength) {
      result += '\\'.repeat(Math.floor(slashCount / 2))
      result += '\n'
      index += breakLength
    } else {
      result += '\\'.repeat(slashCount)
    }
  }
  return result
}

function removeWhitespace (text) {
  return toText(text).replace(HORIZONTAL_WHITESPACE, '')
}

function ghostCharactersToSpaces (text) {
  return toText(text).replace(GHOST_CHARACTER_PATTERN, ' ')
}

function removeHalfwidthSpaces (text) {
  return toText(text).replace(/ +/g, '')
}

function removeBlankLines (text) {
  return normalizeLineBreaks(text)
    .split('\n')
    .filter(line => !isBlankLine(line))
    .join('\n')
}

function removeCitationNumbersFromSegment (segment) {
  const matches = []
  for (const match of segment.matchAll(CITATION_TOKEN_PATTERN)) {
    const start = match.index
    if (isEscapedCharacter(segment, start)) continue
    const end = start + match[0].length
    const previous = matches[matches.length - 1]
    if (previous && CITATION_CLUSTER_GAP_PATTERN.test(segment.slice(previous.end, start))) {
      previous.end = end
    } else {
      matches.push({ start, end })
    }
  }
  if (matches.length === 0) return segment

  let result = ''
  let cursor = 0
  for (const citation of matches) {
    const leading = segment.slice(cursor, citation.start).match(/[ \t]+$/u)?.[0] || ''
    const trailing = segment.slice(citation.end).match(/^[ \t]+/u)?.[0] || ''
    const replacementStart = citation.start - leading.length
    const replacementEnd = citation.end + trailing.length
    const before = segment[replacementStart - 1] || ''
    const after = segment[replacementEnd] || ''

    result += segment.slice(cursor, replacementStart)
    if (before === after && DUPLICATE_SENTENCE_PUNCTUATION.has(after)) {
      cursor = replacementEnd + 1
      continue
    }
    if (isSpaceSeparatedCharacter(before) && isSpaceSeparatedCharacter(after)) result += ' '
    cursor = replacementEnd
  }
  return result + segment.slice(cursor)
}

function removeCitationNumbers (text) {
  const source = toText(text)
  const referenceLabels = collectReferenceLabels(source)
  return transformOutsideProtectedSegments(source, removeCitationNumbersFromSegment, {
    referenceLabels,
    protectImageLabels: true,
    protectFencedCode: true,
    protectIndentedCode: true
  })
}

function findClosingDelimiter (text, start, opening, closing) {
  let depth = 0
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === '\\') {
      index += 1
      continue
    }
    if (text[index] === opening) depth += 1
    if (text[index] !== closing) continue
    depth -= 1
    if (depth === 0) return index
  }
  return -1
}

function isEscapedCharacter (text, index) {
  let slashCount = 0
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) slashCount += 1
  return slashCount % 2 === 1
}

function normalizeReferenceLabel (label) {
  return label
    .replace(/\\([[\]\\])/g, '$1')
    .trim()
    .replace(/\p{White_Space}+/gu, ' ')
    .toLowerCase()
}

function buildDelimiterMap (text, opening, closing) {
  const stack = []
  const endings = new Map()
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\\') {
      index += 1
      continue
    }
    if (text[index] === opening) stack.push(index)
    else if (text[index] === closing && stack.length) endings.set(stack.pop(), index)
  }
  return endings
}

function buildReferenceDefinitionRanges (text) {
  const ranges = new Map()
  for (const match of text.matchAll(LINE_WITH_ENDING_PATTERN)) {
    const [, line, ending] = match
    if (!line && !ending) break
    if (parseReferenceDefinition(line)) ranges.set(match.index, match.index + line.length)
  }
  return ranges
}

function findMappedImageEnd (text, start, rangeEnd, referenceLabels, bracketEndings, parenthesisEndings) {
  if (text[start] !== '!' || text[start + 1] !== '[' || isEscapedCharacter(text, start)) return -1
  const labelEnd = bracketEndings.get(start + 1)
  if (!Number.isInteger(labelEnd) || labelEnd >= rangeEnd) return -1
  const destinationStart = labelEnd + 1
  if (text[destinationStart] === '(') {
    const destinationEnd = parenthesisEndings.get(destinationStart)
    return Number.isInteger(destinationEnd) && destinationEnd < rangeEnd ? destinationEnd : -1
  }
  if (text[destinationStart] === '[') {
    const destinationEnd = bracketEndings.get(destinationStart)
    return Number.isInteger(destinationEnd) && destinationEnd < rangeEnd ? destinationEnd : -1
  }
  const label = text.slice(start + 2, labelEnd)
  return referenceLabels.has(normalizeReferenceLabel(label)) ? labelEnd : -1
}

function findMappedLink (text, start, rangeEnd, referenceLabels, bracketEndings, parenthesisEndings) {
  if (text[start] !== '[') return null
  const labelEnd = bracketEndings.get(start)
  if (!Number.isInteger(labelEnd) || labelEnd >= rangeEnd) return null
  const labelStart = start + 1
  const label = text.slice(labelStart, labelEnd)
  const destinationStart = labelEnd + 1

  if (text[destinationStart] === '(') {
    const linkEnd = parenthesisEndings.get(destinationStart)
    return Number.isInteger(linkEnd) && linkEnd < rangeEnd ? { labelStart, labelEnd, linkEnd } : null
  }
  if (text[destinationStart] === '[') {
    const linkEnd = bracketEndings.get(destinationStart)
    if (!Number.isInteger(linkEnd) || linkEnd >= rangeEnd) return null
    const explicitReference = text.slice(destinationStart + 1, linkEnd)
    const reference = explicitReference || label
    return referenceLabels.has(normalizeReferenceLabel(reference)) ? { labelStart, labelEnd, linkEnd } : null
  }
  return referenceLabels.has(normalizeReferenceLabel(label)) ? { labelStart, labelEnd, linkEnd: labelEnd } : null
}

function stripMarkdownLinks (text, referenceLabels = new Set()) {
  const bracketEndings = buildDelimiterMap(text, '[', ']')
  const parenthesisEndings = buildDelimiterMap(text, '(', ')')
  const referenceDefinitionRanges = buildReferenceDefinitionRanges(text)
  const frames = [{ start: 0, end: text.length, index: 0, parts: [] }]
  while (frames.length) {
    const frame = frames[frames.length - 1]
    if (frame.index >= frame.end) {
      const completed = frame.parts.join('')
      frames.pop()
      if (!frames.length) return completed
      frames[frames.length - 1].parts.push(completed)
      continue
    }

    const referenceDefinitionEnd = frames.length === 1 ? referenceDefinitionRanges.get(frame.index) : undefined
    if (Number.isInteger(referenceDefinitionEnd)) {
      frame.parts.push(text.slice(frame.index, referenceDefinitionEnd))
      frame.index = referenceDefinitionEnd
      continue
    }

    const imageEnd = findMappedImageEnd(text, frame.index, frame.end, referenceLabels, bracketEndings, parenthesisEndings)
    if (imageEnd >= 0) {
      frame.parts.push(text.slice(frame.index, imageEnd + 1))
      frame.index = imageEnd + 1
      continue
    }

    const link = findMappedLink(text, frame.index, frame.end, referenceLabels, bracketEndings, parenthesisEndings)
    if (!link) {
      frame.parts.push(text[frame.index])
      frame.index += 1
      continue
    }
    frame.index = link.linkEnd + 1
    frames.push({ start: link.labelStart, end: link.labelEnd, index: link.labelStart, parts: [] })
  }
  return ''
}

function parseReferenceDefinition (line) {
  const indentation = line.match(/^ {0,3}/)?.[0].length || 0
  if (line[indentation] !== '[') return ''
  const labelEnd = findClosingDelimiter(line, indentation, '[', ']')
  if (labelEnd < 0 || line[labelEnd + 1] !== ':') return ''
  const destination = line.slice(labelEnd + 2).trimStart()
  if (!destination || (destination[0] === '<' ? destination.indexOf('>') <= 1 : !/^\S+/u.test(destination))) return ''
  return line.slice(indentation + 1, labelEnd)
}

function collectReferenceLabels (text) {
  const referenceLabels = new Set()
  let fenceCharacter = ''
  let fenceLength = 0
  const lines = text.matchAll(LINE_WITH_ENDING_PATTERN)
  for (const match of lines) {
    const [, line, ending] = match
    if (!line && !ending) break
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1] || ''
    const closingFence = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/u)?.[1] || ''
    if (fenceCharacter) {
      if (closingFence && closingFence[0] === fenceCharacter && closingFence.length >= fenceLength) {
        fenceCharacter = ''
        fenceLength = 0
      }
      continue
    }
    if (/^(?: {4}|\t)/u.test(line)) continue
    if (fence) {
      fenceCharacter = fence[0]
      fenceLength = fence.length
      continue
    }
    const label = parseReferenceDefinition(line)
    if (label) referenceLabels.add(normalizeReferenceLabel(label))
  }
  return referenceLabels
}

function collectImageReferenceLabels (text, referenceLabels) {
  const imageLabels = new Set()
  for (let index = 0; index < text.length;) {
    if (text[index] !== '!' || text[index + 1] !== '[' || isEscapedCharacter(text, index)) {
      index += 1
      continue
    }
    const labelEnd = findClosingDelimiter(text, index + 1, '[', ']')
    if (labelEnd < 0) {
      index += 1
      continue
    }
    const label = text.slice(index + 2, labelEnd)
    const destinationStart = labelEnd + 1
    if (text[destinationStart] === '(') {
      const imageEnd = findClosingDelimiter(text, destinationStart, '(', ')')
      index = imageEnd < 0 ? labelEnd + 1 : imageEnd + 1
      continue
    }
    if (text[destinationStart] === '[') {
      const imageEnd = findClosingDelimiter(text, destinationStart, '[', ']')
      if (imageEnd >= 0) {
        const explicitReference = text.slice(destinationStart + 1, imageEnd)
        const normalized = normalizeReferenceLabel(explicitReference || label)
        if (referenceLabels.has(normalized)) imageLabels.add(normalized)
        index = imageEnd + 1
        continue
      }
    }
    const normalized = normalizeReferenceLabel(label)
    if (referenceLabels.has(normalized)) imageLabels.add(normalized)
    index = labelEnd + 1
  }
  return imageLabels
}

function removeReferenceDefinitions (text, preservedLabels = new Set()) {
  const referenceLabels = new Set()
  const lines = text.matchAll(LINE_WITH_ENDING_PATTERN)
  let result = ''
  for (const match of lines) {
    const [, line, ending] = match
    if (!line && !ending) break
    const label = parseReferenceDefinition(line)
    if (label) {
      const normalized = normalizeReferenceLabel(label)
      referenceLabels.add(normalized)
      if (preservedLabels.has(normalized)) result += line + ending
    } else result += line + ending
  }
  return { text: result, referenceLabels }
}

function removeLinks (text) {
  const withoutAnchors = toText(text).replace(/<a\b(?:[^>"']|"[^"]*"|'[^']*')*>([\s\S]*?)<\/a>/gi, '$1')
  const allReferenceLabels = collectReferenceLabels(withoutAnchors)
  const imageReferenceLabels = collectImageReferenceLabels(withoutAnchors, allReferenceLabels)
  const withoutDefinitions = removeReferenceDefinitions(withoutAnchors, imageReferenceLabels)
  return stripMarkdownLinks(withoutDefinitions.text, withoutDefinitions.referenceLabels)
    .replace(/<([a-z][a-z0-9+.-]{1,31}:[^<>\s]+)>/gi, '$1')
    .replace(/<([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)>/g, '$1')
}

function addCjkLatinSpacing (text) {
  const characters = [...toText(text)]
  const clusters = []
  for (let index = 0; index < characters.length;) {
    const start = index
    index += 1
    while (index < characters.length && isMarkCharacter(characters[index])) index += 1
    const value = characters.slice(start, index).join('')
    const base = characters[start]
    clusters.push({ value, cjk: isCjkCharacter(base), latin: isLatinOrNumberCharacter(base) })
  }

  let result = ''
  let previous = null
  for (const cluster of clusters) {
    if (previous && ((previous.cjk && cluster.latin) || (previous.latin && cluster.cjk))) result += ' '
    result += cluster.value
    previous = cluster
  }
  return result
}

function replaceStraightQuotes (text) {
  let doubleQuoteOpen = true
  let singleQuoteOpen = true
  const characters = [...text]
  return characters.map((character, index) => {
    if (character === '"') {
      const previous = adjacentBaseCharacter(characters, index, -1)
      const next = adjacentBaseCharacter(characters, index, 1)
      if (/\p{Number}/u.test(previous) && (!next || /[\p{White_Space}\p{Punctuation}]/u.test(next))) return character
      const isOpening = !previous || /[\p{White_Space}\p{Punctuation}]/u.test(previous)
      const isClosing = !next || /[\p{White_Space}\p{Punctuation})\]}>]/u.test(next)
      const useOpening = isOpening && !isClosing ? true : isClosing && !isOpening ? false : doubleQuoteOpen
      const replacement = useOpening ? '“' : '”'
      doubleQuoteOpen = !useOpening
      return replacement
    }
    if (character !== "'") return character
    const previous = adjacentBaseCharacter(characters, index, -1)
    const next = adjacentBaseCharacter(characters, index, 1)
    const joinsLetters = /\p{Letter}/u.test(previous) && /\p{Letter}/u.test(next) &&
      !isCjkCharacter(previous) && !isCjkCharacter(next)
    const joinsNumbers = /\p{Number}/u.test(previous) && /\p{Number}/u.test(next)
    if ((isLatinCharacter(previous) && isLatinCharacter(next)) || joinsLetters || joinsNumbers) return character
    const isOpening = !previous || /[\p{White_Space}\p{Punctuation}]/u.test(previous)
    const isClosing = !next || /[\p{White_Space}\p{Punctuation})\]}>]/u.test(next)
    const useOpening = isOpening && !isClosing ? true : isClosing && !isOpening ? false : singleQuoteOpen
    const replacement = useOpening ? '‘' : '’'
    singleQuoteOpen = !useOpening
    return replacement
  }).join('')
}

function findCodeSpanEnd (text, start) {
  if (text[start] !== '`') return -1
  let markerEnd = start
  while (text[markerEnd] === '`') markerEnd += 1
  const marker = text.slice(start, markerEnd)
  const closing = text.indexOf(marker, markerEnd)
  return closing < 0 ? -1 : closing + marker.length
}

function findFencedCodeBlockEnd (text, start) {
  if (start > 0 && text[start - 1] !== '\n' && text[start - 1] !== '\r') return -1
  const openingEnd = text.indexOf('\n', start)
  const openingLine = text.slice(start, openingEnd < 0 ? text.length : openingEnd).replace(/\r$/u, '')
  const marker = openingLine.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1] || ''
  if (!marker) return -1

  let lineStart = openingEnd < 0 ? text.length : openingEnd + 1
  while (lineStart < text.length) {
    const lineEnd = text.indexOf('\n', lineStart)
    const line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd).replace(/\r$/u, '')
    const closing = line.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/u)?.[1] || ''
    if (closing && closing[0] === marker[0] && closing.length >= marker.length) return lineEnd < 0 ? text.length : lineEnd + 1
    if (lineEnd < 0) break
    lineStart = lineEnd + 1
  }
  return text.length
}

function findIndentedCodeBlockEnd (text, start) {
  if (start > 0 && text[start - 1] !== '\n' && text[start - 1] !== '\r') return -1
  let lineStart = start
  let end = start
  let sawCodeLine = false
  while (lineStart < text.length) {
    const lineEnd = text.indexOf('\n', lineStart)
    const line = text.slice(lineStart, lineEnd < 0 ? text.length : lineEnd).replace(/\r$/u, '')
    if (/^(?: {4}|\t)/u.test(line)) {
      sawCodeLine = true
      end = lineEnd < 0 ? text.length : lineEnd + 1
      if (lineEnd < 0) break
      lineStart = lineEnd + 1
      continue
    }
    if (sawCodeLine && line.trim() === '') {
      end = lineEnd < 0 ? text.length : lineEnd + 1
      if (lineEnd < 0) break
      lineStart = lineEnd + 1
      continue
    }
    break
  }
  return sawCodeLine ? end : -1
}

function findHtmlLikeEnd (text, start) {
  if (text[start] !== '<' || !/[A-Za-z!/?]/.test(text[start + 1] || '')) return -1
  let quote = ''
  for (let index = start + 1; index < text.length; index += 1) {
    const character = text[index]
    if (quote) {
      if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '>') return index + 1
    else if (character === '\n' || character === '\r') return -1
  }
  return -1
}

function findProtectedMarkdownEnd (text, start, options = {}) {
  const labelStart = text[start] === '!' ? start + 1 : start
  if (text[labelStart] !== '[' || isEscapedCharacter(text, labelStart)) return -1
  const labelEnd = findClosingDelimiter(text, labelStart, '[', ']')
  if (labelEnd < 0) return -1
  const label = text.slice(labelStart + 1, labelEnd)
  const destinationStart = labelEnd + 1
  if (text[destinationStart] === '(') {
    const destinationEnd = findClosingDelimiter(text, destinationStart, '(', ')')
    return destinationEnd < 0 ? -1 : destinationEnd + 1
  }
  if (text[destinationStart] === '[') {
    const destinationEnd = findClosingDelimiter(text, destinationStart, '[', ']')
    if (destinationEnd < 0) return -1
    if (text[start] === '!') return destinationEnd + 1
    if (options.referenceLabels) {
      const explicitReference = text.slice(destinationStart + 1, destinationEnd)
      const reference = normalizeReferenceLabel(explicitReference || label)
      if (options.referenceLabels.has(reference)) return destinationEnd + 1
    }
    if (!ASCII_CITATION_TOKEN_PATTERN.test(text.slice(destinationStart, destinationEnd + 1))) return destinationEnd + 1
    return -1
  }
  if (options.referenceLabels?.has(normalizeReferenceLabel(label))) return labelEnd + 1
  if (options.protectImageLabels && text[start] === '!') return labelEnd + 1
  return -1
}

function findUrlLikeEnd (text, start) {
  if (start > 0 && /[\p{Letter}\p{Number}._%+-]/u.test(text[start - 1])) return -1
  if (!/[\p{Letter}\p{Number}]/u.test(text[start] || '')) return -1
  const pattern = /(?:(?:[a-z][a-z0-9+.-]*:\/\/|mailto:)[^\s<>"']+|[^\s<>"'@]+@[^\s<>"'@]+\.[^\s<>"'@]+)/iuy
  pattern.lastIndex = start
  const match = pattern.exec(text)
  return match ? pattern.lastIndex : -1
}

function transformOutsideProtectedSegments (text, transform, options = {}) {
  let result = ''
  let plainStart = 0
  let index = 0
  while (index < text.length) {
    const protectedEnd = Math.max(
      options.protectFencedCode ? findFencedCodeBlockEnd(text, index) : -1,
      options.protectIndentedCode ? findIndentedCodeBlockEnd(text, index) : -1,
      findCodeSpanEnd(text, index),
      findHtmlLikeEnd(text, index),
      findProtectedMarkdownEnd(text, index, options),
      findUrlLikeEnd(text, index)
    )
    if (protectedEnd <= index) {
      index += 1
      continue
    }
    result += transform(text.slice(plainStart, index)) + text.slice(index, protectedEnd)
    index = protectedEnd
    plainStart = protectedEnd
  }
  return result + transform(text.slice(plainStart))
}

function replaceAsciiStops (text) {
  const characters = [...text]
  return characters.map((character, index) => {
    if (character !== '.') return character
    const previous = adjacentBaseCharacter(characters, index, -1)
    const next = adjacentBaseCharacter(characters, index, 1)
    const belongsToToken = isLatinOrNumberCharacter(next) &&
      (isLatinOrNumberCharacter(previous) || !isWordCharacter(previous))
    return belongsToToken ? character : '。'
  }).join('')
}

function punctuationToCjk (text, options = {}) {
  if (options.editorMode === 'code') return toText(text)
  const replacements = new Map([
    [',', '，'], [';', '；'], [':', '：'], ['?', '？'], ['!', '！'],
    ['(', '（'], [')', '）'], ['[', '【'], [']', '】'], ['{', '｛'], ['}', '｝'],
    ['<', '《'], ['>', '》'], ['~', '～']
  ])
  return transformOutsideProtectedSegments(toText(text), segment => {
    const withEllipses = segment.replace(/\.{3}/g, '……').replace(/--/g, '——')
    const withStops = replaceAsciiStops(withEllipses)
    const withMappedPunctuation = [...withStops].map(character => replacements.get(character) || character).join('')
    return replaceStraightQuotes(withMappedPunctuation)
  })
}

function punctuationToLatin (text, options = {}) {
  if (options.editorMode === 'code') return toText(text)
  const replacements = new Map([
    ['，', ','], ['、', ','], ['。', '.'], ['．', '.'], ['；', ';'], ['：', ':'], ['？', '?'], ['！', '!'],
    ['（', '('], ['）', ')'], ['【', '['], ['】', ']'], ['〔', '['], ['〕', ']'], ['｛', '{'], ['｝', '}'],
    ['《', '<'], ['》', '>'], ['〈', '<'], ['〉', '>'], ['～', '~'], ['〜', '~'],
    ['“', '"'], ['”', '"'], ['‘', "'"], ['’', "'"], ['「', '"'], ['」', '"'], ['『', '"'], ['』', '"'],
    ['﹁', '"'], ['﹂', '"'], ['﹃', '"'], ['﹄', '"'], ['〝', '"'], ['〞', '"'], ['—', '--'], ['＂', '"'], ['＇', "'"],
    ['｡', '.'], ['､', ','],
    ['＃', '#'], ['％', '%'], ['＆', '&'], ['＋', '+'], ['－', '-'], ['＜', '<'], ['＝', '='], ['＞', '>'],
    ['＠', '@'], ['［', '['], ['＼', '\\'], ['］', ']'], ['＾', '^'], ['＿', '_'], ['｀', '`'], ['｜', '|']
  ])
  return transformOutsideProtectedSegments(toText(text), segment => {
    const normalized = segment.replace(/……/g, '...').replace(/…/g, '...').replace(/——/g, '--')
    return [...normalized].map(character => {
      const replacement = replacements.get(character)
      if (replacement) return replacement
      const codePoint = character.codePointAt(0)
      if (codePoint < 0xFF01 || codePoint > 0xFF5E || /[\p{Letter}\p{Number}]/u.test(character)) return character
      return String.fromCodePoint(codePoint - 0xFEE0)
    }).join('')
  })
}

const formatters = Object.freeze({
  reflowLines,
  escapedBreaks: convertEscapedBreaks,
  removeWhitespace,
  ghostCharactersToSpaces,
  removeHalfwidthSpaces,
  removeBlankLines,
  removeCitationNumbers,
  removeLinks,
  spaceCjkLatin: addCjkLatinSpacing,
  punctuationToCjk,
  punctuationToLatin
})

export function formatText (text, action, options = {}) {
  const formatter = formatters[action]
  if (!formatter) return toText(text)
  return formatter(text, options)
}

export function mapFormattedOffset (text, action, offset, options = {}) {
  const source = toText(text)
  const boundedOffset = Math.max(0, Math.min(source.length, Number(offset) || 0))
  if (boundedOffset === 0) return 0
  if (boundedOffset === source.length) return formatText(source, action, options).length
  return formatText(source.slice(0, boundedOffset), action, options).length
}
