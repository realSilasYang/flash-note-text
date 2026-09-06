import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { EDITOR_FONT_SIZE, EDITOR_GUTTER_WIDTH } from '../constants'
import { countLines } from '../textMetrics'

const EDITOR_PADDING = 16
const MAX_MEASURED_LINES = 2000
const OVERSCAN_PX = 160

function findLineAtOffset (offsets, target) {
  let low = 0
  let high = offsets.length - 1

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (offsets[middle] <= target) low = middle
    else high = middle - 1
  }

  return Math.min(low, offsets.length - 2)
}

function LineNumberGutter ({ contentFontFamily, currentLine, editorRef, scrollTop, text, wordWrap, zoom }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const editorFontFamily = contentFontFamily || theme.typography.fontFamily
  const mirrorRef = useRef(null)
  const heightCacheRef = useRef({ signature: '', values: new Map() })
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 })
  const [measuredHeights, setMeasuredHeights] = useState([])
  const lineCount = useMemo(() => countLines(text), [text])
  const lines = useMemo(() => wordWrap ? String(text).split('\n') : [], [text, wordWrap])
  const fontSize = EDITOR_FONT_SIZE * zoom / 100
  const lineHeight = fontSize * 1.6
  const shouldMeasure = wordWrap && lineCount <= MAX_MEASURED_LINES
  const contentWidth = Math.max(0, editorSize.width - EDITOR_PADDING * 2)
  const estimatedHeights = useMemo(() => {
    if (!wordWrap || shouldMeasure || contentWidth <= 0 || typeof document === 'undefined') return []
    const context = document.createElement('canvas').getContext('2d')
    if (!context) return []
    context.font = `${fontSize}px ${editorFontFamily}`
    const usableWidth = Math.max(1, contentWidth)
    const signature = `${usableWidth}:${fontSize}:${editorFontFamily}`
    if (heightCacheRef.current.signature !== signature) {
      heightCacheRef.current = { signature, values: new Map() }
    }
    const cache = heightCacheRef.current.values
    const nextCache = new Map()
    const heights = lines.map(line => {
      const cached = cache.get(line)
      if (cached !== undefined) {
        nextCache.set(line, cached)
        return cached
      }
      const measuredWidth = context.measureText(line.replace(/\t/g, '        ') || ' ').width
      const height = Math.max(lineHeight, Math.ceil(measuredWidth / usableWidth) * lineHeight)
      nextCache.set(line, height)
      return height
    })
    heightCacheRef.current.values = nextCache
    return heights
  }, [contentWidth, editorFontFamily, fontSize, lineHeight, lines, shouldMeasure, wordWrap])

  useLayoutEffect(() => {
    let animationFrame = 0
    let observer
    let disposed = false

    const attachEditor = () => {
      if (disposed) return
      const editor = editorRef.current
      if (!(editor instanceof HTMLTextAreaElement)) {
        animationFrame = window.requestAnimationFrame(attachEditor)
        return
      }

      const updateSize = () => {
        setEditorSize(current => {
          const next = { width: editor.clientWidth, height: editor.clientHeight }
          return current.width === next.width && current.height === next.height ? current : next
        })
      }

      updateSize()
      if (typeof ResizeObserver === 'undefined') {
        window.addEventListener('resize', updateSize)
        observer = { disconnect: () => window.removeEventListener('resize', updateSize) }
        return
      }

      observer = new ResizeObserver(updateSize)
      observer.observe(editor)
    }

    attachEditor()
    return () => {
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      observer?.disconnect()
    }
  }, [editorRef])

  useLayoutEffect(() => {
    if (!shouldMeasure || contentWidth <= 0 || !mirrorRef.current) {
      setMeasuredHeights([])
      return
    }

    const nextHeights = Array.from(mirrorRef.current.children, child => (
      Math.max(lineHeight, child.getBoundingClientRect().height)
    ))
    setMeasuredHeights(current => (
      current.length === nextHeights.length && current.every((height, index) => Math.abs(height - nextHeights[index]) < 0.5)
        ? current
        : nextHeights
    ))
  }, [contentWidth, editorFontFamily, lineHeight, lines, shouldMeasure])

  useEffect(() => {
    if (!wordWrap) setMeasuredHeights([])
  }, [wordWrap])

  const offsets = useMemo(() => {
    const values = new Array(lineCount + 1)
    values[0] = 0
    for (let index = 0; index < lineCount; index += 1) {
      values[index + 1] = values[index] + (measuredHeights[index] || estimatedHeights[index] || lineHeight)
    }
    return values
  }, [estimatedHeights, lineCount, lineHeight, measuredHeights])

  const visibleRange = useMemo(() => {
    const contentTop = Math.max(0, scrollTop - EDITOR_PADDING - OVERSCAN_PX)
    const contentBottom = Math.max(0, scrollTop - EDITOR_PADDING + editorSize.height + OVERSCAN_PX)
    return {
      start: Math.max(0, findLineAtOffset(offsets, contentTop)),
      end: Math.min(lineCount - 1, findLineAtOffset(offsets, contentBottom) + 1)
    }
  }, [editorSize.height, lineCount, offsets, scrollTop])

  const visibleLines = []
  for (let index = visibleRange.start; index <= visibleRange.end; index += 1) visibleLines.push(index)

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'relative',
        width: EDITOR_GUTTER_WIDTH,
        flexShrink: 0,
        overflow: 'hidden',
        bgcolor: isDark ? '#2b2b2b' : '#FDFBF7',
        backgroundImage: 'none',
        userSelect: 'none',
        pointerEvents: 'none'
      }}
    >
      {visibleLines.map(index => (
        <Box
          key={index}
          component="span"
          sx={{
            position: 'absolute',
            top: EDITOR_PADDING + offsets[index] - scrollTop,
            right: 8,
            height: lineHeight,
            color: currentLine === index + 1
              ? (isDark ? '#E2E2E2' : '#43341B')
              : (isDark ? 'rgba(226, 226, 226, 0.42)' : 'rgba(67, 52, 27, 0.42)'),
            fontFamily: 'Consolas, "SFMono-Regular", monospace',
            fontSize: Math.max(10, fontSize * 0.86),
            fontWeight: currentLine === index + 1 ? 600 : 400,
            lineHeight: `${lineHeight}px`,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {index + 1}
        </Box>
      ))}

      {shouldMeasure && (
        <Box
          ref={mirrorRef}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: contentWidth,
            visibility: 'hidden',
            pointerEvents: 'none',
            fontFamily: editorFontFamily,
            fontSize,
            lineHeight: 1.6,
            tabSize: 8
          }}
        >
          {lines.map((line, index) => (
            <Box
              key={index}
              component="div"
              sx={{ minHeight: lineHeight, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
            >
              {line || '\u200b'}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default memo(LineNumberGutter)
