import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { tags } from '@lezer/highlight'
import { codeMirror } from '@milkdown/crepe/feature/code-mirror'
import { latex } from '@milkdown/crepe/feature/latex'
import { linkTooltip } from '@milkdown/crepe/feature/link-tooltip'
import { listItem } from '@milkdown/crepe/feature/list-item'
import '@milkdown/crepe/theme/common/code-mirror.css'
import '@milkdown/crepe/theme/common/latex.css'
import '@milkdown/crepe/theme/common/link-tooltip.css'
import '@milkdown/crepe/theme/common/list-item.css'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import { Editor, commandsCtx, defaultValueCtx, editorViewCtx, editorViewOptionsCtx, remarkStringifyOptionsCtx, rootCtx, serializerCtx } from '@milkdown/kit/core'
import { createSlice } from '@milkdown/kit/ctx'
import { gfm } from '@milkdown/kit/preset/gfm'
import {
  commonmark,
  createCodeBlockCommand,
  emphasisSchema,
  inlineCodeSchema,
  linkSchema,
  listItemSchema,
  remarkLineBreak,
  remarkPreserveEmptyLinePlugin,
  strongSchema,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand
} from '@milkdown/kit/preset/commonmark'
import { strikethroughSchema, toggleStrikethroughCommand } from '@milkdown/kit/preset/gfm'
import { toggleLinkCommand } from '@milkdown/kit/component/link-tooltip'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { lift, setBlockType, toggleMark } from '@milkdown/kit/prose/commands'
import { Fragment } from '@milkdown/kit/prose/model'
import { liftListItem, sinkListItem, wrapInList } from '@milkdown/kit/prose/schema-list'
import { Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state'
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view'
import { $markSchema, $nodeSchema, $prose, $remark, callCommand, replaceAll } from '@milkdown/kit/utils'
import { EDITOR_FONT_SIZE, EDITOR_GUTTER_WIDTH } from '../constants'
import { t } from '../locales'
import { normalizeMarkdownEditorChange, normalizeMarkdownLineBreakAst, preserveMarkdownSourceBlankLines } from '../markdownDocument'
import {
  getMarkdownShortcutAction,
  MARKDOWN_SHORTCUT_ACTIONS
} from '../markdownShortcuts'
import { getEditingShortcutAction } from '../shortcut'

const crepeFeaturesCtx = createSlice([], 'FeaturesCtx')
const COPY_FEEDBACK_DURATION = 1200
const UNDERLINE_OPEN_TAG = /^<\s*(?:u|ins)(?:\s[^>]*)?>$/i
const UNDERLINE_CLOSE_TAG = /^<\s*\/\s*(?:u|ins)\s*>$/i
const HIDDEN_LIST_ITEM_MARKER = '\u200D\u2060\u200D'
let markdownUndoOperationSequence = 0

const SYNTAX_DELIMITER_NODE = 'markdownSyntaxDelimiter'
const SYNTAX_MARK_NAMES = ['strong', 'emphasis', 'underline', 'inlineCode', 'strike_through', 'link']
const syntaxFormatPluginKey = new PluginKey('markdownSyntaxFormat')
const SYNTAX_SOURCE_DELIMITERS = Object.freeze({
  strong: ['**', '**'],
  emphasis: ['*', '*'],
  underline: ['<u>', '</u>'],
  inlineCode: ['`', '`'],
  strike_through: ['~~', '~~']
})
// 编辑器的 Milkdown 默认换行插件会把段落中的源码 LF 转成浏览器里的行内空格。
// 编辑器使用 `pre-wrap` 展示文本，因此源码换行必须继续保留为换行，
// 才能与纯文本模式的视觉结果一致。
const cleanCommonmark = commonmark.filter(plugin => (
  !remarkPreserveEmptyLinePlugin.includes(plugin) &&
  !remarkLineBreak.includes(plugin)
))

function getArrowDirection (event) {
  if (event?.key === 'ArrowLeft' || event?.key === 'Left' || event?.keyCode === 37) return -1
  if (event?.key === 'ArrowRight' || event?.key === 'Right' || event?.keyCode === 39) return 1
  return 0
}

const remarkCleanLineBreakPlugin = $remark('remarkCleanLineBreak', () => () => normalizeMarkdownLineBreakAst)
const remarkPreserveSourceBlankLinesPlugin = $remark('remarkPreserveSourceBlankLines', () => () => (tree, file) => (
  preserveMarkdownSourceBlankLines(tree, file?.value)
))

const syntaxDelimiterSchema = $nodeSchema(SYNTAX_DELIMITER_NODE, () => ({
  inline: true,
  group: 'inline',
  atom: true,
  selectable: false,
  attrs: {
    value: { default: '', validate: 'string' },
    markName: { default: '', validate: 'string' }
  },
  parseDOM: [{
    tag: 'span[data-markdown-syntax-delimiter]',
    getAttrs: dom => ({
      value: dom.getAttribute('data-markdown-syntax-delimiter') || '',
      markName: dom.getAttribute('data-markdown-syntax-mark') || ''
    })
  }],
  toDOM: node => ['span', {
    class: 'markdown-syntax-delimiter',
    'data-markdown-syntax-delimiter': node.attrs.value,
    'data-markdown-syntax-mark': node.attrs.markName,
    'aria-hidden': 'true'
  }, node.attrs.value],
  leafText: () => '',
  parseMarkdown: {
    match: () => false,
    runner: () => {}
  },
  toMarkdown: {
    match: node => node.type.name === SYNTAX_DELIMITER_NODE,
    // 分隔符只是编辑器内部使用的原子节点，导出 Markdown 时不要生成空的 mdast 文本节点。
    runner: () => {}
  }
}))

function getSyntaxPairAtCursor (state) {
  if (!(state?.selection instanceof TextSelection) || !state.selection.empty) return null
  const cursor = state.selection.$cursor
  const delimiterType = state.schema.nodes[SYNTAX_DELIMITER_NODE]
  if (!cursor || !delimiterType) return null
  const parent = cursor.parent
  const cursorOffset = cursor.parentOffset
  const parentStart = cursor.start()
  let offset = 0
  let opening = null
  for (let index = 0; index < parent.childCount; index += 1) {
    const node = parent.child(index)
    const end = offset + node.nodeSize
    if (node.type === delimiterType && end <= cursorOffset) {
      opening = {
        index,
        offset,
        markName: String(node.attrs.markName || '')
      }
    } else if (node.type === delimiterType && offset >= cursorOffset) {
      if (opening?.markName && String(node.attrs.markName || '') === opening.markName) {
        return {
          openIndex: opening.index,
          closeIndex: index,
          openPos: parentStart + opening.offset,
          closePos: parentStart + offset,
          markName: opening.markName
        }
      }
      break
    }
    offset = end
  }
  return null
}

function getSyntaxSourceDelimiters (mark) {
  if (!mark || !SYNTAX_MARK_NAMES.includes(mark.type.name)) return null
  if (mark.type.name === 'link') {
    const href = String(mark.attrs?.href || '')
    return ['[', `](${href})`]
  }
  return SYNTAX_SOURCE_DELIMITERS[mark.type.name] || null
}

function getSyntaxMarkRangesAtCursor (state) {
  if (!(state?.selection instanceof TextSelection) || !state.selection.empty) return []
  const cursor = state.selection.$cursor
  if (!cursor) return []

  const parent = cursor.parent
  const parentStart = cursor.start()
  const cursorPos = cursor.pos
  const entries = []
  let offset = 0
  for (let index = 0; index < parent.childCount; index += 1) {
    const node = parent.child(index)
    entries.push({
      node,
      index,
      offset,
      from: parentStart + offset,
      to: parentStart + offset + node.nodeSize
    })
    offset += node.nodeSize
  }

  const candidates = []
  const addCandidate = mark => {
    if (!mark || !SYNTAX_MARK_NAMES.includes(mark.type.name)) return
    if (!candidates.some(candidate => candidate.eq(mark))) candidates.push(mark)
  }
  // `cursor.index()` points at different sides of a text node depending on
  // whether the cursor is inside the node or exactly at its boundary. Use the
  // resolved document position as the source of truth instead, so the source
  // delimiters remain stable at both ends of a marked range.
  cursor.marks().forEach(addCandidate)
  entries.forEach(entry => {
    if (cursorPos < entry.from || cursorPos > entry.to) return
    entry.node.marks?.forEach(addCandidate)
  })

  const ranges = []
  candidates.forEach(mark => {
    const matches = entry => Boolean(entry?.node?.marks?.some(candidate => candidate.eq(mark)))
    const anchor = entries.findIndex(entry => (
      cursorPos >= entry.from && cursorPos <= entry.to && matches(entry)
    ))
    if (anchor < 0) return

    let startIndex = anchor
    while (startIndex > 0 && matches(entries[startIndex - 1])) startIndex -= 1
    let endIndex = anchor + 1
    while (endIndex < entries.length && matches(entries[endIndex])) endIndex += 1
    const from = entries[startIndex].from
    const to = entries[endIndex - 1].to
    if (cursorPos < from || cursorPos > to) return
    // `finishSyntaxFormatSession` explicitly stores an empty mark set when
    // the caret exits a syntax range. At either edge, that state is the
    // editor's authoritative signal that the caret is outside the mark,
    // even though ProseMirror still reports the adjacent node's marks.
    if (Array.isArray(state.storedMarks) && state.storedMarks.length === 0 && (cursorPos === from || cursorPos === to)) return
    const delimiters = getSyntaxSourceDelimiters(mark)
    if (!delimiters) return
    ranges.push({ from, to, mark, markName: mark.type.name, delimiters })
  })
  return ranges
}

function getSyntaxBoundaryDirection (state, direction) {
  if (!(state?.selection instanceof TextSelection) || !state.selection.empty) return 0
  if (direction !== -1 && direction !== 1) return 0
  const cursor = state.selection.$cursor
  if (!cursor) return 0
  // Do not re-enter a syntax range after an explicit keyboard exit. The
  // surrounding nodes retain their marks at the boundary, so checking them
  // alone would immediately trap the caret again.
  if (Array.isArray(state.storedMarks) && state.storedMarks.length === 0) return 0
  const beforeMarks = cursor.nodeBefore?.marks || []
  const afterMarks = cursor.nodeAfter?.marks || []
  const hasMark = (marks, mark) => marks.some(candidate => candidate.eq(mark))

  if (direction > 0) {
    return beforeMarks.some(mark => (
      SYNTAX_MARK_NAMES.includes(mark.type.name) && !hasMark(afterMarks, mark)
    )) ? 1 : 0
  }
  return afterMarks.some(mark => (
    SYNTAX_MARK_NAMES.includes(mark.type.name) && !hasMark(beforeMarks, mark)
  )) ? -1 : 0
}

function getSyntaxSessionPair (state, session) {
  if (!session?.active) return null
  const delimiterType = state?.schema?.nodes?.[SYNTAX_DELIMITER_NODE]
  const openPos = Number(session.openPos)
  const closePos = Number(session.closePos)
  if (!delimiterType || !Number.isInteger(openPos) || !Number.isInteger(closePos) || closePos <= openPos) return null

  const open = state.doc.nodeAt(openPos)
  const close = state.doc.nodeAt(closePos)
  if (!open || !close || open.type !== delimiterType || close.type !== delimiterType || closePos < openPos + open.nodeSize) return null
  const markName = String(session.markName || '')
  if (!markName || String(open.attrs.markName || '') !== markName || String(close.attrs.markName || '') !== markName) return null
  return { openPos, closePos, open, close, markName }
}

function removeSyntaxDelimiterPair (transaction, pair) {
  if (!transaction || !pair) return transaction
  const closePos = transaction.mapping.map(pair.closePos, 1)
  const close = transaction.doc.nodeAt(closePos)
  let next = close
    ? transaction.delete(closePos, closePos + close.nodeSize)
    : transaction
  const openPos = next.mapping.map(pair.openPos, -1)
  const open = next.doc.nodeAt(openPos)
  if (open) next = next.delete(openPos, openPos + open.nodeSize)
  return next
}

function removeSyntaxSessionNodes (transaction, session) {
  if (!transaction || !session?.active) return transaction
  const delimiterType = transaction.doc.type.schema.nodes[SYNTAX_DELIMITER_NODE]
  const markName = String(session.markName || '')
  if (!delimiterType || !markName) return transaction

  // 原生 Backspace/Delete 删除一个原子时，ProseMirror 可能把会话两端都映射到同一边界。
  // 因此要检查每个映射位置的两侧，只从右向左删除确实匹配的分隔符原子。
  const positions = [...new Set([Number(session.openPos), Number(session.closePos)])]
    .filter(position => Number.isInteger(position) && position >= 0)
    .sort((left, right) => right - left)
  const removed = new Set()
  let next = transaction
  positions.forEach(position => {
    const candidates = [position, position - 1]
    for (const candidate of candidates) {
      if (candidate < 0 || removed.has(candidate)) continue
      const node = next.doc.nodeAt(candidate)
      if (node?.type !== delimiterType || String(node.attrs.markName || '') !== markName) continue
      next = next.delete(candidate, candidate + node.nodeSize)
      removed.add(candidate)
      break
    }
  })
  return next
}

function insertSyntaxText (view, text) {
  if (!view || view.composing) return false
  const session = syntaxFormatPluginKey.getState(view.state)
  if (!session?.active || typeof text !== 'string') return false
  if (!text) return false
  const pair = getSyntaxSessionPair(view.state, session)
  if (!pair) {
    finishSyntaxFormatSession(view, session)
    return false
  }
  const { from, to } = view.state.selection
  const browserPlacedCaretAfterClose = view.state.selection.empty && from === pair.closePos + 1
  if (from <= pair.openPos || (from > pair.closePos && !browserPlacedCaretAfterClose) || to > pair.closePos + (browserPlacedCaretAfterClose ? 1 : 0)) return false
  const insertionFrom = browserPlacedCaretAfterClose ? pair.closePos : from
  const insertionTo = browserPlacedCaretAfterClose ? pair.closePos : to
  const markType = view.state.schema.marks[session.markName]
  if (!markType) return false
  const exitIndex = text.search(/[\t\r\n]/)
  const formattedLength = exitIndex < 0 ? text.length : exitIndex
  const exitsSyntax = exitIndex >= 0
  let transaction = view.state.tr.insertText(text, insertionFrom, insertionTo)
  const mark = markType.create(session.markAttrs || undefined)
  if (formattedLength > 0) transaction = transaction.addMark(insertionFrom, insertionFrom + formattedLength, mark)
  if (exitsSyntax && formattedLength < text.length) {
    transaction = transaction.removeMark(insertionFrom + formattedLength, insertionFrom + text.length, markType)
  }
  if (exitsSyntax) transaction = removeSyntaxDelimiterPair(transaction, pair)
  // Delimiter removal adds steps and resets stored marks, so set them only
  // after every document and selection change has finished.
  transaction = transaction
    .setStoredMarks(exitsSyntax ? [] : [mark])
    .setMeta(syntaxFormatPluginKey, exitsSyntax
      ? EMPTY_SYNTAX_SESSION
      : {
          ...session,
          closePos: transaction.mapping.map(pair.closePos, 1)
        })
  view.dispatch(transaction.scrollIntoView())
  return true
}

function insertPlainTextAfterSyntaxExit (view, text, event = null) {
  // IME composition text must stay under ProseMirror's native composition
  // handling. Intercepting the provisional pinyin text inserts its first
  // letter before the IME commits the composed character.
  if (
    !view ||
    view.composing ||
    event?.isComposing ||
    event?.inputType === 'insertCompositionText' ||
    typeof text !== 'string' ||
    !text
  ) return false
  const session = syntaxFormatPluginKey.getState(view.state)
  const sourceExit = session?.sourceExit
  const selection = view.state.selection
  if (!sourceExit || !selection.empty || selection.from !== sourceExit.pos) return false

  // At a mark boundary ProseMirror may infer marks from nodeBefore when
  // storedMarks is null. An explicit empty stored-mark set is required here;
  // otherwise the first character typed after ArrowRight/ArrowLeft is merged
  // back into the preceding syntax mark.
  const transaction = view.state.tr
    .insertText(text, selection.from, selection.to)
    // `insertText` resets stored marks internally, so this must be applied
    // after the document change to keep the first post-exit character plain.
    .setStoredMarks([])
    .setMeta(syntaxFormatPluginKey, EMPTY_SYNTAX_SESSION)
  view.dispatch(transaction.scrollIntoView())
  return true
}

const EMPTY_SYNTAX_SESSION = Object.freeze({
  active: false,
  markName: '',
  markAttrs: null,
  openPos: -1,
  closePos: -1,
  sourceExit: null
})

function getSyntaxSessionExitDirection (view, session, direction) {
  if (!view || (direction !== -1 && direction !== 1)) return 0
  const selection = view.state.selection
  if (!selection.empty) return 0
  const pair = (session?.active && getSyntaxSessionPair(view.state, session)) || getSyntaxPairAtCursor(view.state)
  if (!pair) {
    const boundaryDirection = getSyntaxBoundaryDirection(view.state, direction)
    if (boundaryDirection === direction) return direction
    const ranges = getSyntaxMarkRangesAtCursor(view.state)
    if (direction < 0 && ranges.some(range => selection.from === range.from)) return -1
    if (direction > 0 && ranges.some(range => selection.from === range.to)) return 1
    return 0
  }

  // 原子分隔符没有可放置光标的内容，浏览器可能把光标报告在原子前后任一侧。
  // 通过相邻节点和位置双重判断，覆盖这两种 DOM 光标归一化结果。
  const resolved = view.state.doc.resolve(selection.from)
  const nodeBefore = resolved.nodeBefore
  const nodeAfter = resolved.nodeAfter
  const isDelimiterAt = (node, position, delimiter, delimiterPosition) => node && position === delimiterPosition && (
    node?.type === delimiter.type &&
    String(node.attrs.markName || '') === String(delimiter.attrs.markName || '') &&
    String(node.attrs.value || '') === String(delimiter.attrs.value || '')
  )
  const nodeBeforePosition = selection.from - (nodeBefore?.nodeSize || 0)
  const contentStart = pair.openPos + pair.open.nodeSize
  const contentEnd = pair.closePos
  const atOpeningBoundary = (
    selection.from >= pair.openPos && selection.from <= contentStart ||
    isDelimiterAt(nodeBefore, nodeBeforePosition, pair.open, pair.openPos) ||
    isDelimiterAt(nodeAfter, selection.from, pair.open, pair.openPos)
  )
  const atClosingBoundary = (
    selection.from >= contentEnd && selection.from <= pair.closePos + pair.close.nodeSize ||
    isDelimiterAt(nodeBefore, nodeBeforePosition, pair.close, pair.closePos) ||
    isDelimiterAt(nodeAfter, selection.from, pair.close, pair.closePos)
  )
  if (direction < 0 && atOpeningBoundary) return -1
  if (direction > 0 && atClosingBoundary) return 1
  return 0
}

function handleSyntaxArrowKey (view, event) {
  if (!view || !event || event.isComposing || event.keyCode === 229 || event.which === 229) return false
  const direction = getArrowDirection(event)
  if (direction === 0) return false
  const session = syntaxFormatPluginKey.getState(view.state)
  const syntaxPair = getSyntaxPairAtCursor(view.state)
  const syntaxRanges = getSyntaxMarkRangesAtCursor(view.state)
  const syntaxBoundaryDirection = getSyntaxBoundaryDirection(view.state, direction)
  // Once an arrow key has just exited a mark, allow the browser's next arrow
  // press to continue moving through the surrounding text instead of trapping
  // the caret on the same boundary position.
  if (session?.sourceExit && session.sourceExit.pos === view.state.selection.from && session.sourceExit.direction === direction) {
    return false
  }
  const cursorMarks = view.state.storedMarks || view.state.selection.$cursor?.marks() || []
  const hasSyntaxStoredMark = cursorMarks.some(mark => SYNTAX_MARK_NAMES.includes(mark.type.name))
  if (!session?.active && !syntaxPair && !hasSyntaxStoredMark && syntaxRanges.length === 0 && syntaxBoundaryDirection === 0) return false
  const exitDirection = getSyntaxSessionExitDirection(view, session, direction)
  if (exitDirection === 0) return false
  event.preventDefault()
  event.stopPropagation()
  // React's capture handler and ProseMirror's native handler can both see the
  // same key event. Stop the native event as well so the second handler cannot
  // normalize the selection back to the mark boundary.
  event.nativeEvent?.stopImmediatePropagation?.()
  finishSyntaxFormatSession(view, session, exitDirection)
  return true
}

function deleteSyntaxTextBackward (view, session, pair) {
  if (!view || !session?.active || !pair) return false
  const nodeBefore = view.state.doc.resolve(pair.closePos).nodeBefore
  const delimiterType = view.state.schema.nodes[SYNTAX_DELIMITER_NODE]
  if (!nodeBefore || nodeBefore.type === delimiterType) {
    finishSyntaxFormatSession(view, session)
    return true
  }

  const from = pair.closePos - (nodeBefore.isText ? 1 : nodeBefore.nodeSize)
  let transaction = view.state.tr.delete(from, pair.closePos)
  transaction = transaction.setMeta(syntaxFormatPluginKey, {
    ...session,
    closePos: transaction.mapping.map(pair.closePos, 1)
  })
  view.dispatch(transaction.scrollIntoView())
  return true
}

function finishSyntaxFormatSession (view, session, exitDirection = 0) {
  if (!view) return false
  const pair = (session?.active && getSyntaxSessionPair(view.state, session)) || getSyntaxPairAtCursor(view.state)
  const sourceRange = pair
    ? { from: pair.openPos + pair.open.nodeSize, to: pair.closePos, markName: pair.markName }
    : getSyntaxMarkRangesAtCursor(view.state).find(range => (
        (exitDirection < 0 && view.state.selection.from === range.from) ||
        (exitDirection > 0 && view.state.selection.from === range.to)
      ))
  let transaction = view.state.tr.setStoredMarks([])
  let mappedBoundary = null
  if (pair) {
    const boundary = exitDirection > 0
      ? pair.closePos + pair.close.nodeSize
      : pair.openPos
    transaction = removeSyntaxDelimiterPair(transaction, pair)
    if (exitDirection !== 0) {
      const requestedBoundary = transaction.mapping.map(boundary, exitDirection > 0 ? 1 : -1)
      transaction = transaction.setSelection(TextSelection.create(
        transaction.doc,
        clampDocumentPosition(transaction.doc, requestedBoundary)
      ))
      mappedBoundary = transaction.selection.from
    }
  } else if (exitDirection !== 0 && sourceRange) {
    const requestedBoundary = transaction.mapping.map(
      exitDirection > 0 ? sourceRange.to : sourceRange.from,
      exitDirection > 0 ? 1 : -1
    )
    // Pseudo-elements do not occupy document positions. The mark boundary
    // itself is therefore the outside caret position in both directions.
    mappedBoundary = clampDocumentPosition(transaction.doc, requestedBoundary)
    transaction = transaction.setSelection(TextSelection.create(
      transaction.doc,
      mappedBoundary
    ))
  } else {
    transaction = removeSyntaxSessionNodes(transaction, session)
  }
  const sourceExit = exitDirection !== 0 && sourceRange && mappedBoundary !== null
    ? { pos: mappedBoundary, direction: exitDirection, markName: sourceRange.markName }
    : null
  const sessionMeta = sourceExit ? { ...EMPTY_SYNTAX_SESSION, sourceExit } : EMPTY_SYNTAX_SESSION
  // Selection and delimiter-removal steps also clear stored marks. Apply the
  // explicit empty set last so the caret remains outside the syntax mark.
  transaction = transaction.setStoredMarks([])
  view.dispatch(transaction
    .setMeta(syntaxFormatPluginKey, sessionMeta)
    .setMeta('addToHistory', false))
  return true
}

const syntaxFormatDecorations = $prose(() => {
  return new Plugin({
  key: syntaxFormatPluginKey,
  state: {
    init: () => ({ active: false, markName: '', markAttrs: null, openPos: -1, closePos: -1, sourceExit: null }),
    apply: (transaction, previous) => {
      const next = transaction.getMeta(syntaxFormatPluginKey)
      if (next) return next
      if (previous?.sourceExit && (
        transaction.docChanged ||
        transaction.getMeta('pointer') ||
        (transaction.selectionSet && transaction.selection.from !== previous.sourceExit.pos)
      )) {
        return { ...previous, sourceExit: null }
      }
      if (!previous?.active || previous.openPos < 0 || previous.closePos < 0) return previous
      return {
        ...previous,
        openPos: transaction.mapping.map(previous.openPos, -1),
        closePos: transaction.mapping.map(previous.closePos, 1),
        sourceExit: null
      }
    },
  },
  appendTransaction: (transactions, _oldState, newState) => {
    const session = syntaxFormatPluginKey.getState(newState)
    if (!session?.active || session.openPos < 0 || session.closePos < 0) return null
    const pair = getSyntaxSessionPair(newState, session)
    if (!pair) {
      return removeSyntaxSessionNodes(newState.tr, session)
        .setMeta(syntaxFormatPluginKey, EMPTY_SYNTAX_SESSION)
        .setMeta('addToHistory', false)
    }
    const changedWithoutOpeningSession = transactions.some(transaction => (
      transaction.docChanged && !transaction.getMeta(syntaxFormatPluginKey)?.active
    ))
    if (changedWithoutOpeningSession && pair.closePos === pair.openPos + pair.open.nodeSize) {
      return removeSyntaxDelimiterPair(newState.tr, pair)
        .setStoredMarks([])
        .setMeta(syntaxFormatPluginKey, EMPTY_SYNTAX_SESSION)
        .setMeta('addToHistory', false)
    }
  // 删除完整的格式化内容后，会话仍可能处于活动状态，并留下相邻的两个编辑器原子。
  // 这里立即移除这对空原子，否则下一个字符会经过过期的分隔符，插入到周围文本中间。
    const selection = newState.selection
    const pointerSelection = transactions.some(transaction => transaction.getMeta('pointer'))
  // 浏览器 Chromium 无法把 DOM 光标放在隐藏的 contenteditable=false 原子之前，
  // 会将其规范化到结束分隔符之后。对于这种仅由选择范围引起的规范化要保持会话，
  // 插入函数 insertSyntaxText 会在插入下一个字符时把位置映射回分隔符之前；用户明确用指针选区时仍退出会话。
    if (selection.empty && selection.from === pair.closePos + 1 && !pointerSelection) {
      return null
    }
    const selectionInsidePair = selection.from > pair.openPos && selection.to <= pair.closePos
    if (!selectionInsidePair) {
      let cleanup = removeSyntaxDelimiterPair(newState.tr, pair)
      cleanup = cleanup.setStoredMarks([])
      return cleanup
        .setMeta(syntaxFormatPluginKey, EMPTY_SYNTAX_SESSION)
        .setMeta('addToHistory', false)
    }
    const markType = newState.schema.marks[session.markName]
    if (!markType) return null
    const ranges = []
    newState.doc.nodesBetween(pair.openPos + pair.open.nodeSize, pair.closePos, (node, position) => {
      if (!node.isText || markType.isInSet(node.marks)) return
      const from = Math.max(pair.openPos + pair.open.nodeSize, position)
      const to = Math.min(pair.closePos, position + node.nodeSize)
      if (from < to) ranges.push({ from, to })
    })
    if (ranges.length === 0) return null
    let transaction = newState.tr
    const mark = markType.create(session.markAttrs || undefined)
    ranges.forEach(({ from, to }) => {
      transaction = transaction.addMark(from, to, mark)
    })
    return transaction.setMeta('addToHistory', false)
  },
  props: {
    decorations: state => {
      const session = syntaxFormatPluginKey.getState(state)
      if (!(state.selection instanceof TextSelection) || !state.selection.empty) return null
      const cursor = state.selection.$cursor
      if (!cursor) return null
      const delimiterType = state.schema.nodes[SYNTAX_DELIMITER_NODE]

      const sessionOpen = session?.active ? Number(session.openPos) : -1
      const sessionClose = session?.active ? Number(session.closePos) : -1
      const positions = []
      if (sessionOpen >= 0 && sessionClose > sessionOpen && state.selection.from > sessionOpen && state.selection.from <= sessionClose) {
        const open = state.doc.nodeAt(sessionOpen)
        const close = state.doc.nodeAt(sessionClose)
        if (delimiterType && open?.type === delimiterType && close?.type === delimiterType) {
          positions.push(Decoration.node(sessionOpen, sessionOpen + open.nodeSize, { class: 'markdown-syntax-delimiter-active' }))
          positions.push(Decoration.node(sessionClose, sessionClose + close.nodeSize, { class: 'markdown-syntax-delimiter-active' }))
        }
      }
      if (positions.length > 0) return DecorationSet.create(state.doc, positions)

      const sourceExit = session?.sourceExit
      if (sourceExit && sourceExit.pos === state.selection.from && sourceExit.direction !== 0) return null
      getSyntaxMarkRangesAtCursor(state).forEach(range => {
        const isExitedAtBoundary = sourceExit &&
          sourceExit.pos === state.selection.from &&
          sourceExit.direction !== 0
        if (isExitedAtBoundary) return
        const [opening, closing] = range.delimiters
        // Use pseudo-elements on the marked range instead of widget nodes.
        // Widgets create extra DOM caret boundaries; Chromium can normalize a
        // caret at the mark end back inside that widget. Inline decorations are
        // visual only, so native ProseMirror arrow navigation remains intact.
        positions.push(Decoration.inline(
          range.from,
          range.to,
          {
            class: 'markdown-syntax-source-range',
            'data-markdown-syntax-open': opening,
            'data-markdown-syntax-close': closing
          },
          {
            inclusiveStart: false,
            inclusiveEnd: false,
            key: `syntax-source-range-${range.markName}-${range.from}-${range.to}`
          }
        ))
      })
      return positions.length > 0 ? DecorationSet.create(state.doc, positions) : null
    },
    handleKeyDown: (view, event) => {
      if (event.isComposing || event.keyCode === 229 || event.which === 229) return false
      const session = syntaxFormatPluginKey.getState(view.state)
      const syntaxPair = getSyntaxPairAtCursor(view.state)
      const cursorMarks = view.state.storedMarks || view.state.selection.$cursor?.marks() || []
      const hasSyntaxStoredMark = cursorMarks.some(mark => SYNTAX_MARK_NAMES.includes(mark.type.name))
      if (!session?.active && !syntaxPair && !hasSyntaxStoredMark) return false

      const isUnmodifiedEnter = event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.altKey
      const isNavigation = getArrowDirection(event) !== 0 || event.key === 'Tab'
      const isBoundaryDelete = session?.active && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key === 'Backspace' || event.key === 'Delete')
      if (isBoundaryDelete) {
        const pair = getSyntaxSessionPair(view.state, session)
        const cursor = view.state.selection
        const atOpeningBoundary = cursor.empty && event.key === 'Backspace' && pair && cursor.from === pair.openPos + pair.open.nodeSize
        const atClosingBoundary = cursor.empty && event.key === 'Delete' && pair && cursor.from === pair.closePos
        const browserCaretAfterClose = cursor.empty && event.key === 'Backspace' && pair && cursor.from === pair.closePos + 1
        if (browserCaretAfterClose) return deleteSyntaxTextBackward(view, session, pair)
        if (atOpeningBoundary || atClosingBoundary || !pair) {
          finishSyntaxFormatSession(view, session)
          return true
        }
      }
      if (session?.active || syntaxPair) {
        if (handleSyntaxArrowKey(view, event)) return true
      }
      if (!isUnmodifiedEnter && !isNavigation) return false
      finishSyntaxFormatSession(view, session)
      return false
    },
    handleTextInput: (view, from, to, text) => {
      if (view.state.selection.from !== from || view.state.selection.to !== to) return false
      if (view.composing) return false
      if (insertPlainTextAfterSyntaxExit(view, text)) return true
      return insertSyntaxText(view, text)
    },
    handlePaste: (view, event) => {
      if (view.composing) return false
      const session = syntaxFormatPluginKey.getState(view.state)
      const clipboard = event.clipboardData
      const text = clipboard?.getData('text/plain') || clipboard?.getData('Text')
      const exited = insertPlainTextAfterSyntaxExit(view, text)
      if (exited) {
        event.preventDefault()
        return true
      }
      if (!session?.active) return false
      if (typeof text !== 'string') return false
      const handled = insertSyntaxText(view, text)
      if (handled) event.preventDefault()
      return handled
    },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (handleSyntaxArrowKey(view, event)) return true
          if (event.isComposing || event.keyCode === 229 || event.which === 229) return false
          const session = syntaxFormatPluginKey.getState(view.state)
          if (getArrowDirection(event) === 0 && event.key !== 'Tab') return false
          finishSyntaxFormatSession(view, session)
          return false
      },
      beforeinput: (view, event) => {
        if (view.composing || event.isComposing || event.inputType === 'insertCompositionText') return false
        const session = syntaxFormatPluginKey.getState(view.state)
        if (session?.sourceExit && event.inputType?.startsWith('insert') && typeof event.data === 'string') {
          const handled = insertPlainTextAfterSyntaxExit(view, event.data, event)
          if (handled) event.preventDefault()
          return handled
        }
        if (!session?.active) return false
        if (event.inputType === 'deleteContentBackward') {
          const pair = getSyntaxSessionPair(view.state, session)
          const cursor = view.state.selection
          if (pair && cursor.empty && cursor.from === pair.closePos + 1) {
            const handled = deleteSyntaxTextBackward(view, session, pair)
            if (handled) event.preventDefault()
            return handled
          }
          return false
        }
        if (!String(event.inputType || '').startsWith('insert') || typeof event.data !== 'string') return false
        const handled = insertSyntaxText(view, event.data)
        if (handled) event.preventDefault()
        return handled
      },
      blur: view => {
        const session = syntaxFormatPluginKey.getState(view.state)
        if (session?.active) finishSyntaxFormatSession(view, session)
        return false
      },
      }
    }
  })
})

