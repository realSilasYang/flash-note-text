import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import Box from '@mui/material/Box'
import { defaultKeymap, deleteLine } from '@codemirror/commands'
import { bracketMatching, LanguageDescription } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, drawSelection, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder as codePlaceholder } from '@codemirror/view'
import shiki from 'codemirror-shiki'
import { EDITOR_FONT_SIZE, EDITOR_GUTTER_WIDTH, MAX_TEXT_LENGTH } from '../constants'
import { DARCULA_EXTENDED_COLORS } from '../darculaExtendedCodeTheme'
import { normalizeCodeLanguage } from '../editorMode'
import { findLiteralMatches } from '../textSearch'
import { loadTextMateCodeHighlighting } from '../textMateCodeHighlighting'

const CODE_FONT_FAMILY = 'Consolas, "SFMono-Regular", "Cascadia Code", "Liberation Mono", monospace'

function createCodeAppearance ({ contentFontFamily, embedded, readOnly, wordWrap, zoom }) {
  const colors = DARCULA_EXTENDED_COLORS
  const editorFontFamily = contentFontFamily || CODE_FONT_FAMILY
  return [
    EditorView.theme({
      '&': {
        height: embedded ? 'auto' : '100%',
        minHeight: embedded ? '0' : '100%',
        backgroundColor: colors.background,
        color: colors.foreground,
        fontSize: `${EDITOR_FONT_SIZE * zoom / 100}px`
      },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': {
        overflow: embedded ? 'visible' : 'auto',
        fontFamily: editorFontFamily,
        lineHeight: '1.6'
      },
      '.cm-content': {
        minHeight: embedded ? '0' : '100%',
        padding: embedded ? '0 0 0 8px' : '16px 16px 16px 8px',
        caretColor: readOnly ? 'transparent' : colors.caret
      },
      '.cm-line': { padding: 0 },
      '.cm-gutters': {
        width: `${EDITOR_GUTTER_WIDTH}px`,
        minWidth: `${EDITOR_GUTTER_WIDTH}px`,
        backgroundColor: colors.gutterBackground,
        color: colors.gutterForeground,
        border: 'none'
      },
      '.cm-lineNumbers': { width: '100%' },
      '.cm-lineNumbers .cm-gutterElement': {
        boxSizing: 'border-box',
        minWidth: `${EDITOR_GUTTER_WIDTH}px`,
        padding: '0 8px 0 0',
        fontFamily: CODE_FONT_FAMILY,
        fontSize: '0.86em'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent',
        color: colors.gutterSelectionForeground,
        fontWeight: '600'
      },
      '.cm-activeLine': { backgroundColor: colors.lineHighlight },
      '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: `${colors.selection} !important`
      },
      '&.cm-focused .cm-matchingBracket': {
        backgroundColor: colors.selection,
        outline: `1px solid ${colors.gutterSelectionForeground}`
      },
      '&.cm-focused .cm-nonmatchingBracket': {
        backgroundColor: '#00A8C6',
        color: '#F8F8F0'
      },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: colors.caret },
      '.cm-placeholder': { color: colors.placeholder }
    }, { dark: true }),
    wordWrap ? EditorView.lineWrapping : []
  ]
}

