import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from './ActionTooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import SettingsIcon from '@mui/icons-material/Settings'
import SearchIcon from '@mui/icons-material/Search'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import SaveIcon from '@mui/icons-material/Save'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import { MAX_HISTORY_TITLE_LENGTH } from '../constants'
import {
  getHistoryEntryDisplayName,
  getHistoryEntryFullTitle,
  getHistoryPreviewHeading
} from '../historyPreview'
import { getHistorySearchSnippet, matchesHistoryEntry } from '../historySearch'
import { formatRelativeTime, t } from '../locales'

const HISTORY_CARD_ENTER_DURATION = 300
const HISTORY_CARD_EXIT_DURATION = 200
const HISTORY_CARD_MAX_HEIGHT = 80
const DIVIDER_DASH_LENGTH = 2
const DIVIDER_TARGET_PERIOD = 7
const SIDEBAR_TEXTURE = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`

function getFittedDividerPeriod (length) {
  const availableLength = length - DIVIDER_DASH_LENGTH
  if (availableLength <= 0) return DIVIDER_TARGET_PERIOD

  const intervalCount = Math.max(1, Math.round(availableLength / DIVIDER_TARGET_PERIOD))
  return availableLength / intervalCount
}

const HISTORY_RENDER_BATCH = 160
const HISTORY_SEARCH_BATCH = 24

function HighlightedSnippet ({ query, text }) {
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase()
  if (!normalizedQuery) return text
  const parts = []
  const normalizedText = text.toLocaleLowerCase()
  let cursor = 0
  let matchIndex = normalizedText.indexOf(normalizedQuery)
  while (matchIndex >= 0) {
    if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex))
    parts.push(
      <Box
        component="mark"
        key={`${matchIndex}-${parts.length}`}
        sx={{ bgcolor: 'rgba(230, 180, 80, 0.32)', color: 'inherit', borderRadius: 0.5, px: 0.15 }}
      >
        {text.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </Box>
    )
    cursor = matchIndex + normalizedQuery.length
    matchIndex = normalizedText.indexOf(normalizedQuery, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

function HistoryPanel ({
  autoSaveEntries,
  canCopy,
  canSave,
  expanded,
  history,
  latestCreatedHistoryId,
  language,
  selectedHistoryId,
  onCopy,
  onAutoSaveEntriesChange,
  onDelete,
  onOpenFile,
  onLoad,
  onNew,
  onOpenHelp,
  onOpenSettings,
  onPreviewChange,
  onPreviewWheel,
  onRename,
  onReorder,
  onResolveEntry,
  onRequestClear,
  onSave,
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const pointerVisualRef = useRef({ frame: null, target: null, x: 0, y: 0 })
  const actionsRef = useRef(null)
  const historySearchInputRef = useRef(null)
  const listRef = useRef(null)
  const dragItemRef = useRef(null)
  const dragSessionActiveRef = useRef(false)
  const pendingPointerDragRef = useRef(null)
  const pointerDragLogicRef = useRef(null)
  const dragPreviewAnimationRef = useRef(new Map())
  const dragTargetLayoutRef = useRef(null)
  const pendingDragPreviewLayoutRef = useRef(null)
  const dragFrameRef = useRef(null)
  const pendingDragPointRef = useRef(null)
  const dragPointerRef = useRef({ x: 0, y: 0 })
  const lastDragTargetRef = useRef(null)
  const dragSelectionStyleRef = useRef(null)
  const suppressNextClickRef = useRef(false)
  const suppressClickTimerRef = useRef(null)
  const dragOrderRef = useRef(null)
  const deleteAnimationTimersRef = useRef(new Map())
  const previewTimerRef = useRef(null)
  const previewHistoryIdRef = useRef(null)
  const previewModeActiveRef = useRef(false)
  const renameInputRef = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOrder, setDragOrder] = useState(null)
  const [exitingIds, setExitingIds] = useState(() => new Set())
  const [exitingEntries, setExitingEntries] = useState(() => new Map())
  const [hoveredHistoryId, setHoveredHistoryId] = useState(null)
  const [previewedHistoryId, setPreviewedHistoryId] = useState(null)
  const [historySearchOpen, setHistorySearchOpen] = useState(false)
  const [historySearchText, setHistorySearchText] = useState('')
  const [debouncedHistorySearchText, setDebouncedHistorySearchText] = useState('')
  const [searchedHistory, setSearchedHistory] = useState([])
  const [historySearchBusy, setHistorySearchBusy] = useState(false)
  const [visibleLimit, setVisibleLimit] = useState(HISTORY_RENDER_BATCH)
  const [renameState, setRenameState] = useState(null)
  const renamingId = renameState?.id || null
  const [, setClock] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setClock(value => value + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHistorySearchText(historySearchText), 150)
    return () => clearTimeout(timer)
  }, [historySearchText])

  useEffect(() => {
    if (!historySearchOpen) return undefined
    const frame = requestAnimationFrame(() => historySearchInputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [historySearchOpen])

  useLayoutEffect(() => {
    const actions = actionsRef.current
    if (!actions) return undefined

    const updateDividerPeriods = () => {
      const actionsWidth = actions.getBoundingClientRect().width
      actions.style.setProperty('--history-divider-x-period', `${getFittedDividerPeriod(actionsWidth)}px`)
    }

    updateDividerPeriods()
    const resizeObserver = new ResizeObserver(updateDividerPeriods)
    resizeObserver.observe(actions)
    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => () => {
    if (pointerVisualRef.current.frame !== null) cancelAnimationFrame(pointerVisualRef.current.frame)
    deleteAnimationTimersRef.current.forEach(timer => clearTimeout(timer))
    deleteAnimationTimersRef.current.clear()
    if (previewTimerRef.current !== null) clearTimeout(previewTimerRef.current)
  }, [])

  const cancelHistoryPreviewTimer = useCallback(() => {
    if (previewTimerRef.current !== null) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }, [])

  const showHistoryPreview = useCallback((item) => {
    const resolvedItem = onResolveEntry?.(item) || item
    previewModeActiveRef.current = true
    previewHistoryIdRef.current = item._id
    setPreviewedHistoryId(item._id)
    onPreviewChange?.({
      id: item._id,
      title: getHistoryPreviewHeading(item),
      content: resolvedItem.content || '',
      editorMode: item.editorMode,
      codeLanguage: item.codeLanguage
    })
  }, [onPreviewChange, onResolveEntry])

  const clearHistoryPreview = useCallback((resetMode = false) => {
    cancelHistoryPreviewTimer()
    previewHistoryIdRef.current = null
    setPreviewedHistoryId(null)
    if (resetMode) previewModeActiveRef.current = false
    onPreviewChange?.(null)
  }, [cancelHistoryPreviewTimer, onPreviewChange])

  const scheduleHistoryPreview = useCallback((item) => {
    cancelHistoryPreviewTimer()
    previewHistoryIdRef.current = item._id
    if (previewModeActiveRef.current) {
      showHistoryPreview(item)
      return
    }

    onPreviewChange?.(null)
    previewTimerRef.current = window.setTimeout(() => {
      previewTimerRef.current = null
      showHistoryPreview(item)
    }, 500)
  }, [cancelHistoryPreviewTimer, onPreviewChange, showHistoryPreview])

  useEffect(() => {
    if (selectedHistoryId && previewHistoryIdRef.current === selectedHistoryId) clearHistoryPreview()
  }, [clearHistoryPreview, selectedHistoryId])

  useLayoutEffect(() => {
    if (!selectedHistoryId) return
    const selectedCard = Array.from(listRef.current?.children || [])
      .find(element => element.dataset.historyId === selectedHistoryId)
    selectedCard?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [historySearchOpen, selectedHistoryId])

  const handleAnimatedDelete = useCallback((itemId) => {
    if (deleteAnimationTimersRef.current.has(itemId)) return
    const item = history.find(entry => entry._id === itemId)
    if (!item) return

    if (previewHistoryIdRef.current === itemId) {
      clearHistoryPreview()
    }

    setExitingIds(current => new Set(current).add(itemId))
    setExitingEntries(current => {
      const next = new Map(current)
      next.set(itemId, { item, index: history.findIndex(entry => entry._id === itemId) })
      return next
    })
    onDelete(itemId)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    const timer = window.setTimeout(() => {
      deleteAnimationTimersRef.current.delete(itemId)
      setExitingIds(current => {
        if (!current.has(itemId)) return current
        const next = new Set(current)
        next.delete(itemId)
        return next
      })
      setExitingEntries(current => {
        if (!current.has(itemId)) return current
        const next = new Map(current)
        next.delete(itemId)
        return next
      })
    }, reduceMotion ? 0 : HISTORY_CARD_EXIT_DURATION)
    deleteAnimationTimersRef.current.set(itemId, timer)
  }, [clearHistoryPreview, history, onDelete])

  const beginRename = useCallback((item) => {
    const card = Array.from(listRef.current?.children || []).find(element => element.dataset.historyId === item._id)
    setRenameState({
      id: item._id,
      value: getHistoryEntryDisplayName(item, language),
      height: card?.getBoundingClientRect().height || null
    })
  }, [language])

  useEffect(() => {
    if (!renamingId) return undefined
    const frame = requestAnimationFrame(() => renameInputRef.current?.select())
    return () => cancelAnimationFrame(frame)
  }, [renamingId])

  useEffect(() => {
    const handleHoveredShortcut = (event) => {
      if (!hoveredHistoryId || renamingId || draggingId || event.isComposing || event.repeat) return
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const item = history.find(entry => entry._id === hoveredHistoryId)
      if (!item) return

      if (event.key === 'F2') {
        event.preventDefault()
        event.stopPropagation()
        beginRename(item)
      } else if (event.key === 'Delete') {
        event.preventDefault()
        event.stopPropagation()
        handleAnimatedDelete(item._id)
      }
    }

    document.addEventListener('keydown', handleHoveredShortcut, true)
    return () => document.removeEventListener('keydown', handleHoveredShortcut, true)
  }, [beginRename, draggingId, handleAnimatedDelete, history, hoveredHistoryId, renamingId])

  useEffect(() => {
    if (hoveredHistoryId && !history.some(item => item._id === hoveredHistoryId)) setHoveredHistoryId(null)
    if (renamingId && !history.some(item => item._id === renamingId)) setRenameState(null)
  }, [history, hoveredHistoryId, renamingId])

  const finishRename = (save) => {
    if (!renameState) return
    const current = renameState
    setRenameState(null)
    if (save) onRename(current.id, current.value)
  }

  const schedulePointerVisual = (event) => {
    const visual = pointerVisualRef.current
    visual.target = event.currentTarget
    visual.x = event.clientX
    visual.y = event.clientY
    if (visual.frame !== null) return

    visual.frame = requestAnimationFrame(() => {
      visual.frame = null
      const { target, x, y } = pointerVisualRef.current
      if (!target?.isConnected) return
      const rect = target.getBoundingClientRect()
      target.style.setProperty('--x', `${x - rect.left}px`)
      target.style.setProperty('--y', `${y - rect.top}px`)
    })
  }

  const resetPointerVisual = (event) => {
    const target = event.currentTarget
    const visual = pointerVisualRef.current
    if (visual.target === target && visual.frame !== null) {
      cancelAnimationFrame(visual.frame)
      visual.frame = null
    }
    if (visual.target === target) visual.target = null
    target.style.removeProperty('--x')
    target.style.removeProperty('--y')
  }

  const closeHistorySearch = useCallback(() => {
    setHistorySearchOpen(false)
    setHistorySearchText('')
    setDebouncedHistorySearchText('')
  }, [])

  useEffect(() => {
    if (!historySearchOpen) return undefined
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closeHistorySearch()
    }
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [closeHistorySearch, historySearchOpen])

  const toggleHistorySearch = useCallback(() => {
    if (historySearchOpen) {
      closeHistorySearch()
      return
    }
    clearHistoryPreview(true)
    setHistorySearchOpen(true)
  }, [clearHistoryPreview, closeHistorySearch, historySearchOpen])

  const orderedHistory = useMemo(() => {
    if (!dragOrder) return history
    const byId = new Map(history.map(item => [item._id, item]))
    const ordered = dragOrder.map(id => byId.get(id)).filter(Boolean)
    const included = new Set(ordered.map(item => item._id))
    return [...ordered, ...history.filter(item => !included.has(item._id))]
  }, [dragOrder, history])

  const animatedHistory = useMemo(() => {
    if (exitingEntries.size === 0) return orderedHistory
    const next = [...orderedHistory]
    const snapshots = [...exitingEntries.values()].sort((left, right) => left.index - right.index)
    snapshots.forEach(({ item, index }) => {
      if (!next.some(entry => entry._id === item._id)) next.splice(Math.min(index, next.length), 0, item)
    })
    return next
  }, [exitingEntries, orderedHistory])

  useEffect(() => {
    const query = debouncedHistorySearchText.trim()
    if (!query) {
      setSearchedHistory([])
      setHistorySearchBusy(false)
      return undefined
    }
    const normalizedQuery = query.toLocaleLowerCase()

    let cancelled = false
    let timer = null
    let index = 0
    const matches = []
    setSearchedHistory([])
    setHistorySearchBusy(true)

    const processBatch = () => {
      if (cancelled) return
      const end = Math.min(orderedHistory.length, index + HISTORY_SEARCH_BATCH)
      for (; index < end; index++) {
        const item = orderedHistory[index]
        const resolvedItem = onResolveEntry?.(item) || item
        if (resolvedItem && matchesHistoryEntry(resolvedItem, normalizedQuery, true)) matches.push(resolvedItem)
      }
      if (index < orderedHistory.length) {
        timer = window.setTimeout(processBatch, 0)
        return
      }
      setSearchedHistory(matches)
      setHistorySearchBusy(false)
    }

    timer = window.setTimeout(processBatch, 0)
    return () => {
      cancelled = true
      if (timer !== null) clearTimeout(timer)
    }
  }, [debouncedHistorySearchText, onResolveEntry, orderedHistory])

  const visibleHistory = debouncedHistorySearchText.trim() ? searchedHistory : animatedHistory
  const renderedHistory = useMemo(
    () => visibleHistory.slice(0, visibleLimit),
    [visibleHistory, visibleLimit]
  )

  useEffect(() => {
    setVisibleLimit(HISTORY_RENDER_BATCH)
  }, [debouncedHistorySearchText])

  useEffect(() => {
    if (!selectedHistoryId) return
    const selectedIndex = visibleHistory.findIndex(item => item._id === selectedHistoryId)
    if (selectedIndex >= 0) {
      setVisibleLimit(current => Math.max(current, Math.min(visibleHistory.length, selectedIndex + 20)))
    }
  }, [selectedHistoryId, visibleHistory])

  useEffect(() => {
    if (!expanded && historySearchOpen) closeHistorySearch()
  }, [closeHistorySearch, expanded, historySearchOpen])

  useEffect(() => {
    if (history.length === 0 && historySearchOpen) closeHistorySearch()
  }, [closeHistorySearch, history.length, historySearchOpen])

  const lockDragSelection = () => {
    if (dragSelectionStyleRef.current) return
    const root = document.documentElement
    const body = document.body
    dragSelectionStyleRef.current = {
      rootUserSelect: root.style.userSelect,
      rootWebkitUserSelect: root.style.webkitUserSelect,
      bodyUserSelect: body?.style.userSelect || '',
      bodyWebkitUserSelect: body?.style.webkitUserSelect || ''
    }
    root.style.userSelect = 'none'
    root.style.webkitUserSelect = 'none'
    if (body) {
      body.style.userSelect = 'none'
      body.style.webkitUserSelect = 'none'
    }
    document.getSelection?.()?.removeAllRanges()
  }

  const unlockDragSelection = () => {
    const previous = dragSelectionStyleRef.current
    if (!previous) return
    const root = document.documentElement
    const body = document.body
    root.style.userSelect = previous.rootUserSelect
    root.style.webkitUserSelect = previous.rootWebkitUserSelect
    if (body) {
      body.style.userSelect = previous.bodyUserSelect
      body.style.webkitUserSelect = previous.bodyWebkitUserSelect
    }
    dragSelectionStyleRef.current = null
  }

  const cancelDragPreviewAnimation = () => {
    pendingDragPreviewLayoutRef.current = null
    dragPreviewAnimationRef.current.forEach(animation => animation.cancel())
    dragPreviewAnimationRef.current.clear()
  }

  const getDragItemLayoutRect = (element) => {
    const rect = element.getBoundingClientRect()
    if (!dragPreviewAnimationRef.current.has(element)) return rect
    const translate = window.getComputedStyle(element).translate
    if (!translate || translate === 'none') return rect
    const [rawX = '0', rawY = '0'] = translate.split(/\s+/)
    const translateX = Number.parseFloat(rawX) || 0
    const translateY = Number.parseFloat(rawY) || 0
    return {
      left: rect.left - translateX,
      right: rect.right - translateX,
      top: rect.top - translateY,
      bottom: rect.bottom - translateY,
      width: rect.width,
      height: rect.height
    }
  }

  const captureDragPreviewLayout = () => {
    const list = listRef.current
    if (!list) return null
    const elements = Array.from(list.querySelectorAll('[data-history-id]'))
    dragTargetLayoutRef.current = { list, elements }
    return {
      list,
      items: new Map(elements.map((element, index) => [element, { index, rect: element.getBoundingClientRect() }]))
    }
  }

  const animateDragPreviewLayout = (previousLayout) => {
    if (!previousLayout || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
    dragPreviewAnimationRef.current.forEach(animation => animation.cancel())
    dragPreviewAnimationRef.current.clear()
    if (!dragSessionActiveRef.current) return

    const currentElements = Array.from(previousLayout.list.querySelectorAll('[data-history-id]'))
    const currentIndexes = new Map(currentElements.map((element, index) => [element, index]))
    previousLayout.items.forEach(({ index: previousIndex, rect: previousRect }, element) => {
      if (!element.isConnected) return
      const currentIndex = currentIndexes.get(element)
      if (currentIndex == null || currentIndex === previousIndex) return
      const currentRect = element.getBoundingClientRect()
      const deltaX = previousRect.left - currentRect.left
      const deltaY = previousRect.top - currentRect.top
      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return
      try {
        const animation = element.animate([
          { translate: `${deltaX}px ${deltaY}px` },
          { translate: '0px 0px' }
        ], { duration: 160, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
        dragPreviewAnimationRef.current.set(element, animation)
        const clearAnimation = () => {
          if (dragPreviewAnimationRef.current.get(element) === animation) dragPreviewAnimationRef.current.delete(element)
        }
        animation.onfinish = clearAnimation
        animation.oncancel = clearAnimation
      } catch {}
    })
  }

  useLayoutEffect(() => {
    const previousLayout = pendingDragPreviewLayoutRef.current
    pendingDragPreviewLayoutRef.current = null
    animateDragPreviewLayout(previousLayout)
  }, [dragOrder])

  const cancelDragFrame = () => {
    if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current)
    dragFrameRef.current = null
    pendingDragPointRef.current = null
  }

  const stopDragSession = () => {
    dragSessionActiveRef.current = false
    cancelDragFrame()
    cancelDragPreviewAnimation()
    pendingPointerDragRef.current = null
    dragItemRef.current = null
    dragTargetLayoutRef.current = null
    dragOrderRef.current = null
    lastDragTargetRef.current = null
    setDraggingId(null)
    setDragOrder(null)
    unlockDragSelection()
  }

  const getDragTargetFromPoint = (x, y) => {
    const list = listRef.current
    const dragged = dragItemRef.current
    if (!list || !dragged || !Number.isFinite(x) || !Number.isFinite(y)) return null
    const listRect = list.getBoundingClientRect()
    if (x < listRect.left || x > listRect.right || y < listRect.top || y > listRect.bottom) return null

    const selector = '[data-history-id]'
    const isDragged = element => element?.getAttribute('data-history-id') === String(dragged.id)
    const pointElements = typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(x, y)
      : [document.elementFromPoint(x, y)].filter(Boolean)
    const direct = pointElements
      .map(element => element?.closest?.(selector))
      .find(element => element && list.contains(element) && !isDragged(element))

    const resolveTarget = (target) => {
      if (!target || !list.contains(target) || isDragged(target)) return null
      const rect = getDragItemLayoutRect(target)
      if (rect.width <= 0 || rect.height <= 0 || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null
      const targetId = target.getAttribute('data-history-id')
      const initialOrder = dragged.initialOrder
      const sourceIndex = initialOrder.indexOf(String(dragged.id))
      const targetIndex = initialOrder.indexOf(String(targetId))
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return null

      const direction = dragged.direction || (targetIndex < sourceIndex ? 'up' : 'down')
      const threshold = 10
      if (direction === 'up') {
        if (y > rect.bottom - threshold) return null
        return { id: targetId, placement: 'before' }
      }
      if (y < rect.top + threshold) return null
      return { id: targetId, placement: 'after' }
    }

    const directTarget = resolveTarget(direct)
    if (directTarget) return directTarget
    const cachedLayout = dragTargetLayoutRef.current?.list === list
      ? dragTargetLayoutRef.current
      : null
    const elements = cachedLayout?.elements || Array.from(list.querySelectorAll(selector))
    if (!cachedLayout) dragTargetLayoutRef.current = { list, elements }
    const coveredTarget = elements
      .filter(element => element?.isConnected && !isDragged(element))
      .map(element => ({ element, rect: getDragItemLayoutRect(element) }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
      .sort((left, right) => (left.rect.width * left.rect.height) - (right.rect.width * right.rect.height))[0]?.element
    return resolveTarget(coveredTarget)
  }

  const applyLiveDragSort = (targetId, placement) => {
    const dragged = dragItemRef.current
    const currentOrder = dragOrderRef.current
    if (!dragged || !currentOrder || String(targetId) === String(dragged.id)) return
    const targetKey = `${targetId}:${placement}`
    if (lastDragTargetRef.current === targetKey) return

    const sourceIndex = currentOrder.indexOf(String(dragged.id))
    if (sourceIndex < 0) return
    const nextOrder = [...currentOrder]
    nextOrder.splice(sourceIndex, 1)
    const targetIndex = nextOrder.indexOf(String(targetId))
    if (targetIndex < 0) return
    const insertionIndex = targetIndex + (placement === 'after' ? 1 : 0)
    nextOrder.splice(insertionIndex, 0, String(dragged.id))
    if (nextOrder.every((id, index) => id === currentOrder[index])) return

    lastDragTargetRef.current = targetKey
    pendingDragPreviewLayoutRef.current = captureDragPreviewLayout()
    dragOrderRef.current = nextOrder
    setDragOrder(nextOrder)
  }

  const requestDragFrame = () => {
    if (!dragSessionActiveRef.current || dragFrameRef.current !== null) return
    dragFrameRef.current = requestAnimationFrame(() => {
      dragFrameRef.current = null
      if (!dragSessionActiveRef.current) return
      const point = pendingDragPointRef.current || dragPointerRef.current
      pendingDragPointRef.current = null
      const target = getDragTargetFromPoint(point.x, point.y)
      if (target) applyLiveDragSort(target.id, target.placement)
      else lastDragTargetRef.current = null

      const list = listRef.current
      if (!list) return
      const rect = list.getBoundingClientRect()
      if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom) return
      const threshold = 60
      const speedForDistance = distance => distance >= threshold ? 0 : Math.round(16 * (1 - Math.max(0, distance) / threshold) ** 2)
      const topSpeed = speedForDistance(point.y - rect.top)
      const bottomSpeed = speedForDistance(rect.bottom - point.y)
      const speed = topSpeed > 0 ? -topSpeed : bottomSpeed
      if (!speed) return
      const previousScrollTop = list.scrollTop
      list.scrollTop += speed
      if (list.scrollTop !== previousScrollTop) {
        pendingDragPointRef.current = point
        requestDragFrame()
      }
    })
  }

  const scheduleDragTargetFromPoint = (x, y) => {
    if (!dragSessionActiveRef.current) return
    dragPointerRef.current = { x, y }
    pendingDragPointRef.current = { x, y }
    requestDragFrame()
  }

  const startDragSession = (event, pending) => {
    const initialOrder = history.map(item => String(item._id))
    dragSessionActiveRef.current = true
    dragOrderRef.current = initialOrder
    dragPointerRef.current = { x: event.clientX, y: event.clientY }
    dragItemRef.current = {
      id: String(pending.id),
      initialOrder,
      direction: null,
      directionAnchorY: event.clientY
    }
    pending.target?.style.removeProperty('--x')
    pending.target?.style.removeProperty('--y')
    setDragOrder(initialOrder)
    setDraggingId(String(pending.id))
    dragTargetLayoutRef.current = null
  }

  const handlePointerDragStart = (event, id, dragTarget = event.currentTarget) => {
    if (event.button !== 0 || event.isPrimary === false || dragSessionActiveRef.current) return
    if (event.target?.closest?.('.MuiIconButton-root, input, textarea, select, [contenteditable="true"]')) return
    lockDragSelection()
    pendingPointerDragRef.current = {
      id: String(id),
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      target: dragTarget,
      dragging: false
    }
  }

  useEffect(() => {
    pointerDragLogicRef.current = {
      applyLiveDragSort,
      getDragTargetFromPoint,
      onReorder,
      requestDragFrame,
      scheduleDragTargetFromPoint,
      startDragSession,
      stopDragSession
    }
  })

  useEffect(() => {
    const handlePointerMove = (event) => {
      const pending = pendingPointerDragRef.current
      if (!pending || event.pointerId !== pending.pointerId) return
      const distance = Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY)
      if (!pending.dragging) {
        if (distance < 12) return
        pending.dragging = true
        pointerDragLogicRef.current?.startDragSession(event, pending)
        try { pending.target?.setPointerCapture?.(pending.pointerId) } catch {}
      }
      if (!dragSessionActiveRef.current) return
      if (event.cancelable) event.preventDefault()
      document.getSelection?.()?.removeAllRanges()
      const dragged = dragItemRef.current
      const directionDelta = event.clientY - (dragged?.directionAnchorY ?? event.clientY)
      if (dragged && Math.abs(directionDelta) >= 3) {
        dragged.direction = directionDelta > 0 ? 'down' : 'up'
        dragged.directionAnchorY = event.clientY
      }
      pointerDragLogicRef.current?.scheduleDragTargetFromPoint(event.clientX, event.clientY)
    }

    const finishPointerDrag = (event, cancelled = false) => {
      const pending = pendingPointerDragRef.current
      if (!pending || event.pointerId !== pending.pointerId) return
      pendingPointerDragRef.current = null
      if (!pending.dragging) {
        unlockDragSelection()
        return
      }

      if (event.cancelable) event.preventDefault()
      const target = pointerDragLogicRef.current?.getDragTargetFromPoint(event.clientX, event.clientY)
      if (!cancelled && target) pointerDragLogicRef.current?.applyLiveDragSort(target.id, target.placement)
      const finalOrder = dragOrderRef.current ? [...dragOrderRef.current] : null
      const initialOrder = dragItemRef.current?.initialOrder || []
      try { pending.target?.releasePointerCapture?.(pending.pointerId) } catch {}
      pointerDragLogicRef.current?.stopDragSession()

      if (!cancelled && finalOrder && finalOrder.some((id, index) => id !== initialOrder[index])) {
        pointerDragLogicRef.current?.onReorder(finalOrder)
      }
      suppressNextClickRef.current = true
      if (suppressClickTimerRef.current !== null) clearTimeout(suppressClickTimerRef.current)
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressNextClickRef.current = false
        suppressClickTimerRef.current = null
      }, 80)
    }

    const handleSuppressedClick = (event) => {
      if (!suppressNextClickRef.current) return
      suppressNextClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
    }
    const handleSelectStart = (event) => {
      if (!pendingPointerDragRef.current && !dragSessionActiveRef.current) return
      event.preventDefault()
      event.stopPropagation()
    }
    const handleNativeDragStart = (event) => {
      if (!pendingPointerDragRef.current && !dragSessionActiveRef.current) return
      event.preventDefault()
      event.stopPropagation()
    }
    const handleWheel = (event) => {
      if (!dragSessionActiveRef.current || !listRef.current) return
      const rect = listRef.current.getBoundingClientRect()
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return
      event.preventDefault()
      event.stopPropagation()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? listRef.current.clientHeight : 1
      listRef.current.scrollTop += event.deltaY * unit
      pointerDragLogicRef.current?.scheduleDragTargetFromPoint(event.clientX, event.clientY)
    }
    const handleWindowBlur = () => {
      if (dragSessionActiveRef.current) pointerDragLogicRef.current?.stopDragSession()
      else {
        pendingPointerDragRef.current = null
        unlockDragSelection()
      }
    }
    const handlePointerUp = event => finishPointerDrag(event, false)
    const handlePointerCancel = event => finishPointerDrag(event, true)

    window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: false })
    window.addEventListener('pointerup', handlePointerUp, true)
    window.addEventListener('pointercancel', handlePointerCancel, true)
    window.addEventListener('click', handleSuppressedClick, true)
    window.addEventListener('selectstart', handleSelectStart, true)
    window.addEventListener('dragstart', handleNativeDragStart, true)
    window.addEventListener('wheel', handleWheel, { capture: true, passive: false })
    window.addEventListener('blur', handleWindowBlur)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove, { capture: true })
      window.removeEventListener('pointerup', handlePointerUp, true)
      window.removeEventListener('pointercancel', handlePointerCancel, true)
      window.removeEventListener('click', handleSuppressedClick, true)
      window.removeEventListener('selectstart', handleSelectStart, true)
      window.removeEventListener('dragstart', handleNativeDragStart, true)
      window.removeEventListener('wheel', handleWheel, { capture: true })
      window.removeEventListener('blur', handleWindowBlur)
      cancelDragFrame()
      cancelDragPreviewAnimation()
      unlockDragSelection()
      if (suppressClickTimerRef.current !== null) clearTimeout(suppressClickTimerRef.current)
    }
  }, [])

  return (
    <Box
      id="feature-sidebar"
      aria-hidden={!expanded}
      sx={{
        width: expanded ? '20%' : 0,
        minWidth: expanded ? 180 : 0,
        maxWidth: expanded ? 240 : 0,
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#303133' : '#F3F0E8',
        backgroundImage: SIDEBAR_TEXTURE,
        backgroundRepeat: 'repeat',
        overflow: 'hidden',
        opacity: expanded ? 1 : 0,
        visibility: expanded ? 'visible' : 'hidden',
        pointerEvents: expanded ? 'auto' : 'none',
        transition: expanded
          ? 'width 180ms ease, min-width 180ms ease, max-width 180ms ease, opacity 140ms ease'
          : 'width 180ms ease, min-width 180ms ease, max-width 180ms ease, opacity 120ms ease, visibility 0s linear 180ms',
      }}
    >
      <Box
        ref={actionsRef}
        id="guide-sidebar-actions"
        className="history-actions"
        sx={{
          px: 1.25,
          py: 1,
          display: 'flex',
          gap: 0.5,
          flexWrap: 'nowrap',
          justifyContent: 'space-between',
          bgcolor: 'transparent',
          backgroundImage: isDark
            ? 'linear-gradient(to right, rgba(255, 255, 255, 0.15) 2px, transparent 2px)'
            : 'linear-gradient(to right, rgba(67, 52, 27, 0.15) 2px, transparent 2px)',
          backgroundSize: 'var(--history-divider-x-period, 7px) 1px',
          backgroundPosition: 'left bottom',
          backgroundRepeat: 'repeat-x',
          '& .MuiIconButton-root': {
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(67,52,27,0.1)',
            borderRadius: 2,
            width: 32,
            height: 32
          }
        }}
      >
        <Tooltip title={t(language, 'sidebar.autoSaveEntries')}>
          <IconButton
            aria-label={t(language, 'sidebar.autoSaveEntries')}
            aria-pressed={autoSaveEntries}
            size="small"
            onClick={() => onAutoSaveEntriesChange(!autoSaveEntries)}
            sx={autoSaveEntries ? { bgcolor: 'action.selected', color: 'primary.main' } : undefined}
          >
            {autoSaveEntries
              ? <CloudDoneOutlinedIcon fontSize="small" />
              : <CloudOffOutlinedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t(language, 'history.search')}>
          <IconButton
            aria-label={t(language, 'history.search')}
            size="small"
            onClick={toggleHistorySearch}
            sx={historySearchOpen ? { bgcolor: 'action.selected', color: 'primary.main' } : undefined}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t(language, 'history.newEntryShortcut')}>
          <IconButton
            aria-label={t(language, 'history.newEntry')}
            size="small"
            onClick={() => {
              if (historySearchOpen) closeHistorySearch()
              onNew()
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t(language, 'history.copyText')}>
          <span>
            <IconButton aria-label={t(language, 'history.copyText')} size="small" onClick={onCopy} disabled={!canCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Collapse in={historySearchOpen} timeout={160} unmountOnExit>
        <Box sx={{ px: 1.25, py: 0.75 }}>
          <Box
            sx={{
              height: 34,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.75,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'action.hover'
            }}
          >
            <SearchIcon sx={{ flexShrink: 0, fontSize: 18, color: 'text.secondary' }} />
            <InputBase
              inputRef={historySearchInputRef}
              inputProps={{ 'aria-label': t(language, 'history.searchScope') }}
              placeholder={t(language, 'history.search')}
              value={historySearchText}
              onChange={event => setHistorySearchText(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  event.stopPropagation()
                  closeHistorySearch()
                } else if (event.key === 'Enter') {
                  if (historySearchBusy) return
                  const firstMatch = visibleHistory[0]
                  if (firstMatch) {
                    event.preventDefault()
                    onLoad(firstMatch)
                    closeHistorySearch()
                  }
                }
              }}
              sx={{ flex: 1, minWidth: 0, fontSize: '0.875rem' }}
            />
            <IconButton
              aria-label={t(language, 'history.closeSearch')}
              size="small"
              onClick={closeHistorySearch}
              sx={{ p: 0.25 }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </Collapse>

      <Box sx={{ px: 1.5, height: 44, minHeight: 44, maxHeight: 44, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0, fontSize: 14, fontWeight: 600 }}>
          {historySearchOpen && debouncedHistorySearchText.trim()
            ? historySearchBusy
              ? t(language, 'history.searching')
              : t(language, 'history.results', { visible: visibleHistory.length, total: history.length })
            : t(language, 'history.title')}
        </Typography>
        <Tooltip title={t(language, historySearchOpen ? 'history.clearAll' : 'history.clear')} disableHoverListener={history.length === 0}>
          <span>
            <IconButton
              aria-label={t(language, 'history.clear')}
              size="small"
              disabled={history.length === 0}
              onClick={onRequestClear}
              sx={{
                visibility: history.length > 0 ? 'visible' : 'hidden',
                p: 0.25,
                color: 'text.secondary',
                opacity: 0.6,
                transform: 'none',
                transition: 'color 120ms ease, opacity 120ms ease',
                '&:hover': { color: 'error.main', opacity: 1, transform: 'none' },
                '&:active': { transform: 'none' }
              }}
            >
              <DeleteSweepIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <List
        ref={listRef}
        id="guide-history-list"
        aria-label={t(language, 'history.title')}
        aria-busy={historySearchBusy}
        onPointerLeave={() => clearHistoryPreview(true)}
        onScroll={event => {
          const list = event.currentTarget
          if (list.scrollHeight - list.scrollTop - list.clientHeight < 420) {
            setVisibleLimit(current => Math.min(visibleHistory.length, current + HISTORY_RENDER_BATCH))
          }
        }}
        sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 0.75, py: 0.25 }}
      >
        {history.length === 0 ? (
          <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
            {t(language, 'history.noHistory')}
          </Typography>
        ) : historySearchBusy ? (
          <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
            {t(language, 'history.searchingFull')}
          </Typography>
        ) : visibleHistory.length === 0 ? (
          <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
            {t(language, 'history.noMatching')}
          </Typography>
        ) : renderedHistory.map((item, index) => {
          const fullTitle = getHistoryEntryFullTitle(item, language)
          const displayName = getHistoryEntryDisplayName(item, language)
          const searchSnippet = debouncedHistorySearchText.trim()
            ? getHistorySearchSnippet(item, debouncedHistorySearchText)
            : ''
          const isSelected = selectedHistoryId === item._id
          const isPreviewed = previewedHistoryId === item._id
          const isDragging = draggingId === item._id
          const isEntering = latestCreatedHistoryId === item._id
          const isExiting = exitingIds.has(item._id)
          const isRenaming = renamingId === item._id
          return (
            <ListItem
              key={item._id}
              data-history-id={item._id}
              draggable={false}
              disablePadding
              onPointerEnter={() => {
                setHoveredHistoryId(item._id)
                if (isSelected) clearHistoryPreview()
                else scheduleHistoryPreview(item)
              }}
              onPointerLeave={() => {
                setHoveredHistoryId(current => current === item._id ? null : current)
                clearHistoryPreview()
              }}
              onWheel={event => {
                if (previewTimerRef.current === null && previewHistoryIdRef.current === item._id) onPreviewWheel?.(event)
              }}
              sx={{
                mb: 0.25,
                height: isRenaming && renameState.height ? `${renameState.height}px` : 'auto',
                maxHeight: HISTORY_CARD_MAX_HEIGHT,
                boxSizing: 'border-box',
                borderRadius: '8px',
                border: isDragging
                  ? (index === history.findIndex(entry => entry._id === item._id)
                      ? (isDark ? '2px dashed rgba(255,255,255,0.2)' : '2px dashed rgba(0,0,0,0.2)')
                      : (isDark ? '2px dashed #8FB595' : '2px dashed #5D7C66'))
                  : '2px solid transparent',
                cursor: isRenaming ? 'text' : historySearchOpen ? 'default' : isDragging ? 'grabbing' : 'grab',
                contentVisibility: draggingId || isEntering || isExiting ? 'visible' : 'auto',
                containIntrinsicSize: '0 64px',
                position: 'relative',
                overflow: isEntering || isExiting || isRenaming ? 'hidden' : 'visible',
                pointerEvents: isExiting ? 'none' : 'auto',
                transformStyle: 'preserve-3d',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  zIndex: 2,
                  pointerEvents: 'none',
                  inset: 0,
                  border: '1px dashed rgba(106, 141, 157, 0.72)',
                  borderRadius: '8px',
                  opacity: isPreviewed && !isSelected && !isDragging ? 1 : 0,
                  transition: 'opacity 120ms ease'
                },
                animation: isExiting
                  ? `historyCardExit ${HISTORY_CARD_EXIT_DURATION}ms cubic-bezier(0.4, 0, 1, 1) forwards`
                  : isEntering
                    ? `historyCardEnter ${HISTORY_CARD_ENTER_DURATION}ms cubic-bezier(0.2, 0, 0, 1) both`
                    : 'none',
                '@keyframes historyCardEnter': {
                  from: { opacity: 0, transform: 'translateY(-8px) scale(0.98)', maxHeight: 0, marginBottom: 0 },
                  to: { opacity: 1, transform: 'translateY(0) scale(1)', maxHeight: HISTORY_CARD_MAX_HEIGHT, marginBottom: '2px' }
                },
                '@keyframes historyCardExit': {
                  '0%': { opacity: 1, transform: 'translateX(0)', maxHeight: HISTORY_CARD_MAX_HEIGHT, marginBottom: '2px' },
                  '60%': { opacity: 0, transform: 'translateX(16px)', maxHeight: HISTORY_CARD_MAX_HEIGHT, marginBottom: '2px' },
                  '100%': { opacity: 0, transform: 'translateX(24px)', maxHeight: 0, marginBottom: 0 }
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                transition: isDragging
                  ? 'opacity 120ms ease, transform 160ms ease, box-shadow 160ms ease'
                  : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                ...(isDragging && {
                  opacity: 0.8,
                  transform: 'scale(0.95) rotate(-1deg)',
                  boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(67, 52, 27, 0.2)',
                  zIndex: 100
                }),
                '& .history-delete': {
                  position: 'absolute',
                  zIndex: 3,
                  right: 4,
                  top: '50%',
                  opacity: 0,
                  pointerEvents: 'none',
                  transform: 'translateY(-50%)',
                  transition: 'opacity 120ms ease'
                },
                ...(!isDragging && {
                  '&:hover .history-delete, &:focus-within .history-delete': {
                    opacity: 0.65,
                    pointerEvents: 'auto'
                  }
                })
              }}
            >
              <ListItemButton
                component="div"
                role="button"
                tabIndex={0}
                selected={isSelected}
                aria-selected={isSelected}
                disableRipple={isDragging}
                aria-keyshortcuts="F2 Delete Alt+ArrowUp Alt+ArrowDown"
                onClick={() => {
                  onLoad(item)
                  if (historySearchOpen) closeHistorySearch()
                }}
                onPointerDown={event => {
                  if (!historySearchOpen && !isExiting && !isRenaming) {
                    handlePointerDragStart(event, item._id, event.currentTarget.closest('[data-history-id]'))
                  }
                }}
                onMouseMove={event => {
                  if (!dragSessionActiveRef.current) schedulePointerVisual(event)
                }}
                onMouseLeave={resetPointerVisual}
                onKeyDown={event => {
                  if (isRenaming || event.isComposing) return
                  if (event.key === 'F2') {
                    event.preventDefault()
                    beginRename(item)
                    return
                  }
                  if (event.key === 'Delete') {
                    event.preventDefault()
                    handleAnimatedDelete(item._id)
                    return
                  }
                  if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown') && !historySearchOpen) {
                    event.preventDefault()
                    const ids = orderedHistory.map(entry => entry._id)
                    const currentIndex = ids.indexOf(item._id)
                    const nextIndex = event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1
                    if (currentIndex >= 0 && nextIndex >= 0 && nextIndex < ids.length) {
                      const movedId = ids[currentIndex]
                      ids[currentIndex] = ids[nextIndex]
                      ids[nextIndex] = movedId
                      onReorder(ids)
                      requestAnimationFrame(() => {
                        const card = Array.from(listRef.current?.children || []).find(element => element.dataset.historyId === item._id)
                        card?.querySelector('[role="button"]')?.focus()
                      })
                    }
                    return
                  }
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onLoad(item)
                    if (historySearchOpen) closeHistorySearch()
                  }
                }}
                sx={{
                  py: 0.55,
                  pl: 0.8,
                  pr: 4,
                  height: isRenaming ? '100%' : 'auto',
                  boxSizing: 'border-box',
                  borderRadius: '8px',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(67, 52, 27, 0.05)'}, transparent 60%)`,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none'
                  },
                  '&:hover::before': { opacity: isDragging ? 0 : 1 },
                  transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': { bgcolor: isDragging ? 'transparent' : 'rgba(143, 181, 149, 0.15)' },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(93, 124, 102, 0.15)',
                    color: 'primary.main',
                    fontWeight: 'bold',
                    border: '1px solid #8FB595',
                    boxShadow: '0 0 8px rgba(143, 181, 149, 0.4)',
                    '&:hover': { bgcolor: 'rgba(143, 181, 149, 0.25)' }
                  },
                  ...(isPreviewed && !isSelected && {
                    bgcolor: isDark ? 'rgba(106, 141, 157, 0.16)' : 'rgba(106, 141, 157, 0.11)'
                  }),
                  '& .MuiListItemText-root, & .history-title': { position: 'relative', zIndex: 1 }
                }}
              >
                <Box className="history-title" sx={{ flex: 1, minWidth: 0 }}>
                    {isRenaming ? (
                      <Box sx={{ my: 0.15, minWidth: 0 }} onClick={event => event.stopPropagation()}>
                        <InputBase
                          inputRef={renameInputRef}
                          value={renameState.value}
                          fullWidth
                          multiline
                          minRows={1}
                          maxRows={2}
                          inputProps={{
                            'aria-label': t(language, 'history.rename'),
                            maxLength: MAX_HISTORY_TITLE_LENGTH
                          }}
                          onPointerDown={event => event.stopPropagation()}
                          onChange={event => setRenameState(current => current?.id === item._id ? { ...current, value: event.target.value } : current)}
                          onBlur={() => finishRename(true)}
                          onKeyDown={(event) => {
                            event.stopPropagation()
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              finishRename(true)
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              finishRename(false)
                            }
                          }}
                          sx={{
                            fontFamily: 'var(--content-font-family)',
                            fontSize: '1rem',
                            fontWeight: isSelected ? 700 : 500,
                            lineHeight: 1.35,
                            p: 0,
                            '& textarea': {
                              p: 0,
                              lineHeight: 'inherit',
                              overflow: 'hidden !important',
                              resize: 'none'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35, lineHeight: 1.2 }}>
                          {formatRelativeTime(item.time, language)}
                        </Typography>
                      </Box>
                    ) : (
                      <ListItemText
                        primary={displayName}
                        secondary={searchSnippet
                          ? <HighlightedSnippet query={debouncedHistorySearchText} text={searchSnippet} />
                          : formatRelativeTime(item.time, language)}
                        sx={{ my: 0.15, minWidth: 0 }}
                        primaryTypographyProps={{
                          variant: 'body2',
                          sx: {
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                            whiteSpace: 'pre-wrap',
                            fontSize: '1rem',
                            lineHeight: 1.35,
                            fontWeight: isSelected ? 700 : 500,
                            fontFamily: 'var(--content-font-family)'
                          }
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                          sx: {
                            display: '-webkit-box',
                            mt: 0.35,
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: searchSnippet ? 2 : 1,
                            lineHeight: 1.2,
                            overflowWrap: 'anywhere'
                          }
                        }}
                      />
                    )}
                </Box>
              </ListItemButton>
                <IconButton
                  className="history-delete"
                  aria-label={t(language, 'history.deleteNamed', { title: fullTitle })}
                  size="small"
                  tabIndex={isDragging || isExiting ? -1 : 0}
                  onPointerDown={event => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleAnimatedDelete(item._id)
                  }}
                  sx={{
                    p: 0.25,
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main', transform: 'translateY(-50%)' },
                    '&:active': { transform: 'translateY(-50%)' }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </ListItem>
          )
        })}
      </List>

      <Box
        id="guide-sidebar-tools"
        sx={{
          flexShrink: 0,
          px: 1.25,
          py: 0.75,
          backgroundImage: isDark
            ? 'linear-gradient(to right, rgba(255, 255, 255, 0.15) 2px, transparent 2px)'
            : 'linear-gradient(to right, rgba(67, 52, 27, 0.15) 2px, transparent 2px)',
          backgroundSize: 'var(--history-divider-x-period, 7px) 1px',
          backgroundPosition: 'left top',
          backgroundRepeat: 'repeat-x'
        }}
      >
        <Box
          sx={{
            width: '100%',
            minHeight: 34,
            px: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.5,
            border: 0,
            borderRadius: 0,
            '& .MuiIconButton-root': {
              width: 32,
              height: 32,
              border: 0,
              color: '#989592'
            },
            '& .MuiIconButton-root.Mui-disabled': {
              color: '#989592',
              opacity: 0.38
            }
          }}
        >
          <Tooltip title={t(language, 'history.settings')}>
            <IconButton aria-label={t(language, 'history.settings')} size="small" onClick={onOpenSettings}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t(language, 'history.guide')}>
            <IconButton aria-label={t(language, 'history.guide')} size="small" onClick={onOpenHelp}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t(language, 'history.openFileShortcut')}>
            <IconButton aria-label={t(language, 'history.openFile')} size="small" onClick={onOpenFile}>
              <FolderOpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t(language, 'history.saveFileShortcut')}>
            <span>
              <IconButton aria-label={t(language, 'history.saveFile')} size="small" onClick={onSave} disabled={!canSave}>
                <SaveIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}

export default memo(HistoryPanel)