function isUnderlineTag (node, pattern) {
  return node?.type === 'html' && pattern.test(String(node.value || '').trim())
}

function transformUnderlineHtml (node) {
  if (!Array.isArray(node?.children)) return
  node.children.forEach(transformUnderlineHtml)

  const children = []
  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index]
    if (!isUnderlineTag(child, UNDERLINE_OPEN_TAG)) {
      children.push(child)
      continue
    }

    let depth = 1
    let closingIndex = index + 1
    for (; closingIndex < node.children.length; closingIndex += 1) {
      const candidate = node.children[closingIndex]
      if (isUnderlineTag(candidate, UNDERLINE_OPEN_TAG)) depth += 1
      if (isUnderlineTag(candidate, UNDERLINE_CLOSE_TAG)) depth -= 1
      if (depth === 0) break
    }
    if (depth !== 0) {
      children.push(child)
      continue
    }

    const underline = {
      type: 'underline',
      children: node.children.slice(index + 1, closingIndex)
    }
    transformUnderlineHtml(underline)
    children.push(underline)
    index = closingIndex
  }
  node.children = children
}

function serializeUnderline (node, _parent, state, info) {
  const exit = state.enter('underline')
  const tracker = state.createTracker(info)
  let value = tracker.move('<u>')
  value += tracker.move(state.containerPhrasing(node, {
    before: '>',
    after: '<',
    ...tracker.current()
  }))
  value += tracker.move('</u>')
  exit()
  return value
}

