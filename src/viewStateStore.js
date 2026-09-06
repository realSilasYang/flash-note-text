import { HISTORY_PREFIX, HISTORY_VIEW_STATE_PREFIX, LAST_VIEWED_HISTORY_KEY, SIDEBAR_STATE_KEY } from './constants'

function parseStoredValue (value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function normalizeEditorViewState (value) {
  const rawStart = Number(value?.selectionStart)
  const rawEnd = Number(value?.selectionEnd)
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) return null

  const selectionStart = Math.max(0, Math.floor(rawStart))
  const selectionEnd = Math.max(selectionStart, Math.floor(rawEnd))
  const scrollTop = Number(value?.scrollTop)
  const scrollLeft = Number(value?.scrollLeft)
  return {
    selectionStart,
    selectionEnd,
    ...(Number.isFinite(scrollTop) ? { scrollTop: Math.max(0, scrollTop) } : {}),
    ...(Number.isFinite(scrollLeft) ? { scrollLeft: Math.max(0, scrollLeft) } : {}),
    ...(['text', 'markdown', 'code'].includes(value.editorMode) ? { editorMode: value.editorMode } : {})
  }
}

function isHistoryId (value) {
  return typeof value === 'string' && value.startsWith(HISTORY_PREFIX)
}

function getViewStateKey (historyId) {
  return `${HISTORY_VIEW_STATE_PREFIX}${historyId.slice(HISTORY_PREFIX.length)}`
}

export function loadLastViewedHistoryState (utools) {
  const parsed = parseStoredValue(utools.dbStorage.getItem(LAST_VIEWED_HISTORY_KEY))
  if (!isHistoryId(parsed?.historyId)) return null
  return { historyId: parsed.historyId, ...(normalizeEditorViewState(parsed) || {}) }
}

export function saveLastViewedHistoryState (utools, state) {
  if (!isHistoryId(state?.historyId)) {
    utools.dbStorage.removeItem(LAST_VIEWED_HISTORY_KEY)
    return null
  }
  const normalized = { historyId: state.historyId, ...(normalizeEditorViewState(state) || {}) }
  utools.dbStorage.setItem(LAST_VIEWED_HISTORY_KEY, normalized)
  return normalized
}

export function loadHistoryViewState (utools, historyId) {
  if (!isHistoryId(historyId)) return null
  return normalizeEditorViewState(parseStoredValue(utools.dbStorage.getItem(getViewStateKey(historyId))))
}

export function saveHistoryViewState (utools, historyId, state) {
  if (!isHistoryId(historyId)) return null
  const normalized = normalizeEditorViewState(state)
  if (!normalized) return null
  utools.dbStorage.setItem(getViewStateKey(historyId), normalized)
  return normalized
}

export function loadSidebarExpandedState (utools) {
  const value = parseStoredValue(utools.dbStorage.getItem(SIDEBAR_STATE_KEY))
  return typeof value === 'boolean' ? value : true
}

export function saveSidebarExpandedState (utools, expanded) {
  const normalized = expanded !== false
  utools.dbStorage.setItem(SIDEBAR_STATE_KEY, normalized)
  return normalized
}

export function clearSidebarExpandedState (utools) {
  utools.dbStorage.removeItem(SIDEBAR_STATE_KEY)
}

export function deleteHistoryViewState (utools, historyId) {
  deleteHistoryViewStates(utools, [historyId])
}

export function deleteHistoryViewStates (utools, historyIds) {
  const ids = new Set((Array.isArray(historyIds) ? historyIds : []).filter(isHistoryId))
  if (ids.size === 0) return
  for (const historyId of ids) utools.dbStorage.removeItem(getViewStateKey(historyId))
  if (ids.has(loadLastViewedHistoryState(utools)?.historyId)) {
    utools.dbStorage.removeItem(LAST_VIEWED_HISTORY_KEY)
  }
}
