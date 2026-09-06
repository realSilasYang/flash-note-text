import { isKeyboardEventComposing } from './shortcut'

export const MARKDOWN_SHORTCUT_ACTIONS = Object.freeze({
  BLOCKQUOTE: 'blockquote',
  BULLET_LIST: 'bullet-list',
  BOLD: 'bold',
  CLEAR_FORMATTING: 'clear-formatting',
  CODE_BLOCK: 'code-block',
  DECREASE_HEADING: 'decrease-heading',
  FORMULA_BLOCK: 'formula-block',
  INCREASE_HEADING: 'increase-heading',
  INLINE_CODE: 'inline-code',
  ITALIC: 'italic',
  LINK: 'link',
  ORDERED_LIST: 'ordered-list',
  PARAGRAPH: 'paragraph',
  STRIKETHROUGH: 'strikethrough',
  UNDERLINE: 'underline',
  TASK_LIST: 'task-list'
})

export const MARKDOWN_SHORTCUT_HINT_GROUPS = Object.freeze([
  {
    labelKey: 'status.markdownBlockFormatting',
    items: [
      { labelKey: 'status.markdownHeadings', shortcut: 'Alt+1-6' },
      { labelKey: 'status.markdownParagraph', shortcut: 'Alt+0' },
      { labelKey: 'status.markdownHeadingLevel', shortcut: 'Ctrl+= / Ctrl+-' },
      { labelKey: 'status.markdownFormulaBlock', shortcut: 'Ctrl+Shift+M' },
      { labelKey: 'status.markdownCodeBlock', shortcut: 'Ctrl+Shift+K' },
      { labelKey: 'status.markdownBlockquote', shortcut: 'Ctrl+Shift+Q' },
      { labelKey: 'status.markdownOrderedList', shortcut: 'Ctrl+Shift+[' },
      { labelKey: 'status.markdownBulletList', shortcut: 'Ctrl+Shift+]' },
      { labelKey: 'status.markdownTaskList', shortcut: 'Ctrl+Shift+X' },
      { labelKey: 'status.markdownListIndent', shortcut: 'Tab / Shift+Tab' }
    ]
  },
  {
    labelKey: 'status.markdownInlineFormatting',
    items: [
      { labelKey: 'status.markdownBold', shortcut: 'Ctrl+B' },
      { labelKey: 'status.markdownItalic', shortcut: 'Ctrl+I' },
      { labelKey: 'status.markdownUnderline', shortcut: 'Ctrl+U' },
      { labelKey: 'status.markdownInlineCode', shortcut: 'Ctrl+Shift+`' },
      { labelKey: 'status.markdownStrikethrough', shortcut: 'Alt+Shift+5' },
      { labelKey: 'status.markdownLink', shortcut: 'Ctrl+K' },
      { labelKey: 'status.markdownClearFormatting', shortcut: 'Ctrl+\\' }
    ]
  }
])

function hasPrimaryModifier (event) {
  return (event.ctrlKey || event.metaKey) && !event.altKey
}

export function getMarkdownShortcutAction (event) {
  if (isKeyboardEventComposing(event)) return null

  if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
    const match = /^Digit([0-6])$/.exec(event.code || '')
    if (match) {
      const level = Number(match[1])
      return level === 0 ? MARKDOWN_SHORTCUT_ACTIONS.PARAGRAPH : `heading-${level}`
    }
  }

  if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey && event.code === 'Digit5') {
    return MARKDOWN_SHORTCUT_ACTIONS.STRIKETHROUGH
  }

  if (!hasPrimaryModifier(event)) return null

  const key = String(event.key || '').toLowerCase()

  if (!event.shiftKey) {
    if (event.code === 'Equal' || key === '=' || key === 'add') return MARKDOWN_SHORTCUT_ACTIONS.INCREASE_HEADING
    if (event.code === 'Minus' || key === '-' || key === 'subtract') return MARKDOWN_SHORTCUT_ACTIONS.DECREASE_HEADING
    if (event.code === 'Backslash' || key === '\\') return MARKDOWN_SHORTCUT_ACTIONS.CLEAR_FORMATTING
    if (key === 'b') return MARKDOWN_SHORTCUT_ACTIONS.BOLD
    if (key === 'i') return MARKDOWN_SHORTCUT_ACTIONS.ITALIC
    if (key === 'u') return MARKDOWN_SHORTCUT_ACTIONS.UNDERLINE
    if (key === 'k') return MARKDOWN_SHORTCUT_ACTIONS.LINK
    return null
  }

  if (event.code === 'BracketLeft') return MARKDOWN_SHORTCUT_ACTIONS.ORDERED_LIST
  if (event.code === 'BracketRight') return MARKDOWN_SHORTCUT_ACTIONS.BULLET_LIST
  if (event.code === 'Backquote') return MARKDOWN_SHORTCUT_ACTIONS.INLINE_CODE
  if (key === 'm') return MARKDOWN_SHORTCUT_ACTIONS.FORMULA_BLOCK
  if (key === 'k') return MARKDOWN_SHORTCUT_ACTIONS.CODE_BLOCK
  if (key === 'q') return MARKDOWN_SHORTCUT_ACTIONS.BLOCKQUOTE
  if (key === 'x') return MARKDOWN_SHORTCUT_ACTIONS.TASK_LIST
  return null
}