function serializeMarkdownRoot (node, _parent, state, info) {
  const groups = []
  let current = []
  let leadingEmpty = 0
  let pendingEmpty = 0

  for (const child of node.children || []) {
    const isEmptyParagraph = child.type === 'paragraph' && (!child.children || child.children.length === 0)
    if (isEmptyParagraph) {
      if (current.length > 0) {
        groups.push({ children: current, emptyBefore: groups.length > 0 ? pendingEmpty : 0 })
        current = []
        pendingEmpty = 1
      } else if (groups.length > 0) {
        pendingEmpty += 1
      } else {
        leadingEmpty += 1
      }
      continue
    }
    current.push(child)
  }

  if (current.length > 0) {
    groups.push({ children: current, emptyBefore: groups.length > 0 ? pendingEmpty : 0 })
  }

  if (groups.length === 0) return '\n'.repeat(leadingEmpty)

  const trailingEmpty = current.length > 0 ? 0 : pendingEmpty
  let result = '\n'.repeat(leadingEmpty)
  groups.forEach((group, index) => {
    if (index > 0) {
      // 没有显式空段落时，Markdown 需要用两个 LF 分隔块级内容；存在空段落时，
      // 每个前置 LF 结束一个段落，最后一个 LF 再负责分隔下一个块。
      result += '\n'.repeat(group.emptyBefore > 0 ? group.emptyBefore + 1 : 2)
    }
    result += state.containerFlow({ type: 'root', children: group.children }, info)
  })
  if (trailingEmpty > 0) result += '\n'.repeat(trailingEmpty)
  return result
}

