import { lazy, memo, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { EDITOR_FONT_SIZE, EDITOR_GUTTER_WIDTH, MAX_TEXT_LENGTH } from '../constants'
import { calculateTextStats } from '../textStats'
import { getEditorCurrentLine } from '../textMetrics'
import { findScrollbarUnderPointer } from '../scrollbarPointer'
import EditorActionBar from './EditorActionBar.jsx'
import LineNumberGutter from './LineNumberGutter'
import StatusBar from './StatusBar'
import { t } from '../locales'
import { AUTO_CODE_LANGUAGE, PLAIN_CODE_LANGUAGE } from '../editorMode'
import { useCodeLanguageDetection } from '../useCodeLanguageDetection'

const MarkdownEditor = lazy(() => import(/* webpackChunkName: "markdown-editor" */ './MarkdownEditor'))
const CodeEditor = lazy(() => import(/* webpackChunkName: "code-editor" */ './CodeEditor'))

function MarkdownLoading ({ embedded = false, language }) {
  return (
    <Box
      role="status"
      aria-label={t(language, 'editor.loadingMarkdown')}
      sx={{ flex: embedded ? '0 0 auto' : 1, minHeight: embedded ? 72 : 0, display: 'grid', placeItems: 'center' }}
    >
      <CircularProgress size={20} />
    </Box>
  )
}

function CodeLoading ({ embedded = false, language }) {
  return (
    <Box
      role="status"
      aria-label={t(language, 'editor.loadingCode')}
      sx={{ flex: embedded ? '0 0 auto' : 1, minHeight: embedded ? 72 : 0, display: 'grid', placeItems: 'center' }}
    >
      <CircularProgress size={20} />
    </Box>
  )
}

function EditorPane ({
  codeLanguage,
  contentFontFamily,
  editorMode,
  encoding,
  fileState,
  language,
  lineEnding,
  onChange,
  onCodeDetectionChange,
  onCompositionEnd,
  onCompositionStart,
  onCopyAll,
  onEditorReady,
  onEditorModeChange,
  onCodeLanguageChange,
  onEncodingChange,
  onFormatText,
  onOpenAiFormatting,
  onKeyDown,
  onLineEndingChange,
  onPreviewDismiss,
  onReloadWithEncoding,
  onOpenShareStudio,
  onToggleSidebar,
  onWheel,
  onZoomChange,
  sidebarExpanded,
  sidebarShortcut,
  text,
  textAreaRef,
  preview,
  previewScrollRef,
  searchPanel,
  wordWrap,
  zoom
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const editorBackground = isDark ? '#2b2b2b' : '#FDFBF7'
  const editorForeground = isDark ? '#E2E2E2' : '#43341B'
  const plainTextRef = useRef(null)
  const editorPaneRef = useRef(null)
  const scrollbarCursorTargetRef = useRef(null)
  const [currentLine, setCurrentLine] = useState(1)
  const [editorScrollTop, setEditorScrollTop] = useState(0)
  const displayedText = preview?.content ?? text
  const displayedEditorMode = preview?.editorMode || editorMode
  const displayedCodeLanguagePreference = preview?.codeLanguage || codeLanguage
  const deferredStatsText = useDeferredValue(displayedText)
  const codeDetection = useCodeLanguageDetection({
    enabled: displayedEditorMode === 'code',
    filename: preview ? '' : fileState?.name || '',
    preference: displayedCodeLanguagePreference,
    text: deferredStatsText
  })
  const effectiveCodeLanguage = displayedCodeLanguagePreference === AUTO_CODE_LANGUAGE
    ? codeDetection.language
    : displayedCodeLanguagePreference === PLAIN_CODE_LANGUAGE
      ? null
      : displayedCodeLanguagePreference
  useEffect(() => {
    if (!preview && displayedEditorMode === 'code') onCodeDetectionChange?.(codeDetection)
  }, [codeDetection, displayedEditorMode, onCodeDetectionChange, preview])
  const documentStats = useMemo(() => calculateTextStats(deferredStatsText), [deferredStatsText])
  const setPlainTextRef = useCallback(node => {
    const previousNode = plainTextRef.current
    plainTextRef.current = node
    if (node) {
      textAreaRef.current = node
      onEditorReady?.()
    } else if (textAreaRef.current === previousNode) {
      textAreaRef.current = null
    }
  }, [onEditorReady, textAreaRef])

  const clearScrollbarCursor = useCallback(() => {
    const cursorState = scrollbarCursorTargetRef.current
    if (!cursorState) return
    if (cursorState.value) cursorState.element.style.setProperty('cursor', cursorState.value, cursorState.priority)
    else cursorState.element.style.removeProperty('cursor')
    scrollbarCursorTargetRef.current = null
  }, [])

  const handleEditorMouseMove = useCallback(event => {
    const root = editorPaneRef.current
    if (!root) return
    const eventTarget = event.target?.nodeType === 1 ? event.target : event.target?.parentElement
    const scrollbarTarget = findScrollbarUnderPointer(root, eventTarget, event.clientX, event.clientY)
    if (scrollbarCursorTargetRef.current?.element === scrollbarTarget) return
    clearScrollbarCursor()
    if (!scrollbarTarget) return
    scrollbarCursorTargetRef.current = {
      element: scrollbarTarget,
      priority: scrollbarTarget.style.getPropertyPriority('cursor'),
      value: scrollbarTarget.style.getPropertyValue('cursor')
    }
    scrollbarTarget.style.setProperty('cursor', 'default', 'important')
  }, [clearScrollbarCursor])

  useEffect(() => () => clearScrollbarCursor(), [clearScrollbarCursor])

  useEffect(() => {
    if (editorMode !== 'text') return undefined
    const textArea = plainTextRef.current
    if (!textArea) return undefined
    let scheduledFrame = 0
    let trackingFrame = 0
    const syncCaretPosition = () => {
      const nextLine = getEditorCurrentLine(textArea)
      setCurrentLine(current => current === nextLine ? current : nextLine)
    }
    const scheduleCaretSync = () => {
      window.cancelAnimationFrame(scheduledFrame)
      scheduledFrame = window.requestAnimationFrame(syncCaretPosition)
    }
    const trackFocusedCaret = () => {
      syncCaretPosition()
      if (document.activeElement === textArea) {
        trackingFrame = window.requestAnimationFrame(trackFocusedCaret)
      }
    }
    const startCaretTracking = () => {
      window.cancelAnimationFrame(trackingFrame)
      syncCaretPosition()
      trackingFrame = window.requestAnimationFrame(trackFocusedCaret)
    }
    const stopCaretTracking = () => {
      window.cancelAnimationFrame(trackingFrame)
    }
    textArea.addEventListener('select', syncCaretPosition)
    textArea.addEventListener('selectionchange', syncCaretPosition)
    textArea.addEventListener('keyup', syncCaretPosition)
    textArea.addEventListener('pointerup', syncCaretPosition)
    textArea.addEventListener('input', syncCaretPosition)
    textArea.addEventListener('focus', startCaretTracking)
    textArea.addEventListener('blur', stopCaretTracking)
    textArea.addEventListener('keydown', scheduleCaretSync)
    document.addEventListener('selectionchange', syncCaretPosition)
    scheduleCaretSync()
    if (document.activeElement === textArea) startCaretTracking()
    return () => {
      window.cancelAnimationFrame(scheduledFrame)
      window.cancelAnimationFrame(trackingFrame)
      textArea.removeEventListener('select', syncCaretPosition)
      textArea.removeEventListener('selectionchange', syncCaretPosition)
      textArea.removeEventListener('keyup', syncCaretPosition)
      textArea.removeEventListener('pointerup', syncCaretPosition)
      textArea.removeEventListener('input', syncCaretPosition)
      textArea.removeEventListener('focus', startCaretTracking)
      textArea.removeEventListener('blur', stopCaretTracking)
      textArea.removeEventListener('keydown', scheduleCaretSync)
      document.removeEventListener('selectionchange', syncCaretPosition)
    }
  }, [editorMode])

  useEffect(() => setEditorScrollTop(0), [editorMode])

  return (
    <Box
      ref={editorPaneRef}
      id="guide-editor"
      onMouseMoveCapture={handleEditorMouseMove}
      onMouseLeave={clearScrollbarCursor}
      sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', bgcolor: editorBackground, backgroundImage: 'none', color: editorForeground }}
    >
      {searchPanel}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {preview ? (
        <Box
          ref={previewScrollRef}
          role="region"
          aria-label={t(language, 'editor.historyPreview')}
          onPointerDown={event => {
            event.preventDefault()
            onPreviewDismiss?.()
            requestAnimationFrame(() => textAreaRef.current?.focus())
          }}
          onWheel={onWheel}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 2,
            pb: 2,
            bgcolor: editorBackground,
            color: editorForeground,
            userSelect: 'none',
            cursor: 'default',
            '&:focus': { outline: 'none' }
          }}
        >
          <Box sx={{ height: 22, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, color: 'text.secondary' }}>
            <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
            <Typography variant="caption">{t(language, 'editor.readOnlyPreview')}</Typography>
          </Box>
          {preview.title ? (
            <Box component="h1" sx={{ m: 0, mb: 1.5, fontFamily: contentFontFamily, fontSize: 18 * zoom / 100, lineHeight: 1.35, fontWeight: 700, overflowWrap: 'anywhere' }}>
              {preview.title}
            </Box>
          ) : null}
          {preview.editorMode === 'markdown' ? (
            <Suspense fallback={<CodeLoading embedded language={language} />}>
              <MarkdownEditor
                embedded
                language={language}
                preserveGutter
                readOnly
                maxLength={MAX_TEXT_LENGTH}
                onChange={() => {}}
                text={preview.content || t(language, 'editor.noContent')}
                zoom={zoom}
              />
            </Suspense>
          ) : preview.editorMode === 'code' ? (
            <Suspense fallback={<MarkdownLoading embedded language={language} />}>
              <CodeEditor
                codeLanguage={effectiveCodeLanguage}
                contentFontFamily={contentFontFamily}
                embedded
                readOnly
                text={preview.content || t(language, 'editor.noContent')}
                wordWrap={wordWrap}
                zoom={zoom}
              />
            </Suspense>
          ) : (
            <Box component="pre" sx={{ m: 0, pl: `${EDITOR_GUTTER_WIDTH}px`, fontFamily: contentFontFamily, fontSize: EDITOR_FONT_SIZE * zoom / 100, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {preview.content || t(language, 'editor.noContent')}
            </Box>
          )}
        </Box>
      ) : editorMode === 'markdown' ? (
        <Suspense fallback={<CodeLoading language={language} />}>
          <MarkdownEditor
            ref={textAreaRef}
            language={language}
            maxLength={MAX_TEXT_LENGTH}
            onChange={(value, metadata) => onChange({
              target: { value },
              undoMergeKey: metadata?.undoMergeKey,
              modeNormalization: metadata?.modeNormalization
            })}
            onCompositionEnd={onCompositionEnd}
            onCompositionStart={onCompositionStart}
            onCopyAll={onCopyAll}
            onKeyDown={onKeyDown}
            onReady={onEditorReady}
            onWheel={onWheel}
            text={text}
            zoom={zoom}
          />
        </Suspense>
      ) : editorMode === 'code' ? (
        <Suspense fallback={<MarkdownLoading language={language} />}>
          <CodeEditor
            ref={textAreaRef}
            codeLanguage={effectiveCodeLanguage}
            contentFontFamily={contentFontFamily}
            maxLength={MAX_TEXT_LENGTH}
            onChange={value => onChange({ target: { value } })}
            onCompositionEnd={onCompositionEnd}
            onCompositionStart={onCompositionStart}
            onKeyDown={onKeyDown}
            onReady={onEditorReady}
            onWheel={onWheel}
            placeholder={t(language, 'editor.placeholder')}
            text={text}
            wordWrap={wordWrap}
            zoom={zoom}
          />
        </Suspense>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative' }}>
          <LineNumberGutter
            contentFontFamily={contentFontFamily}
            currentLine={currentLine}
            editorRef={plainTextRef}
            scrollTop={editorScrollTop}
            text={text}
            wordWrap={wordWrap}
            zoom={zoom}
          />
          <Box
            aria-label={t(language, 'editor.aria')}
            component="textarea"
            ref={setPlainTextRef}
            value={text}
            wrap={wordWrap ? 'soft' : 'off'}
            maxLength={MAX_TEXT_LENGTH}
            onChange={onChange}
            onCompositionEnd={onCompositionEnd}
            onCompositionStart={onCompositionStart}
            onKeyDown={onKeyDown}
            onScroll={event => setEditorScrollTop(event.currentTarget.scrollTop)}
            onSelect={event => setCurrentLine(getEditorCurrentLine(event.currentTarget))}
            onWheel={onWheel}
            placeholder={t(language, 'editor.placeholder')}
            sx={{
              flex: 1,
              width: 'auto',
              minWidth: 0,
              height: '100%',
              boxSizing: 'border-box',
              border: 'none',
              outline: 'none',
              resize: 'none',
              p: 2,
              pb: 2,
              fontSize: EDITOR_FONT_SIZE * zoom / 100,
              lineHeight: 1.6,
              fontFamily: contentFontFamily,
              bgcolor: editorBackground,
              backgroundImage: 'none',
              color: editorForeground,
              caretColor: 'currentColor',
              transition: 'background-color 0.25s ease, color 0.25s ease',
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              overflowY: 'auto',
              overflowX: wordWrap ? 'hidden' : 'auto',
              '&::placeholder': { color: isDark ? 'rgba(235, 230, 220, 0.45)' : 'rgba(67, 52, 27, 0.45)' },
              '&::selection': {
                bgcolor: 'rgba(143, 181, 149, 0.38)'
              }
            }}
          />
        </Box>
        )}

        <StatusBar
          documentStats={documentStats}
          codeDetection={codeDetection}
          codeLanguage={displayedCodeLanguagePreference}
          editorMode={displayedEditorMode}
          encoding={preview ? 'utf8' : encoding}
          encodingCandidates={preview ? [] : fileState?.candidates}
          encodingConfidence={preview ? 1 : fileState?.confidence}
          fileName={preview ? '' : fileState?.name}
          filePath={preview ? '' : fileState?.path}
          language={language}
          lineEnding={preview ? 'lf' : lineEnding}
          onEditorModeChange={onEditorModeChange}
          onCodeLanguageChange={onCodeLanguageChange}
          onEncodingChange={onEncodingChange}
          onLineEndingChange={onLineEndingChange}
          onReloadWithEncoding={onReloadWithEncoding}
          onToggleSidebar={onToggleSidebar}
          onZoomChange={onZoomChange}
          readOnly={Boolean(preview)}
          sidebarExpanded={sidebarExpanded}
          sidebarShortcut={sidebarShortcut}
          zoom={zoom}
        />
        </Box>
        <EditorActionBar
          language={language}
          onFormatText={onFormatText}
          onOpenAiFormatting={onOpenAiFormatting}
          onOpenShareStudio={onOpenShareStudio}
          readOnly={Boolean(preview)}
        />
      </Box>
    </Box>
  )
}

export default memo(EditorPane)
