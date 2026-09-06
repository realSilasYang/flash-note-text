const WHITESPACE_PATTERN = /\s/u
const BASIC_CJK_PATTERN = /[\u4e00-\u9fff]/u
const LATIN_LETTER_PATTERN = /\p{Script=Latin}/u
const ARABIC_DIGIT_PATTERN = /[0-9]/u
const PUNCTUATION_PATTERN = /\p{Punctuation}/u
const WORD_OR_PHRASE_PATTERN = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu

export function calculateTextStats (text) {
  const value = String(text || '')
  let totalCharacters = 0
  let effectiveCharacters = 0
  let basicCjkCharacters = 0
  let latinLetters = 0
  let arabicDigits = 0
  let punctuationMarks = 0
  let nonEmptyLines = 0
  let lineHasContent = false
  let pendingCarriageReturn = false

  // 在一次支持 Unicode 的遍历中同时统计字符分类和非空行数，避免先创建
  // 完整字符数组再重复扫描行信息，从而减少长文本统计时的临时内存和遍历开销。
  for (const character of value) {
    totalCharacters += 1

    if (pendingCarriageReturn) {
      pendingCarriageReturn = false
      if (character === '\n') continue
    }

    if (character === '\r' || character === '\n') {
      if (lineHasContent) nonEmptyLines += 1
      lineHasContent = false
      pendingCarriageReturn = character === '\r'
      continue
    }

    if (!WHITESPACE_PATTERN.test(character)) {
      effectiveCharacters += 1
      lineHasContent = true
    }
    if (BASIC_CJK_PATTERN.test(character)) basicCjkCharacters += 1
    if (LATIN_LETTER_PATTERN.test(character)) latinLetters += 1
    if (ARABIC_DIGIT_PATTERN.test(character)) arabicDigits += 1
    if (PUNCTUATION_PATTERN.test(character)) punctuationMarks += 1
  }

  if (lineHasContent) nonEmptyLines += 1

  let wordsAndPhrases = 0
  WORD_OR_PHRASE_PATTERN.lastIndex = 0
  while (WORD_OR_PHRASE_PATTERN.exec(value)) wordsAndPhrases += 1
  WORD_OR_PHRASE_PATTERN.lastIndex = 0

  return {
    totalCharacters,
    effectiveCharacters,
    basicCjkCharacters,
    wordsAndPhrases,
    latinLetters,
    arabicDigits,
    punctuationMarks,
    nonEmptyLines
  }
}