const CodeEditor = forwardRef(function CodeEditor ({
  codeLanguage,
  contentFontFamily,
  embedded = false,
  maxLength = MAX_TEXT_LENGTH,
  onChange,
  onCompositionEnd,
  onCompositionStart,
  onKeyDown,
  onReady,
  onWheel,
  placeholder,
  readOnly = false,
  text,
  wordWrap,
  zoom
}, forwardedRef) {
  const hostRef = useRef(null)
  const viewRef = useRef(null)
  const callbacksRef = useRef({ onChange, onCompositionEnd, onCompositionStart, onKeyDown, onWheel })
  const externalUpdateRef = useRef(false)
  const initialAppearanceRef = useRef(null)
  const initialPlaceholderRef = useRef(placeholder || '')
  const initialReadOnlyRef = useRef(readOnly)
  const initialTextRef = useRef(String(text || ''))
  const languageRequestRef = useRef(0)
  const languageCompartmentRef = useRef(new Compartment())
  const highlightingCompartmentRef = useRef(new Compartment())
  const appearanceCompartmentRef = useRef(new Compartment())
  const placeholderCompartmentRef = useRef(new Compartment())
  const readOnlyCompartmentRef = useRef(new Compartment())
  const maxLengthRef = useRef(maxLength)
  const onReadyRef = useRef(onReady)

  callbacksRef.current = { onChange, onCompositionEnd, onCompositionStart, onKeyDown, onWheel }
  maxLengthRef.current = maxLength
  onReadyRef.current = onReady
  if (!initialAppearanceRef.current) {
    initialAppearanceRef.current = createCodeAppearance({ contentFontFamily, embedded, readOnly, wordWrap, zoom })
  }

  useEffect(() => {
    if (!hostRef.current) return undefined
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: initialTextRef.current,
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightActiveLine(),
          drawSelection(),
          bracketMatching(),
          keymap.of(defaultKeymap),
          placeholderCompartmentRef.current.of(codePlaceholder(initialPlaceholderRef.current)),
          appearanceCompartmentRef.current.of(initialAppearanceRef.current),
          languageCompartmentRef.current.of([]),
          highlightingCompartmentRef.current.of([]),
          readOnlyCompartmentRef.current.of([
            EditorState.readOnly.of(initialReadOnlyRef.current),
            EditorView.editable.of(!initialReadOnlyRef.current)
          ]),
          EditorState.changeFilter.of(transaction => !transaction.docChanged || transaction.newDoc.length <= maxLengthRef.current),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !externalUpdateRef.current) {
              const value = update.state.doc.toString()
              if (value.length <= maxLengthRef.current) callbacksRef.current.onChange?.(value)
            }
          }),
          EditorView.domEventHandlers({
            beforeinput: event => {
              if (event.inputType?.startsWith('insert') && viewRef.current?.state.doc.length >= maxLengthRef.current && viewRef.current.state.selection.main.empty) {
                event.preventDefault()
                return true
              }
              return false
            },
            compositionstart: event => { callbacksRef.current.onCompositionStart?.(event); return false },
            compositionend: event => { callbacksRef.current.onCompositionEnd?.(event); return false },
            keydown: event => { callbacksRef.current.onKeyDown?.(event); return event.defaultPrevented },
            wheel: event => { callbacksRef.current.onWheel?.(event); return event.defaultPrevented }
          })
        ]
      })
    })
    viewRef.current = view
    onReadyRef.current?.()
    return () => {
      viewRef.current = null
      view.destroy()
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: appearanceCompartmentRef.current.reconfigure(createCodeAppearance({ contentFontFamily, embedded, readOnly, wordWrap, zoom })) })
  }, [contentFontFamily, embedded, readOnly, wordWrap, zoom])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: placeholderCompartmentRef.current.reconfigure(codePlaceholder(placeholder || '')) })
  }, [placeholder])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly)
      ])
    })
  }, [readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const requestId = languageRequestRef.current + 1
    languageRequestRef.current = requestId
    const languageName = codeLanguage ? normalizeCodeLanguage(codeLanguage) : ''
    view.dispatch({ effects: highlightingCompartmentRef.current.reconfigure([]) })
    const description = LanguageDescription.matchLanguageName(languages, languageName)
    Promise.all([
      Promise.resolve(description?.load?.()),
      loadTextMateCodeHighlighting(languageName)
    ]).then(([support, highlighting]) => {
      const view = viewRef.current
      if (!view || requestId !== languageRequestRef.current) return
      view.dispatch({
        effects: [
          languageCompartmentRef.current.reconfigure(support || []),
          highlightingCompartmentRef.current.reconfigure(highlighting ? shiki(highlighting) : [])
        ]
      })
    }).catch(error => {
      console.error('加载代码语法高亮失败', error)
    })
  }, [codeLanguage])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const nextText = String(text || '')
    const currentText = view.state.doc.toString()
    if (currentText === nextText) return
    externalUpdateRef.current = true
    const selection = view.state.selection.main
    const anchor = Math.min(selection.anchor, nextText.length)
    const head = Math.min(selection.head, nextText.length)
    view.dispatch({ changes: { from: 0, to: currentText.length, insert: nextText }, selection: { anchor, head } })
    externalUpdateRef.current = false
  }, [text])

  useImperativeHandle(forwardedRef, () => ({
    contains: node => Boolean(node && hostRef.current?.contains(node)),
    focus: () => viewRef.current?.focus(),
    get scrollTop () { return viewRef.current?.scrollDOM.scrollTop ?? 0 },
    set scrollTop (value) { if (viewRef.current) viewRef.current.scrollDOM.scrollTop = Math.max(0, Number(value) || 0) },
    get scrollLeft () { return viewRef.current?.scrollDOM.scrollLeft ?? 0 },
    set scrollLeft (value) { if (viewRef.current) viewRef.current.scrollDOM.scrollLeft = Math.max(0, Number(value) || 0) },
    get scrollHeight () { return viewRef.current?.scrollDOM.scrollHeight ?? 0 },
    get clientHeight () { return viewRef.current?.scrollDOM.clientHeight ?? 0 },
    isContentOverflowing: () => {
      const scrollDOM = viewRef.current?.scrollDOM
      return Boolean(scrollDOM && scrollDOM.scrollHeight > scrollDOM.clientHeight + 1)
    },
    getEndSelectionOffset: () => viewRef.current?.state.doc.length ?? 0,
    get selectionStart () {
      const selection = viewRef.current?.state.selection.main
      return selection ? Math.min(selection.anchor, selection.head) : 0
    },
    get selectionEnd () {
      const selection = viewRef.current?.state.selection.main
      return selection ? Math.max(selection.anchor, selection.head) : 0
    },
    setSelectionRange: (start, end) => {
      const view = viewRef.current
      if (!view) return
      const anchor = Math.max(0, Math.min(view.state.doc.length, Number(start) || 0))
      const head = Math.max(anchor, Math.min(view.state.doc.length, Number(end) || anchor))
      view.dispatch({ selection: { anchor, head }, scrollIntoView: true })
      view.focus()
    },
    getSearchMatches: query => findLiteralMatches(viewRef.current?.state.doc.toString() || '', query),
    replaceTextRange: (start, end, replacement) => {
      const view = viewRef.current
      if (!view || readOnly) return false
      const from = Math.max(0, Math.min(view.state.doc.length, Number(start) || 0))
      const to = Math.max(from, Math.min(view.state.doc.length, Number(end) || from))
      view.dispatch({ changes: { from, to, insert: String(replacement) }, selection: { anchor: from + String(replacement).length }, scrollIntoView: true })
      return true
    },
    replaceAllText: (query, replacement) => {
      const view = viewRef.current
      if (!view || readOnly) return 0
      const matches = findLiteralMatches(view.state.doc.toString(), query)
      if (!matches.length) return 0
      view.dispatch({ changes: matches.map(match => ({ from: match.start, to: match.end, insert: String(replacement) })) })
      return matches.length
    },
    deleteCurrentLine: () => Boolean(!readOnly && viewRef.current && deleteLine(viewRef.current)),
    getCurrentSourceLine: () => {
      const view = viewRef.current
      return view ? view.state.doc.lineAt(view.state.selection.main.head).number : 1
    },
    goToSourceLine: lineNumber => {
      const view = viewRef.current
      if (!view) return false
      const line = view.state.doc.line(Math.max(1, Math.min(view.state.doc.lines, Number(lineNumber) || 1)))
      view.dispatch({ selection: { anchor: line.from }, scrollIntoView: true })
      view.focus()
      return true
    },
    addEventListener: (...args) => viewRef.current?.contentDOM.addEventListener(...args),
    removeEventListener: (...args) => viewRef.current?.contentDOM.removeEventListener(...args),
    dispatchEvent: event => viewRef.current?.contentDOM.dispatchEvent(event)
  }), [readOnly])

  return <Box ref={hostRef} sx={{ flex: embedded ? '0 0 auto' : 1, width: '100%', minWidth: 0, minHeight: 0, overflow: embedded ? 'visible' : 'hidden' }} />
})

export default CodeEditor