const remarkUnderlinePlugin = $remark('remarkUnderline', () => () => transformUnderlineHtml)
const underlineSchema = $markSchema('underline', () => ({
  parseDOM: [
    { tag: 'u' },
    { tag: 'ins' },
    {
      style: 'text-decoration',
      getAttrs: value => String(value).split(/\s+/).includes('underline')
    }
  ],
  toDOM: () => ['u', 0],
  parseMarkdown: {
    match: node => node.type === 'underline',
    runner: (state, node, markType) => {
      state.openMark(markType)
      state.next(node.children)
      state.closeMark(markType)
    }
  },
  toMarkdown: {
    match: mark => mark.type.name === 'underline',
    runner: (state, mark) => {
      state.withMark(mark, 'underline')
    }
  }
}))

function createMarkdownCodeHighlighting () {
  return syntaxHighlighting(HighlightStyle.define([
    { tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment], color: 'var(--markdown-code-comment)', fontStyle: 'italic' },
    { tag: [tags.keyword, tags.controlKeyword, tags.operatorKeyword, tags.modifier, tags.self], color: 'var(--markdown-code-keyword)' },
    { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.escape], color: 'var(--markdown-code-string)' },
    { tag: [tags.number, tags.bool, tags.null], color: 'var(--markdown-code-number)' },
    { tag: [tags.function(tags.variableName), tags.definition(tags.propertyName), tags.labelName], color: 'var(--markdown-code-title)' },
    { tag: [tags.typeName, tags.className, tags.namespace], color: 'var(--markdown-code-type)' },
    { tag: [tags.variableName, tags.propertyName, tags.attributeName], color: 'var(--markdown-code-variable)' },
    { tag: [tags.tagName, tags.atom, tags.heading], color: 'var(--markdown-code-tag)' },
    { tag: [tags.invalid], color: 'var(--markdown-code-invalid)', textDecoration: 'underline' },
    { tag: [tags.emphasis], fontStyle: 'italic' },
    { tag: [tags.strong], fontWeight: '700' }
  ]))
}

function decorateCodeBlockControls (wrapper, labels) {
  if (!wrapper) return
  wrapper.querySelectorAll('.milkdown-code-block').forEach(block => {
    const copyButton = block.querySelector('.copy-button')
    if (copyButton) {
      copyButton.setAttribute('aria-label', labels.copy)
      copyButton.setAttribute('title', labels.copy)
      copyButton.dataset.feedback = labels.copied
    }

    const languageButton = block.querySelector('.language-button')
    if (languageButton) {
      languageButton.setAttribute('aria-label', labels.language)
      languageButton.setAttribute('title', labels.language)
    }

    const searchInput = block.querySelector('.search-input')
    if (searchInput) searchInput.setAttribute('aria-label', labels.search)
  })
}

function showCodeCopyFeedback (wrapper, labels) {
  const activeElement = wrapper?.ownerDocument?.activeElement
  if (!(activeElement instanceof HTMLElement) || !activeElement.matches('.copy-button') || !wrapper.contains(activeElement)) return
  window.clearTimeout(Number(activeElement.dataset.copyFeedbackTimer) || 0)
  activeElement.dataset.copied = 'true'
  activeElement.setAttribute('aria-label', labels.copied)
  activeElement.setAttribute('title', labels.copied)
  const timer = window.setTimeout(() => {
    activeElement.removeAttribute('data-copied')
    activeElement.setAttribute('aria-label', labels.copy)
    activeElement.setAttribute('title', labels.copy)
    delete activeElement.dataset.copyFeedbackTimer
  }, COPY_FEEDBACK_DURATION)
  activeElement.dataset.copyFeedbackTimer = String(timer)
}

function getEditorDom (wrapper) {
  return wrapper?.querySelector('[contenteditable="true"]')
}

function findDocumentTextMatches (doc, query) {
  const normalizedQuery = String(query || '').toLocaleLowerCase()
  if (!normalizedQuery) return []
  const matches = []
  doc.descendants((node, position) => {
    if (!node.isTextblock) return
    const blockText = node.textBetween(0, node.content.size, '\n', '\ufffc')
    const normalizedText = blockText.toLocaleLowerCase()
    let index = normalizedText.indexOf(normalizedQuery)
    while (index >= 0) {
      const start = position + 1 + index
      matches.push({ start, end: start + normalizedQuery.length })
      index = normalizedText.indexOf(normalizedQuery, index + normalizedQuery.length)
    }
    return false
  })
  return matches
}

function clampDocumentPosition (doc, position) {
  return Math.max(1, Math.min(Number(position) || 1, Math.max(1, doc.content.size - 1)))
}

function createSourcePositionMap (doc, source) {
  const sourceText = String(source ?? '')
  const visible = doc.textBetween(0, doc.content.size, '\n', '\ufffc')
  const offsets = new Array(visible.length + 1)
  let sourceOffset = 0
  for (let index = 0; index < visible.length; index += 1) {
    const character = visible[index]
    const candidate = character === '\n'
      ? sourceText.indexOf('\n', sourceOffset)
      : sourceText.indexOf(character, sourceOffset)
    const resolved = candidate >= 0 ? candidate : sourceOffset
    offsets[index] = resolved
    sourceOffset = Math.min(sourceText.length, resolved + 1)
  }
  // 编辑器的 ProseMirror 文档不会保留末尾空段落，因此文档末端同时代表源码末尾以及所有尾随换行。
  // 精确维护这个边界，才能让用户切换模式后按纯文本 Backspace 删除末尾空行。
  offsets[visible.length] = sourceText.length
  return { visible, offsets, sourceLength: sourceText.length }
}

function documentPositionToSourceOffset (doc, source, position) {
  const map = createSourcePositionMap(doc, source)
  const bounded = Math.max(0, Math.min(Number(position) || 0, doc.content.size))
  const visibleOffset = doc.textBetween(0, bounded, '\n', '\ufffc').length
  if (visibleOffset >= map.visible.length) return map.sourceLength
  return Math.max(0, Math.min(map.sourceLength, map.offsets[visibleOffset] ?? map.sourceLength))
}

function sourceOffsetToDocumentPosition (doc, source, sourceOffset) {
  const map = createSourcePositionMap(doc, source)
  const target = Math.max(0, Math.min(Number(sourceOffset) || 0, map.sourceLength))
  let visibleOffset = map.offsets.findIndex(offset => offset >= target)
  if (visibleOffset < 0) visibleOffset = map.visible.length

  let low = 1
  let high = Math.max(1, doc.content.size - 1)
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    const length = doc.textBetween(0, middle, '\n', '\ufffc').length
    if (length < visibleOffset) low = middle + 1
    else high = middle
  }
  return clampDocumentPosition(doc, low)
}

function stripMarkdownLineMarkers (line) {
  return String(line || '')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s*|(?:[-+*]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)/, '')
    .replace(/[*_~`]/g, '')
    .trim()
}

function collectTextBlocks (doc) {
  const blocks = []
  doc.descendants((node, position) => {
    if (node.isTextblock) blocks.push({ position: position + 1, text: node.textContent })
  })
  return blocks
}

function focusDocumentAtPoint (view, position, fallbackToStart) {
  if (!view) return
  const selection = position
    ? TextSelection.near(view.state.doc.resolve(position.pos), 1)
    : fallbackToStart
      ? TextSelection.atStart(view.state.doc)
      : TextSelection.atEnd(view.state.doc)
  view.dispatch(view.state.tr.setSelection(selection).scrollIntoView())
  view.focus()
}

function copyDocumentWithHiddenListMarkers (node) {
  if (node.isLeaf) return node

  const children = []
  node.forEach(child => children.push(copyDocumentWithHiddenListMarkers(child)))
  if (node.type.name === 'list_item' && node.attrs.hideLabel) {
    const firstBlock = children[0]
    if (firstBlock?.type.name === 'paragraph') {
      const marker = node.type.schema.text(HIDDEN_LIST_ITEM_MARKER)
      children[0] = firstBlock.copy(Fragment.from(marker).append(firstBlock.content))
    }
  }
  return node.copy(Fragment.fromArray(children))
}

function serializeMarkdownDocument (ctx, document) {
  return ctx.get(serializerCtx)(copyDocumentWithHiddenListMarkers(document))
}

function createHiddenListMarkerTransaction (state) {
  const matches = []
  state.doc.descendants((node, position) => {
    if (node.type.name !== 'list_item') return
    const firstText = node.firstChild?.firstChild
    if (firstText?.isText && firstText.text?.startsWith(HIDDEN_LIST_ITEM_MARKER)) {
      matches.push(position)
    }
  })
  if (matches.length === 0) return null

  let transaction = state.tr.setMeta('addToHistory', false)
  matches.sort((left, right) => right - left).forEach(position => {
    const mappedPosition = transaction.mapping.map(position)
    const item = transaction.doc.nodeAt(mappedPosition)
    if (!item) return
    transaction = transaction
      .setNodeMarkup(mappedPosition, item.type, {
        ...item.attrs,
        hideLabel: true
      })
      .delete(mappedPosition + 2, mappedPosition + 2 + HIDDEN_LIST_ITEM_MARKER.length)
  })
  return transaction
}

const restoreHiddenListItemMarkers = $prose(() => new Plugin({
  appendTransaction: (transactions, _oldState, state) => {
    if (!transactions.some(transaction => transaction.docChanged)) return null
    return createHiddenListMarkerTransaction(state)
  },
  view: view => {
    const frame = requestAnimationFrame(() => {
      if (view.isDestroyed) return
      const transaction = createHiddenListMarkerTransaction(view.state)
      if (transaction) view.dispatch(transaction)
    })
    return { destroy: () => cancelAnimationFrame(frame) }
  }
}))

// 该扩展替换 GFM 的列表项实现，同时保留任务列表能力，并持久化记录“首次 Backspace
// 尚未显示列表标记”的阶段，以便编辑器在后续事务中恢复一致行为。
const listItemWithHiddenMarker = listItemSchema.extendSchema(previous => ctx => {
  const baseSchema = previous(ctx)
  return {
    ...baseSchema,
    attrs: {
      ...baseSchema.attrs,
      checked: { default: null, validate: 'boolean|null' },
      hideLabel: { default: false, validate: 'boolean' }
    },
    parseDOM: [{
      tag: 'li[data-item-type="task"]',
      getAttrs: dom => ({
        label: dom.dataset.label,
        listType: dom.dataset.listType,
        spread: dom.dataset.spread === 'true',
        checked: dom.dataset.checked ? dom.dataset.checked === 'true' : null
      })
    }, ...(baseSchema.parseDOM || [])],
    toDOM: node => {
      if (baseSchema.toDOM && node.attrs.checked == null) return baseSchema.toDOM(node)
      return ['li', {
        'data-item-type': 'task',
        'data-label': node.attrs.label,
        'data-list-type': node.attrs.listType,
        'data-spread': node.attrs.spread,
        'data-checked': node.attrs.checked
      }, 0]
    },
    parseMarkdown: {
      match: ({ type }) => type === 'listItem',
      runner: (state, node, type) => {
        if (node.checked == null) {
          baseSchema.parseMarkdown.runner(state, node, type)
          return
        }
        state.openNode(type, {
          label: node.label != null ? `${node.label}.` : '\u2022',
          listType: node.label != null ? 'ordered' : 'bullet',
          spread: node.spread ?? true,
          checked: Boolean(node.checked)
        })
        state.next(node.children)
        state.closeNode()
      }
    },
    toMarkdown: {
      match: node => node.type.name === 'list_item',
      runner: (state, node) => {
        if (node.attrs.checked == null) {
          baseSchema.toMarkdown.runner(state, node)
          return
        }
        state.openNode('listItem', undefined, {
          label: node.attrs.label,
          listType: node.attrs.listType,
          spread: node.attrs.spread,
          checked: node.attrs.checked
        })
        state.next(node.content)
        state.closeNode()
      }
    }
  }
})

const hiddenListMarkerDecorations = $prose(() => new Plugin({
  props: {
    decorations: state => {
      const decorations = []
      state.doc.descendants((node, position) => {
        if (node.type.name === 'list_item' && node.attrs.hideLabel) {
          decorations.push(Decoration.node(position, position + node.nodeSize, { class: 'list-marker-hidden' }))
        }
      })
      return decorations.length > 0 ? DecorationSet.create(state.doc, decorations) : null
    }
  }
}))

function getCursorListItem (state) {
  const { selection } = state
  if (!(selection instanceof TextSelection) || !selection.empty || selection.$from.parentOffset !== 0) return null
  if (selection.$from.parent.type.name !== 'paragraph') return null

  for (let depth = selection.$from.depth - 1; depth > 0; depth -= 1) {
    const item = selection.$from.node(depth)
    if (item.type.name !== 'list_item') continue
    if (item.firstChild !== selection.$from.parent) return null
    return { depth, item, position: selection.$from.before(depth) }
  }
  return null
}

function handleListBackspace (view) {
  let cursorItem = getCursorListItem(view.state)
  if (!cursorItem) return false

  if (!cursorItem.item.attrs.hideLabel) {
    view.dispatch(view.state.tr
      .setMeta('addToHistory', false)
      .setNodeMarkup(cursorItem.position, cursorItem.item.type, {
        ...cursorItem.item.attrs,
        hideLabel: true
      })
      .scrollIntoView())
    return true
  }

  const listItemType = view.state.schema.nodes.list_item
  if (!listItemType) return false
  let lifted = false
  while ((cursorItem = getCursorListItem(view.state))) {
    const didLift = liftListItem(listItemType)(view.state, transaction => view.dispatch(transaction), view)
    if (!didLift) break
    lifted = true
  }
  return lifted
}

function collectSelectedListItems (state) {
  const listItemType = state.schema.nodes.list_item
  const positions = new Set()
  if (!listItemType) return positions

  const addAncestor = ($position) => {
    for (let depth = $position.depth; depth > 0; depth -= 1) {
      if ($position.node(depth).type === listItemType) {
        positions.add($position.before(depth))
        return
      }
    }
  }

  state.selection.ranges.forEach(({ $from, $to }) => {
    addAncestor($from)
    addAncestor($to)
    if ($from.pos === $to.pos) return
    state.doc.nodesBetween($from.pos, $to.pos, (node, position) => {
      if (node.type === listItemType) positions.add(position)
    })
  })
  return positions
}

function turnSelectionIntoTaskList (view) {
  let state = view.state
  const bulletListType = state.schema.nodes.bullet_list
  const listItemType = state.schema.nodes.list_item
  if (!bulletListType || !listItemType) return false

  let itemPositions = collectSelectedListItems(state)
  if (itemPositions.size === 0) {
    const wrapped = wrapInList(bulletListType)(state, transaction => view.dispatch(transaction), view)
    if (!wrapped) return false
    state = view.state
    itemPositions = collectSelectedListItems(state)
  }
  if (itemPositions.size === 0) return false

  const listPositions = new Set()
  itemPositions.forEach(position => {
    const $position = state.doc.resolve(position)
    for (let depth = $position.depth; depth > 0; depth -= 1) {
      const nodeName = $position.node(depth).type.name
      if (nodeName === 'bullet_list' || nodeName === 'ordered_list') {
        listPositions.add($position.before(depth))
        break
      }
    }
  })

  const transaction = state.tr
  listPositions.forEach(position => {
    const listNode = state.doc.nodeAt(position)
    if (listNode?.type !== bulletListType) {
      transaction.setNodeMarkup(position, bulletListType, {
        ...bulletListType.defaultAttrs,
        spread: Boolean(listNode?.attrs.spread)
      })
    }
  })
  itemPositions.forEach(position => {
    const itemNode = state.doc.nodeAt(position)
    if (!itemNode) return
    transaction.setNodeMarkup(position, listItemType, {
      ...itemNode.attrs,
      checked: false,
      label: listItemType.defaultAttrs?.label,
      listType: 'bullet'
    })
  })
  view.dispatch(transaction.scrollIntoView())
  return true
}

function runInlineSyntaxShortcut (editor, beforeSyntax, afterSyntax, getMarkType, attrs = null, selectedCommandKey = null, removeOtherMarks = false) {
  if (!editor) return false
  return editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    let state = view?.state
    let selection = state?.selection
    let from = selection?.from
    let to = selection?.to
    if (!view || !state || !selection || typeof from !== 'number' || typeof to !== 'number') return false

    if (from === to) {
      const markType = getMarkType(ctx)
      if (!markType || !selection.$cursor) return false
      const activeSession = syntaxFormatPluginKey.getState(state)
      const syntaxPair = getSyntaxPairAtCursor(state)
      const syntaxRanges = getSyntaxMarkRangesAtCursor(state)
      const hasMark = Boolean(
        markType.isInSet(state.storedMarks || selection.$cursor.marks()) ||
        syntaxRanges.some(range => range.mark.type === markType)
      )
      const activeMarkName = activeSession?.active
        ? activeSession.markName
        : syntaxPair?.markName || ''
      if (activeMarkName) {
        if (hasMark && activeMarkName === markType.name) {
          return finishSyntaxFormatSession(view, activeSession)
        }
        finishSyntaxFormatSession(view, activeSession)
        state = view.state
        selection = state.selection
        from = selection.from
        to = selection.to
      }

      // 已解析 Markdown 内部的光标拥有真实格式标记，但没有编辑器专用的分隔符会话。
      // 交给常规 mark 命令处理，让快捷键切换现有标记，而不是再创建一层包装。
      if (hasMark && !activeMarkName) {
        if (selectedCommandKey) return ctx.get(commandsCtx).call(selectedCommandKey)
        return toggleMark(markType, attrs)(state, transaction => view.dispatch(transaction), view)
      }

      let transaction = state.tr.setStoredMarks([])
      transaction = transaction.setStoredMarks([markType.create(attrs)])
      if (removeOtherMarks) {
        Object.values(state.schema.marks).forEach(otherMarkType => {
          if (otherMarkType !== markType) transaction = transaction.removeStoredMark(otherMarkType)
        })
      }
      view.dispatch(transaction
        .setMeta(syntaxFormatPluginKey, EMPTY_SYNTAX_SESSION)
        .scrollIntoView())
      return true
    }

    const activeSession = syntaxFormatPluginKey.getState(state)
    if (activeSession?.active) {
      finishSyntaxFormatSession(view, activeSession)
      state = view.state
      selection = state.selection
    } else {
      view.dispatch(state.tr.setMeta(syntaxFormatPluginKey, EMPTY_SYNTAX_SESSION))
      state = view.state
      selection = state.selection
    }
    if (selectedCommandKey) return ctx.get(commandsCtx).call(selectedCommandKey)
    const markType = getMarkType(ctx)
    return markType
      ? toggleMark(markType, attrs)(state, transaction => view.dispatch(transaction), view)
      : false
  })
}

function runMarkdownShortcut (editor, action) {
  if (!editor) return false
  const headingMatch = /^heading-([1-6])$/.exec(action)
  if (headingMatch) {
    return runExclusiveBlockCommand(
      editor,
      callCommand(wrapInHeadingCommand.key, Number(headingMatch[1]))
    )
  }

  if (action === MARKDOWN_SHORTCUT_ACTIONS.PARAGRAPH) {
    return runExclusiveBlockCommand(editor, callCommand(turnIntoTextCommand.key))
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.CODE_BLOCK) {
    return runExclusiveBlockCommand(editor, callCommand(createCodeBlockCommand.key, ''))
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.FORMULA_BLOCK) {
    return runExclusiveBlockCommand(editor, callCommand(createCodeBlockCommand.key, 'LaTeX'))
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.BLOCKQUOTE) {
    return runExclusiveBlockCommand(editor, callCommand(wrapInBlockquoteCommand.key), true)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.ORDERED_LIST) {
    return runExclusiveBlockCommand(editor, callCommand(wrapInOrderedListCommand.key), true)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.BULLET_LIST) {
    return runExclusiveBlockCommand(editor, callCommand(wrapInBulletListCommand.key), true)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.BOLD) {
    return runInlineSyntaxShortcut(editor, '**', '**', ctx => strongSchema.type(ctx), null, toggleStrongCommand.key)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.ITALIC) {
    return runInlineSyntaxShortcut(editor, '*', '*', ctx => emphasisSchema.type(ctx), null, toggleEmphasisCommand.key)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.INLINE_CODE) {
    return runInlineSyntaxShortcut(editor, '`', '`', ctx => inlineCodeSchema.type(ctx), null, toggleInlineCodeCommand.key, true)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.STRIKETHROUGH) {
    return runInlineSyntaxShortcut(editor, '~~', '~~', ctx => strikethroughSchema.type(ctx), null, toggleStrikethroughCommand.key)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.LINK) {
    return runInlineSyntaxShortcut(editor, '[', ']()', ctx => linkSchema.type(ctx), { href: '' }, toggleLinkCommand.key)
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.UNDERLINE) {
    return runInlineSyntaxShortcut(editor, '<u>', '</u>', ctx => underlineSchema.type(ctx))
  }
  if (action === MARKDOWN_SHORTCUT_ACTIONS.INCREASE_HEADING) return changeHeadingLevel(editor, -1)
  if (action === MARKDOWN_SHORTCUT_ACTIONS.DECREASE_HEADING) return changeHeadingLevel(editor, 1)
  if (action === MARKDOWN_SHORTCUT_ACTIONS.CLEAR_FORMATTING) return clearFormatting(editor)
  if (action === MARKDOWN_SHORTCUT_ACTIONS.TASK_LIST) {
    prepareExclusiveBlockFormat(editor, true)
    return editor.action(ctx => turnSelectionIntoTaskList(ctx.get(editorViewCtx)))
  }

  return false
}

function collectSelectedContainerTargets (state, selection, nodeName) {
  const targets = new Map()
  const addTarget = ($position, cursor = $position.pos) => {
    for (let depth = $position.depth; depth > 0; depth -= 1) {
      if ($position.node(depth).type.name !== nodeName) continue
      const position = $position.before(depth)
      const existing = targets.get(position)
      if (!existing || depth > existing.depth) {
        targets.set(position, { cursor, depth, position })
      }
      break
    }
  }

  selection.ranges.forEach(({ $from, $to }) => {
    addTarget($from)
    addTarget($to)
  })
  if (!selection.empty) {
    state.doc.nodesBetween(selection.from, selection.to, (node, position) => {
      if (node.isTextblock) addTarget(state.doc.resolve(position + 1), position + 1)
    })
  }

  return [...targets.values()].sort((left, right) => (
    right.position - left.position || right.depth - left.depth
  ))
}

function liftSelectedContainers (view, selectionBookmark, nodeName, createCommand) {
  let bookmark = selectionBookmark
  let changed = false
  let attemptedLocalSelection = false

  while (true) {
    const selection = bookmark.resolve(view.state.doc)
    const targets = collectSelectedContainerTargets(view.state, selection, nodeName)
    if (targets.length === 0) break

    let lifted = false
    for (const target of targets) {
      const localSelection = TextSelection.near(view.state.doc.resolve(target.cursor), 1)
      view.dispatch(view.state.tr.setSelection(localSelection))
      attemptedLocalSelection = true

      const applied = createCommand(view.state)(
        view.state,
        transaction => {
          bookmark = bookmark.map(transaction.mapping)
          view.dispatch(transaction)
        },
        view
      )
      if (!applied) continue
      changed = true
      lifted = true
      break
    }
    if (!lifted) break
  }

  if (changed || attemptedLocalSelection) {
    const restoredSelection = bookmark.resolve(view.state.doc)
    view.dispatch(view.state.tr.setSelection(restoredSelection))
  }
  return { bookmark, changed }
}

function exitBlockContainers (view) {
  let bookmark = view.state.selection.getBookmark()
  let changed = false
  const listItemType = view.state.schema.nodes.list_item

  if (listItemType) {
    const listResult = liftSelectedContainers(
      view,
      bookmark,
      'list_item',
      () => liftListItem(listItemType)
    )
    bookmark = listResult.bookmark
    changed = listResult.changed
  }

  const quoteResult = liftSelectedContainers(
    view,
    bookmark,
    'blockquote',
    () => lift
  )
  return quoteResult.changed || changed
}

function prepareExclusiveBlockFormat (editor, normalizeToParagraph = false) {
  if (!editor) return false
  return editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    let changed = exitBlockContainers(view)
    if (!normalizeToParagraph) return changed

    const paragraphType = view.state.schema.nodes.paragraph
    if (!paragraphType) return changed
    const normalized = setBlockType(paragraphType)(
      view.state,
      transaction => view.dispatch(transaction),
      view
    )
    return normalized || changed
  })
}

function runExclusiveBlockCommand (editor, command, normalizeToParagraph = false) {
  const prepared = prepareExclusiveBlockFormat(editor, normalizeToParagraph)
  const applied = editor.action(command)
  return applied || prepared
}

function collectSelectedTextBlocks (state) {
  const blocks = new Map()
  const addBlock = ($position) => {
    for (let depth = $position.depth; depth > 0; depth -= 1) {
      const node = $position.node(depth)
      if (!node.isTextblock) continue
      blocks.set($position.before(depth), node)
      return
    }
  }

  addBlock(state.selection.$from)
  addBlock(state.selection.$to)
  if (!state.selection.empty) {
    state.doc.nodesBetween(state.selection.from, state.selection.to, (node, position) => {
      if (node.isTextblock) blocks.set(position, node)
    })
  }
  return blocks
}

function changeHeadingLevel (editor, direction) {
  if (!editor) return false
  return editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    const exitedContainer = exitBlockContainers(view)
    const headingType = view.state.schema.nodes.heading
    const paragraphType = view.state.schema.nodes.paragraph
    if (!headingType || !paragraphType) return false

    const blocks = collectSelectedTextBlocks(view.state)
    const transaction = view.state.tr
    let changed = false
    blocks.forEach((node, position) => {
      if (node.type === headingType) {
        const nextLevel = Number(node.attrs.level) + direction
        if (nextLevel < 1) return
        if (nextLevel > 6) transaction.setNodeMarkup(position, paragraphType)
        else transaction.setNodeMarkup(position, headingType, { ...node.attrs, level: nextLevel })
        changed = true
      } else if (node.type === paragraphType && direction < 0) {
        transaction.setNodeMarkup(position, headingType, { level: 6 })
        changed = true
      }
    })
    if (!changed) return exitedContainer
    view.dispatch(transaction.scrollIntoView())
    return true
  })
}

function clearFormatting (editor) {
  if (!editor) return false
  return editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    const exitedContainer = exitBlockContainers(view)
    const { state } = view
    const blocks = collectSelectedTextBlocks(state)
    const paragraphType = state.schema.nodes.paragraph
    const headingType = state.schema.nodes.heading
    const rangeFrom = state.selection.empty ? state.selection.$from.start() : state.selection.from
    const rangeTo = state.selection.empty ? state.selection.$from.end() : state.selection.to
    let transaction = state.tr

    Object.values(state.schema.marks).forEach(markType => {
      transaction = transaction.removeMark(rangeFrom, rangeTo, markType)
      transaction = transaction.removeStoredMark(markType)
    })
    if (paragraphType && headingType) {
      blocks.forEach((node, position) => {
        if (node.type === headingType) transaction.setNodeMarkup(position, paragraphType)
      })
    }
    if (!transaction.docChanged && transaction.storedMarksSet !== true) return exitedContainer
    view.dispatch(transaction.scrollIntoView())
    return true
  })
}

function changeListDepth (editor, outdent) {
  if (!editor) return false
  return editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    const listItemType = view.state.schema.nodes.list_item
    if (!listItemType) return false
    const command = outdent ? liftListItem(listItemType) : sinkListItem(listItemType)
    return command(view.state, transaction => view.dispatch(transaction), view)
  })
}

function getDeletionUnit (doc, position, bias) {
  const resolved = doc.resolve(Math.max(0, Math.min(doc.content.size, position)))
  const $position = TextSelection.near(resolved, bias).$head
  let depth = $position.depth
  while (depth > 0 && !$position.node(depth).isTextblock) depth -= 1
  if (depth === 0) return null

  for (let ancestorDepth = depth - 1; ancestorDepth > 0; ancestorDepth -= 1) {
    if ($position.node(ancestorDepth).type.name !== 'list_item') continue
    depth = ancestorDepth
    break
  }
  while (depth > 1 && $position.node(depth - 1).childCount === 1) depth -= 1
  return { from: $position.before(depth), to: $position.after(depth) }
}

function deleteCurrentBlock (editor) {
  if (!editor) return false
  return editor.action(ctx => {
    const view = ctx.get(editorViewCtx)
    const { doc, selection } = view.state
    const selectedNode = selection.node
    const startUnit = selectedNode?.isBlock
      ? { from: selection.from, to: selection.to }
      : getDeletionUnit(doc, selection.from, 1)
    const endProbe = selection.empty ? selection.to : Math.max(selection.from, selection.to - 1)
    const endUnit = selectedNode?.isBlock
      ? startUnit
      : getDeletionUnit(doc, endProbe, -1)
    if (!startUnit || !endUnit) return false

    const from = Math.min(startUnit.from, endUnit.from)
    const to = Math.max(startUnit.to, endUnit.to)
    let transaction = view.state.tr
    if (from === 0 && to === doc.content.size) {
      const paragraph = view.state.schema.nodes.paragraph?.createAndFill()
      if (!paragraph) return false
      transaction = transaction.replaceWith(from, to, paragraph)
      transaction = transaction.setSelection(TextSelection.atStart(transaction.doc))
    } else {
      transaction = transaction.deleteRange(from, to)
      transaction = transaction.setSelection(TextSelection.near(
        transaction.doc.resolve(Math.min(from, transaction.doc.content.size)),
        1
      ))
    }
    view.dispatch(transaction.scrollIntoView())
    return true
  })
}

function MilkdownEditorInner ({ embedded = false, language, maxLength, onChange, onCompositionEnd, onCompositionStart, onCopyAll, onKeyDown, onReady, onWheel, preserveGutter = false, readOnly = false, text, zoom = 100 }, forwardedRef) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const wrapperRef = useRef(null)
  const mountedRef = useRef(false)
  const externalUpdateRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const onCopyAllRef = useRef(onCopyAll)
  const onReadyRef = useRef(onReady)
  const textRef = useRef(text)
  const changeMetadataRef = useRef(null)
  onChangeRef.current = onChange
  onCopyAllRef.current = onCopyAll
  onReadyRef.current = onReady
  const codeLabels = useMemo(() => ({
    copy: t(language, 'editor.markdownCodeCopy'),
    copied: t(language, 'editor.markdownCodeCopied'),
    language: t(language, 'editor.markdownCodeLanguage'),
    search: t(language, 'editor.markdownCodeSearchLanguage'),
    noResult: t(language, 'editor.markdownCodeNoResult')
  }), [language])

  const setWrapperRef = useCallback(node => {
    wrapperRef.current = node
    mountedRef.current = Boolean(node)
  }, [])

  const runTrackedOperation = useCallback((kind, operation) => {
    const previousMetadata = changeMetadataRef.current
    markdownUndoOperationSequence += 1
    changeMetadataRef.current = {
      undoMergeKey: `markdown-${kind}:${markdownUndoOperationSequence}`
    }
    try {
      return operation()
    } finally {
      changeMetadataRef.current = previousMetadata
    }
  }, [])

  const instance = useEditor((root) => {
    const publishMarkdown = (_ctx, markdown) => {
      if (!mountedRef.current) return
      const externalUpdate = externalUpdateRef.current
      externalUpdateRef.current = null
      if (externalUpdate) {
        textRef.current = externalUpdate.source
        return
      }
      const normalizedMarkdown = normalizeMarkdownEditorChange(markdown)
      if (maxLength && normalizedMarkdown.length > maxLength) {
        const previousMarkdown = textRef.current
        externalUpdateRef.current = { source: previousMarkdown }
        replaceAll(previousMarkdown)(_ctx)
        onChangeRef.current(normalizedMarkdown, changeMetadataRef.current)
        return
      }
      const nextMarkdown = normalizedMarkdown
      textRef.current = nextMarkdown
      onChangeRef.current(nextMarkdown, changeMetadataRef.current)
    }
    const immediateMarkdownListener = $prose(ctx => new Plugin({
      view: () => ({
        update: (view, previousState) => {
          if (!view.state.doc.eq(previousState.doc)) publishMarkdown(ctx, serializeMarkdownDocument(ctx, view.state.doc))
        }
      })
    }))
    const copyAllOnEmptySelection = $prose(() => new Plugin({
      props: {
        handleDOMEvents: {
          copy: (view, event) => {
            if (!view.state.selection.empty || !onCopyAllRef.current) return false
            event.preventDefault()
            onCopyAllRef.current()
            return true
          }
        }
      }
    }))
    const stagedListBackspace = $prose(() => new Plugin({
      props: {
        handleKeyDown: (view, event) => {
          if (readOnly || event.isComposing || event.key !== 'Backspace' || event.ctrlKey || event.metaKey || event.altKey) return false
          return runTrackedOperation('edit', () => handleListBackspace(view))
        }
      }
    }))
    let editor
    const syntaxShortcutPlugin = $prose(() => new Plugin({
      props: {
        handleKeyDown: (_view, event) => {
          if (readOnly || event.isComposing) return false
          const action = getMarkdownShortcutAction(event)
          if (![
            MARKDOWN_SHORTCUT_ACTIONS.BOLD,
            MARKDOWN_SHORTCUT_ACTIONS.ITALIC,
            MARKDOWN_SHORTCUT_ACTIONS.INLINE_CODE,
            MARKDOWN_SHORTCUT_ACTIONS.STRIKETHROUGH,
            MARKDOWN_SHORTCUT_ACTIONS.LINK,
            MARKDOWN_SHORTCUT_ACTIONS.UNDERLINE
          ].includes(action)) return false
          return Boolean(runTrackedOperation('format', () => runMarkdownShortcut(editor, action)))
        }
      }
    }))
    editor = Editor.make()
      .config(ctx => {
        ctx.inject(crepeFeaturesCtx, [])
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, textRef.current)
        ctx.set(editorViewOptionsCtx, { editable: () => !readOnly })
        ctx.update(remarkStringifyOptionsCtx, options => ({
          ...options,
          bullet: '-',
          handlers: {
            ...options.handlers,
            root: serializeMarkdownRoot,
            underline: serializeUnderline
          }
        }))
        ctx.get(listenerCtx).mounted(() => onReadyRef.current?.())
      })
      .use(syntaxShortcutPlugin)
      .use(stagedListBackspace)
      .use(cleanCommonmark)
      .use(listener)
      .use(gfm)
      .use(remarkCleanLineBreakPlugin)
      .use(remarkPreserveSourceBlankLinesPlugin)
      .use(remarkUnderlinePlugin)
      .use(underlineSchema)
      .use(syntaxDelimiterSchema)
      .use(syntaxFormatDecorations)
      .use(listItemWithHiddenMarker)
      .use(restoreHiddenListItemMarkers)
      .use(hiddenListMarkerDecorations)
      .use(copyAllOnEmptySelection)
      .use(immediateMarkdownListener)
    codeMirror(editor, {
      languages,
      extensions: [createMarkdownCodeHighlighting()],
      copyText: '',
      onCopy: () => showCodeCopyFeedback(wrapperRef.current, codeLabels),
      searchPlaceholder: codeLabels.search,
      noResultText: codeLabels.noResult
    })
    listItem(editor, {})
    latex(editor, {})
    linkTooltip(editor, {
      inputPlaceholder: t(language, 'editor.markdownLinkPlaceholder'),
      onCopyLink: link => {
        if (window.utools?.copyText) window.utools.copyText(link)
        else navigator.clipboard?.writeText?.(link)
      }
    })
    return editor
  }, [language, maxLength, readOnly])

  useEffect(() => {
    if (!instance || instance.loading || readOnly || typeof onReadyRef.current !== 'function') return undefined
    const frame = requestAnimationFrame(() => {
      onReadyRef.current?.()
    })
    return () => cancelAnimationFrame(frame)
  }, [instance?.loading, readOnly])

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return undefined
    const decorate = () => decorateCodeBlockControls(wrapper, codeLabels)
    decorate()
    const observer = new MutationObserver(decorate)
    observer.observe(wrapper, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [codeLabels, instance])

  const onMouseDown = event => {
    if (readOnly) return
    const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
    const editorDom = getEditorDom(wrapperRef.current)
    if (!view || !editorDom) return

    const position = view.posAtCoords({ left: event.clientX, top: event.clientY })
    const clickedEditorSurface = event.target === editorDom || !editorDom.contains(event.target)
    if (!clickedEditorSurface && position) return

    event.preventDefault()
    const editorRect = editorDom.getBoundingClientRect()
    focusDocumentAtPoint(view, position, event.clientY <= editorRect.top)
  }

  const handleKeyDown = event => {
    if (event.defaultPrevented) {
      if (event.key === 'Escape') {
        onKeyDown?.(event)
        return
      }
      event.stopPropagation()
      return
    }
    const action = getMarkdownShortcutAction(event)
    if (!action) {
      onKeyDown?.(event)
      return
    }
    event.preventDefault()
    event.stopPropagation()
    runTrackedOperation('format', () => runMarkdownShortcut(instance.get(), action))
  }

  const handleKeyDownCapture = event => {
    if (!readOnly && getArrowDirection(event) !== 0) {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (view && handleSyntaxArrowKey(view, event)) return
    }
    const action = getEditingShortcutAction(event)
    if (action !== 'undo' && action !== 'redo') return
    onKeyDown?.(event)
    if (event.defaultPrevented) event.stopPropagation()
  }

  useEffect(() => {
    const editor = instance.get()
    if (!editor) return
    if (textRef.current === text) return
    if (maxLength && text.length > maxLength) return
    const externalUpdate = { source: text }
    externalUpdateRef.current = externalUpdate
    textRef.current = text
    editor.action(replaceAll(text))
    if (externalUpdateRef.current === externalUpdate) externalUpdateRef.current = null
  }, [instance, maxLength, text])

  useImperativeHandle(forwardedRef, () => ({
    get isContentEditable () {
      return Boolean(getEditorDom(wrapperRef.current))
    },
    contains: node => Boolean(node && wrapperRef.current?.contains(node)),
    focus: () => getEditorDom(wrapperRef.current)?.focus(),
    get scrollTop () {
      return wrapperRef.current?.scrollTop ?? 0
    },
    set scrollTop (value) {
      if (wrapperRef.current) wrapperRef.current.scrollTop = Math.max(0, Number(value) || 0)
    },
    get scrollLeft () {
      return wrapperRef.current?.scrollLeft ?? 0
    },
    set scrollLeft (value) {
      if (wrapperRef.current) wrapperRef.current.scrollLeft = Math.max(0, Number(value) || 0)
    },
    get scrollHeight () {
      return wrapperRef.current?.scrollHeight ?? 0
    },
    get clientHeight () {
      return wrapperRef.current?.clientHeight ?? 0
    },
    isContentOverflowing: () => {
      const wrapper = wrapperRef.current
      const editorDom = getEditorDom(wrapper)
      const lastBlock = editorDom?.lastElementChild
      if (!wrapper || !lastBlock) return false
      return lastBlock.getBoundingClientRect().bottom > wrapper.getBoundingClientRect().bottom + 1
    },
    getEndSelectionOffset: () => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      return view ? TextSelection.atEnd(view.state.doc).from : 1
    },
    getSourceEndSelectionOffset: () => textRef.current.length,
    get selectionStart () {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      return view?.state.selection.from ?? 1
    },
    get selectionEnd () {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      return view?.state.selection.to ?? 1
    },
    getSourceSelection: () => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return null
      return {
        selectionStart: documentPositionToSourceOffset(view.state.doc, textRef.current, view.state.selection.from),
        selectionEnd: documentPositionToSourceOffset(view.state.doc, textRef.current, view.state.selection.to)
      }
    },
    setSourceSelectionRange: (start, end) => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return
      const from = sourceOffsetToDocumentPosition(view.state.doc, textRef.current, start)
      const to = Math.max(from, sourceOffsetToDocumentPosition(view.state.doc, textRef.current, end))
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)).scrollIntoView())
      view.focus()
    },
    setSelectionRange: (start, end) => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return
      const from = clampDocumentPosition(view.state.doc, start)
      const to = Math.max(from, clampDocumentPosition(view.state.doc, end))
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)).scrollIntoView())
      view.focus()
    },
    getSearchMatches: query => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      return view ? findDocumentTextMatches(view.state.doc, query) : []
    },
    replaceTextRange: (start, end, replacement) => runTrackedOperation('replace', () => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return false
      const from = clampDocumentPosition(view.state.doc, start)
      const to = Math.max(from, clampDocumentPosition(view.state.doc, end))
      view.dispatch(view.state.tr.insertText(String(replacement), from, to).scrollIntoView())
      return true
    }),
    replaceAllText: (query, replacement) => runTrackedOperation('replace-all', () => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return 0
      const matches = findDocumentTextMatches(view.state.doc, query)
      if (matches.length === 0) return 0
      let transaction = view.state.tr
      for (let index = matches.length - 1; index >= 0; index -= 1) {
        const match = matches[index]
        transaction = transaction.insertText(String(replacement), match.start, match.end)
      }
      view.dispatch(transaction.scrollIntoView())
      return matches.length
    }),
    getCurrentSourceLine: source => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return 1
      const currentText = view.state.selection.$from.parent.textContent.trim()
      const lines = String(source || '').split('\n')
      if (currentText) {
        const lineIndex = lines.findIndex(line => stripMarkdownLineMarkers(line) && currentText.includes(stripMarkdownLineMarkers(line)))
        if (lineIndex >= 0) return lineIndex + 1
      }
      const ratio = view.state.selection.from / Math.max(1, view.state.doc.content.size)
      return Math.min(lines.length, Math.max(1, Math.round(ratio * Math.max(1, lines.length - 1)) + 1))
    },
    goToSourceLine: (lineNumber, source) => {
      const view = instance.get()?.action(ctx => ctx.get(editorViewCtx))
      if (!view) return false
      const lines = String(source || '').split('\n')
      const targetIndex = Math.max(0, Math.min(lines.length - 1, Number(lineNumber) - 1))
      const targetText = stripMarkdownLineMarkers(lines[targetIndex])
      const blocks = collectTextBlocks(view.state.doc)
      const expectedBlockIndex = Math.round(targetIndex / Math.max(1, lines.length - 1) * Math.max(0, blocks.length - 1))
      let block = targetText
        ? blocks
            .map((candidate, index) => ({ ...candidate, index }))
            .filter(candidate => candidate.text.includes(targetText))
            .sort((left, right) => Math.abs(left.index - expectedBlockIndex) - Math.abs(right.index - expectedBlockIndex))[0]
        : null
      if (!block) {
        const nonEmptyBefore = lines.slice(0, targetIndex + 1).filter(line => stripMarkdownLineMarkers(line)).length
        block = blocks[Math.max(0, Math.min(blocks.length - 1, nonEmptyBefore - 1))]
      }
      if (!block) return false
      const position = clampDocumentPosition(view.state.doc, block.position)
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, position)).scrollIntoView())
      view.focus()
      return true
    },
    addEventListener: (...args) => getEditorDom(wrapperRef.current)?.addEventListener(...args),
    removeEventListener: (...args) => getEditorDom(wrapperRef.current)?.removeEventListener(...args),
    dispatchEvent: event => getEditorDom(wrapperRef.current)?.dispatchEvent(event),
    toggleStrong: () => runTrackedOperation('format', () => runInlineSyntaxShortcut(instance.get(), '**', '**', ctx => strongSchema.type(ctx), null, toggleStrongCommand.key)),
    toggleEmphasis: () => runTrackedOperation('format', () => runInlineSyntaxShortcut(instance.get(), '*', '*', ctx => emphasisSchema.type(ctx), null, toggleEmphasisCommand.key)),
    indentList: () => runTrackedOperation('format', () => changeListDepth(instance.get(), false)),
    outdentList: () => runTrackedOperation('format', () => changeListDepth(instance.get(), true)),
    deleteCurrentLine: () => readOnly ? false : runTrackedOperation('edit', () => deleteCurrentBlock(instance.get()))
  }), [instance, readOnly, runTrackedOperation])

  return (
    <Box
      ref={setWrapperRef}
      component="div"
      data-read-only={readOnly ? 'true' : 'false'}
      onCompositionEnd={onCompositionEnd}
      onCompositionStart={onCompositionStart}
      onKeyDownCapture={handleKeyDownCapture}
      onKeyDown={handleKeyDown}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      sx={{
        flex: embedded ? '0 0 auto' : 1,
        minHeight: 0,
        overflowY: embedded ? 'visible' : 'auto',
        fontFamily: 'var(--content-font-family)',
        bgcolor: isDark ? '#2b2b2b' : '#FDFBF7',
        backgroundImage: 'none',
        color: isDark ? '#E2E2E2' : '#43341B',
        transition: 'background-color 0.25s ease, color 0.25s ease',
        '& .markdown-syntax-delimiter': {
          opacity: 0,
          display: 'inline-block',
          width: 0,
          overflow: 'hidden',
          whiteSpace: 'pre'
        },
        '& .markdown-syntax-delimiter-active': {
          opacity: 1,
          width: 'auto',
          overflow: 'visible'
        },
        '& .markdown-syntax-source-range': {
          display: 'inline',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontStyle: 'normal',
          fontWeight: '400',
          lineHeight: 'inherit',
          whiteSpace: 'pre'
        },
        '& .markdown-syntax-source-range::before': {
          content: 'attr(data-markdown-syntax-open)',
          color: 'inherit',
          fontFamily: 'inherit',
          fontStyle: 'normal',
          fontWeight: '400',
          whiteSpace: 'pre'
        },
        '& .markdown-syntax-source-range::after': {
          content: 'attr(data-markdown-syntax-close)',
          color: 'inherit',
          fontFamily: 'inherit',
          fontStyle: 'normal',
          fontWeight: '400',
          whiteSpace: 'pre'
        },
        '& [data-milkdown-root]': { minHeight: embedded ? 0 : '100%' },
        '& .milkdown': {
          '--crepe-color-primary': theme.palette.primary.main,
          '--crepe-color-surface': isDark ? '#343434' : '#F3F0E8',
          '--crepe-color-surface-low': isDark ? '#2b2b2b' : '#FDFBF7',
          '--crepe-color-on-surface': isDark ? '#E2E2E2' : '#43341B',
          '--crepe-color-on-surface-variant': isDark ? 'rgba(226,226,226,0.78)' : 'rgba(67,52,27,0.76)',
          '--crepe-color-outline': isDark ? 'rgba(226,226,226,0.62)' : 'rgba(67,52,27,0.48)',
          '--crepe-color-hover': isDark ? 'rgba(255,255,255,0.08)' : 'rgba(67,52,27,0.08)',
          '--crepe-font-default': 'inherit',
          '--crepe-font-code': 'var(--content-font-family)',
          '--markdown-code-comment': isDark ? '#8B949E' : '#6E7781',
          '--markdown-code-keyword': isDark ? '#FF7B72' : '#CF222E',
          '--markdown-code-string': isDark ? '#A5D6FF' : '#0A3069',
          '--markdown-code-number': isDark ? '#79C0FF' : '#0550AE',
          '--markdown-code-title': isDark ? '#D2A8FF' : '#8250DF',
          '--markdown-code-type': isDark ? '#FFA657' : '#953800',
          '--markdown-code-variable': isDark ? '#FFA657' : '#953800',
          '--markdown-code-tag': isDark ? '#7EE787' : '#116329',
          '--markdown-code-invalid': isDark ? '#F85149' : '#A40E26',
          '--crepe-shadow-1': '0 6px 18px rgba(0,0,0,0.32)',
          '--crepe-base-font-size': `${EDITOR_FONT_SIZE * zoom / 100}px`,
          minHeight: embedded ? 0 : '100%',
          p: embedded ? 0 : 2,
          pb: embedded ? 0 : 2,
          outline: 'none',
          fontSize: EDITOR_FONT_SIZE * zoom / 100,
          lineHeight: 1.6,
          fontFamily: 'inherit'
        },
        '& .ProseMirror': {
          outline: 'none',
          minHeight: embedded ? 0 : '100%',
          pl: embedded && !preserveGutter ? 0 : `${EDITOR_GUTTER_WIDTH}px`,
          whiteSpace: 'pre-wrap',
          caretColor: readOnly ? 'transparent' : 'currentColor',
          '& ::selection': { bgcolor: 'rgba(143, 181, 149, 0.38)' }
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': { margin: '0.65em 0 0.35em', lineHeight: 1.25 },
        '& p, & ul, & ol, & blockquote, & pre, & table': { margin: '0.65em 0' },
        // 编辑器 Milkdown 已在独立的 flex 列中绘制列表标签，列表元素本身不能再叠加浏览器默认
        // 列表标记列（marker gutter），否则会出现两套项目符号或编号。
        '& .ProseMirror ul, & .ProseMirror ol': { paddingLeft: 0 },
        '& .milkdown-list-item-block p': { margin: 0, padding: 0 },
        '& .milkdown-list-item-block ul, & .milkdown-list-item-block ol': { margin: 0 },
        '& .milkdown .milkdown-list-item-block > .list-item': { gap: '0.375em' },
        '& .milkdown .milkdown-list-item-block > .list-item > .label-wrapper': {
          flex: '0 0 1.5em',
          width: '1.5em',
          height: '1.6em',
          alignItems: 'flex-start'
        },
        '& .milkdown .milkdown-list-item-block.list-marker-hidden > .list-item > .label-wrapper': {
          visibility: 'hidden'
        },
        '& .milkdown .milkdown-list-item-block > .list-item > .label-wrapper .label': {
          display: 'block',
          width: '1.5em',
          height: '1.6em',
          padding: 0,
          lineHeight: 1.6
        },
        '& .milkdown .milkdown-list-item-block > .list-item > .label-wrapper .label.ordered': {
          textAlign: 'right'
        },
        '& .milkdown .milkdown-list-item-block > .list-item > .label-wrapper .label.bullet, & .milkdown .milkdown-list-item-block > .list-item > .label-wrapper .label.checked, & .milkdown .milkdown-list-item-block > .list-item > .label-wrapper .label.unchecked': {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        },
        '& .milkdown .milkdown-list-item-block > .list-item > .label-wrapper .label svg': {
          display: 'block',
          width: '1.5em',
          height: '1.5em'
        },
        '& blockquote': { marginLeft: 0, paddingLeft: 1.5, borderLeft: '3px solid', borderColor: 'primary.main', color: 'text.secondary' },
        '& code': { fontFamily: 'var(--content-font-family)', fontSize: '0.9em' },
        '& :not(pre) > code': {
          px: '0.32em',
          py: '0.1em',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,35,40,0.1)',
          borderRadius: '4px',
          bgcolor: isDark ? 'rgba(255,255,255,0.065)' : 'rgba(175,184,193,0.18)'
        },
        '& .milkdown-code-block': {
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          m: '0.85em 0',
          p: '0 !important',
          border: '1px solid',
          borderColor: isDark ? 'rgba(240,246,252,0.12)' : 'rgba(31,35,40,0.14)',
          borderRadius: '7px',
          bgcolor: isDark ? '#202124' : '#F6F8FA',
          color: isDark ? '#E6EDF3' : '#24292F',
          transition: 'border-color 120ms ease, box-shadow 120ms ease'
        },
        '& .milkdown-code-block.selected': {
          outline: 'none',
          borderColor: isDark ? 'rgba(121,192,255,0.72)' : 'rgba(9,105,218,0.58)',
          boxShadow: isDark ? '0 0 0 1px rgba(121,192,255,0.22)' : '0 0 0 1px rgba(9,105,218,0.14)'
        },
        '& .milkdown-code-block .tools': {
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '34px !important',
          minHeight: '34px !important',
          maxHeight: '34px !important',
          px: '7px !important',
          py: '4px !important',
          overflow: 'visible !important',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(240,246,252,0.09)' : 'rgba(31,35,40,0.1)',
          bgcolor: isDark ? '#25272A' : '#EFF2F5'
        },
        '& .milkdown-code-block .tools .language-button': {
          boxSizing: 'border-box',
          flex: '0 0 auto',
          minWidth: 0,
          height: '25px !important',
          margin: '0 !important',
          padding: '0 4px 0 7px !important',
          gap: '3px',
          border: '1px solid transparent',
          borderRadius: '5px',
          bgcolor: 'transparent',
          color: isDark ? 'rgba(230,237,243,0.72)' : 'rgba(36,41,47,0.72)',
          opacity: '1 !important',
          fontFamily: 'inherit',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: 0,
          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,35,40,0.07)' },
          '& .expand-icon': { width: '16px', height: '16px' },
          '& .expand-icon svg': { width: '13px', height: '13px' }
        },
        '&[data-read-only="true"] .milkdown-code-block .tools .language-button': { cursor: 'default' },
        '&[data-read-only="true"] .milkdown-code-block .tools .language-button .expand-icon': { display: 'none' },
        '& .milkdown-code-block .tools .tools-button-group': { position: 'relative', flex: '0 0 auto', gap: '3px' },
        '& .milkdown-code-block .tools .tools-button-group > button': {
          boxSizing: 'border-box',
          width: '26px !important',
          height: '26px !important',
          minWidth: '26px !important',
          padding: '0 !important',
          gap: 0,
          border: '1px solid transparent',
          borderRadius: '5px !important',
          bgcolor: 'transparent',
          color: isDark ? 'rgba(230,237,243,0.68)' : 'rgba(36,41,47,0.68)',
          opacity: '0.72 !important',
          fontSize: '0 !important',
          transition: 'background-color 120ms ease, color 120ms ease, opacity 120ms ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(31,35,40,0.08)',
            color: isDark ? '#FFFFFF' : '#1F2328',
            opacity: 1
          },
          '&:focus-visible': {
            outline: `2px solid ${isDark ? '#79C0FF' : '#0969DA'}`,
            outlineOffset: '1px'
          },
          '& svg': { width: '15px', height: '15px', fill: 'currentColor' }
        },
        '& .milkdown-code-block .tools .copy-button::after': {
          content: 'attr(data-feedback)',
          position: 'absolute',
          zIndex: 2,
          top: '-29px',
          right: 0,
          width: 'max-content',
          maxWidth: '160px',
          px: '7px',
          py: '4px',
          borderRadius: '4px',
          bgcolor: isDark ? '#F0F3F6' : '#24292F',
          color: isDark ? '#24292F' : '#FFFFFF',
          fontFamily: 'inherit',
          fontSize: '11px',
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: 0,
          pointerEvents: 'none',
          opacity: 0,
          transform: 'translateY(2px)',
          transition: 'opacity 120ms ease, transform 120ms ease'
        },
        '& .milkdown-code-block .tools .copy-button[data-copied="true"]': {
          color: isDark ? '#7EE787' : '#1A7F37',
          opacity: 1,
          '&::after': { opacity: 1, transform: 'translateY(0)' }
        },
        '& .milkdown-code-block .codemirror-host': { minWidth: 0, overflow: 'hidden' },
        '& .milkdown-code-block .cm-editor': {
          maxWidth: '100%',
          bgcolor: 'transparent',
          color: 'inherit',
          fontSize: `calc(${EDITOR_FONT_SIZE * zoom / 100}px * 0.86)`
        },
        '& .milkdown-code-block .cm-scroller': {
          overflowX: 'auto',
          overflowY: 'hidden',
          overscrollBehaviorX: 'contain',
          fontFamily: 'var(--content-font-family)',
          lineHeight: 1.6,
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgba(230,237,243,0.24) transparent' : 'rgba(31,35,40,0.24) transparent'
        },
        '& .milkdown-code-block .cm-content': { minHeight: 0, py: '10px', pr: '14px', pl: '5px', caretColor: `${isDark ? '#FFFFFF' : '#1F2328'} !important` },
        '& .milkdown-code-block .cm-cursor, & .milkdown-code-block .cm-dropCursor': {
          borderLeftColor: `${isDark ? '#FFFFFF' : '#1F2328'} !important`
        },
        '& .milkdown-code-block .cm-line': { px: 0 },
        '& .milkdown-code-block .cm-gutters': {
          minWidth: '36px',
          py: '10px',
          borderRight: 'none',
          bgcolor: 'transparent',
          color: isDark ? 'rgba(139,148,158,0.7)' : 'rgba(87,96,106,0.68)'
        },
        '& .milkdown-code-block .cm-lineNumbers .cm-gutterElement': {
          boxSizing: 'border-box',
          minWidth: '36px',
          pr: '8px',
          pl: '6px',
          fontFamily: 'var(--content-font-family)',
          fontSize: '0.78em',
          fontVariantNumeric: 'tabular-nums'
        },
        '& .milkdown-code-block .cm-activeLine': { bgcolor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(9,105,218,0.045)' },
        '& .milkdown-code-block .cm-activeLineGutter': { bgcolor: 'transparent', color: isDark ? '#C9D1D9' : '#57606A', fontWeight: 600 },
        '& .milkdown-code-block .cm-selectionBackground, & .milkdown-code-block .cm-focused .cm-selectionBackground': {
          bgcolor: `${isDark ? 'rgba(56,139,253,0.34)' : 'rgba(84,174,255,0.34)'} !important`
        },
        '& .milkdown-code-block .milkdown-code-block-placeholder': {
          boxSizing: 'border-box',
          maxWidth: '100%',
          m: 0,
          p: '11px 14px',
          overflowX: 'auto',
          bgcolor: 'transparent',
          color: 'inherit',
          borderRadius: 0,
          fontFamily: 'var(--content-font-family)',
          fontSize: `calc(${EDITOR_FONT_SIZE * zoom / 100}px * 0.86)`,
          lineHeight: 1.6,
          whiteSpace: 'pre',
          wordBreak: 'normal'
        },
        '& .milkdown-code-block .language-picker': { pt: '5px' },
        '& .milkdown-code-block .list-wrapper': {
          width: '230px',
          pt: '8px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: isDark ? 'rgba(240,246,252,0.16)' : 'rgba(31,35,40,0.14)',
          borderRadius: '7px',
          bgcolor: isDark ? '#2D3035' : '#FFFFFF',
          boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.34)' : '0 10px 28px rgba(31,35,40,0.16)'
        },
        '& .milkdown-code-block .language-list': { height: 'auto', maxHeight: '280px' },
        '& .milkdown-code-block .language-list-item': {
          minHeight: '30px',
          p: '5px 12px',
          gap: '6px',
          color: 'inherit',
          fontSize: '13px',
          fontWeight: 500,
          lineHeight: 1.35,
          letterSpacing: 0,
          '&:hover, &:focus-visible': { bgcolor: isDark ? 'rgba(255,255,255,0.075)' : 'rgba(9,105,218,0.07)' }
        },
        '& .milkdown-code-block .search-box': {
          m: '0 8px 7px',
          p: '5px 8px',
          border: '1px solid',
          borderColor: isDark ? 'rgba(240,246,252,0.18)' : 'rgba(31,35,40,0.18)',
          borderRadius: '5px',
          outline: 'none',
          bgcolor: isDark ? 'rgba(255,255,255,0.035)' : '#F6F8FA',
          '&:has(input:focus)': { borderColor: isDark ? '#79C0FF' : '#0969DA', outline: 'none' },
          '& input': { color: 'inherit', fontSize: '13px', lineHeight: 1.4 }
        },
        '& a': { color: 'primary.main', textDecoration: 'underline' },
        '& table': { borderCollapse: 'collapse', width: '100%' },
        '& th, & td': { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5, textAlign: 'left' },
        '& img': { maxWidth: '100%', height: 'auto' }
      }}
    >
      <Milkdown />
    </Box>
  )
}

const MilkdownEditorWithRef = forwardRef(MilkdownEditorInner)

const MarkdownEditor = forwardRef(function MarkdownEditor (props, ref) {
  return (
    <MilkdownProvider>
      <MilkdownEditorWithRef {...props} ref={ref} />
    </MilkdownProvider>
  )
})

export default MarkdownEditor
