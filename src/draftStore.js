import { DRAFT_ENTRY_PREFIX, DRAFT_KEY, EXIT_SESSION_KEY, HISTORY_PREFIX, MAX_HISTORY_TITLE_LENGTH, MAX_TEXT_LENGTH } from './constants'
import { normalizeCodeLanguage, normalizeEditorMode } from './editorMode'
import { getFirstNonEmptyLine } from './textMetrics'

function parseStoredValue (value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function normalizeDraft (value) {
  const parsed = parseStoredValue(value)
  if (!parsed || typeof parsed.content !== 'string' || parsed.content.length > MAX_TEXT_LENGTH || !['text', 'markdown', 'code'].includes(parsed.editorMode)) return null

  const historyId = typeof parsed.historyId === 'string' && parsed.historyId.startsWith(HISTORY_PREFIX)
    ? parsed.historyId
    : null
  if (!historyId) return null
  const selectionStart = Number.isFinite(Number(parsed.selectionStart))
    ? Math.max(0, Math.floor(Number(parsed.selectionStart)))
    : 0
  const selectionEnd = Number.isFinite(Number(parsed.selectionEnd))
    ? Math.max(selectionStart, Math.floor(Number(parsed.selectionEnd)))
    : selectionStart
  const maxLineEndingMapLength = Math.ceil(MAX_TEXT_LENGTH / 3) + 16
  const file = parsed.file && typeof parsed.file === 'object'
    ? {
        ...(typeof parsed.file.path === 'string' ? { path: parsed.file.path } : {}),
        ...(typeof parsed.file.name === 'string' ? { name: parsed.file.name } : {}),
        ...(typeof parsed.file.encoding === 'string' ? { encoding: parsed.file.encoding } : {}),
        ...(typeof parsed.file.lineEnding === 'string' ? { lineEnding: parsed.file.lineEnding } : {}),
        ...(typeof parsed.file.dominantLineEnding === 'string' ? { dominantLineEnding: parsed.file.dominantLineEnding } : {}),
        ...(typeof parsed.file.lineEndingMap === 'string' && parsed.file.lineEndingMap.length <= maxLineEndingMapLength && /^[0-9a-z]+:[A-Za-z0-9_-]*$/.test(parsed.file.lineEndingMap)
          ? { lineEndingMap: parsed.file.lineEndingMap }
          : {})
      }
    : null
  return {
    historyId,
    content: parsed.content,
    dirty: parsed.dirty === true,
    editorMode: normalizeEditorMode(parsed.editorMode),
    codeLanguage: normalizeCodeLanguage(parsed.codeLanguage),
    selectionStart,
    selectionEnd,
    scrollTop: Number.isFinite(Number(parsed.scrollTop)) ? Math.max(0, Number(parsed.scrollTop)) : 0,
    scrollLeft: Number.isFinite(Number(parsed.scrollLeft)) ? Math.max(0, Number(parsed.scrollLeft)) : 0,
    file,
    updatedAt: Number.isFinite(Number(parsed.updatedAt)) ? Number(parsed.updatedAt) : 0
  }
}

export function loadLatestDraft (utools) {
  const latest = loadDraftSummaries(utools)[0]
  return latest ? loadDraftEntry(utools, latest.historyId) : null
}

function getDraftEntryKey (historyId) {
  return `${DRAFT_ENTRY_PREFIX}${historyId.slice(HISTORY_PREFIX.length)}`
}

export function loadDraftSummaries (utools) {
  const stored = parseStoredValue(utools.dbStorage.getItem(DRAFT_KEY))
  if (!Array.isArray(stored)) return []
  const byHistoryId = new Map()
  for (const value of stored) {
    if (!value || typeof value.historyId !== 'string' || !value.historyId.startsWith(HISTORY_PREFIX)) continue
    const updatedAt = Number.isFinite(Number(value.updatedAt)) ? Number(value.updatedAt) : 0
    const editorMode = normalizeEditorMode(value.editorMode)
    const codeLanguage = normalizeCodeLanguage(value.codeLanguage)
    const contentLength = Number.isFinite(Number(value.contentLength)) ? Math.max(0, Math.floor(Number(value.contentLength))) : 0
    const autoTitle = typeof value.autoTitle === 'string' ? value.autoTitle : ''
    const previous = byHistoryId.get(value.historyId)
    if (!previous || updatedAt >= previous.updatedAt) {
      byHistoryId.set(value.historyId, { historyId: value.historyId, updatedAt, editorMode, codeLanguage, contentLength, autoTitle })
    }
  }
  return [...byHistoryId.values()].sort((left, right) => right.updatedAt - left.updatedAt)
}

export function summarizeDraft (draft) {
  if (!draft?.historyId || typeof draft.content !== 'string') return null
  return {
    historyId: draft.historyId,
    updatedAt: Number.isFinite(Number(draft.updatedAt)) ? Number(draft.updatedAt) : 0,
    editorMode: normalizeEditorMode(draft.editorMode),
    codeLanguage: normalizeCodeLanguage(draft.codeLanguage),
    contentLength: draft.content.length,
    autoTitle: Array.from(getFirstNonEmptyLine(draft.content)).slice(0, MAX_HISTORY_TITLE_LENGTH).join('')
  }
}

function saveDraftIndex (utools, index) {
  if (index.length > 0) utools.dbStorage.setItem(DRAFT_KEY, index)
  else utools.dbStorage.removeItem(DRAFT_KEY)
}

export function loadDraftEntry (utools, historyId) {
  if (typeof historyId !== 'string' || !historyId.startsWith(HISTORY_PREFIX)) return null
  const draft = normalizeDraft(utools.dbStorage.getItem(getDraftEntryKey(historyId)))
  return draft?.dirty && draft.historyId === historyId ? draft : null
}

export function saveDraft (utools, session, now = Date.now()) {
  const draft = normalizeDraft({ ...session, updatedAt: now })
  if (!draft?.dirty) throw new Error('无效的恢复草稿会话')
  utools.dbStorage.setItem(getDraftEntryKey(draft.historyId), draft)
  const index = loadDraftSummaries(utools).filter(item => item.historyId !== draft.historyId)
  saveDraftIndex(utools, [summarizeDraft(draft), ...index])
  return draft
}

export function deleteDraft (utools, historyId) {
  if (typeof historyId !== 'string' || !historyId.startsWith(HISTORY_PREFIX)) return false
  const index = loadDraftSummaries(utools)
  const nextIndex = index.filter(item => item.historyId !== historyId)
  if (nextIndex.length !== index.length) saveDraftIndex(utools, nextIndex)
  // 无论索引中是否存在记录，都要删除对应正文。这样即使之前的写入被中断，
  // 也不会残留未登记的草稿，并在以后加载时错误恢复已经删除的内容。
  utools.dbStorage.removeItem(getDraftEntryKey(historyId))
  return nextIndex.length !== index.length
}

export function clearDrafts (utools) {
  const index = loadDraftSummaries(utools)
  utools.dbStorage.removeItem(DRAFT_KEY)
  for (const { historyId } of index) utools.dbStorage.removeItem(getDraftEntryKey(historyId))
}

function normalizeExitSession (value) {
  const parsed = parseStoredValue(value)
  if (!parsed || typeof parsed.historyId !== 'string' || !parsed.historyId.startsWith(HISTORY_PREFIX)) return null
  const transient = parsed.transient === true
  if (transient && typeof parsed.content !== 'string') return null
  if (transient && parsed.content.length > MAX_TEXT_LENGTH) return null
  const selectionStart = Number.isFinite(Number(parsed.selectionStart))
    ? Math.max(0, Math.floor(Number(parsed.selectionStart)))
    : 0
  const selectionEnd = Number.isFinite(Number(parsed.selectionEnd))
    ? Math.max(selectionStart, Math.floor(Number(parsed.selectionEnd)))
    : selectionStart
  return {
    historyId: parsed.historyId,
    transient,
    ...(transient ? { content: parsed.content } : {}),
    editorMode: normalizeEditorMode(parsed.editorMode),
    codeLanguage: normalizeCodeLanguage(parsed.codeLanguage),
    selectionStart,
    selectionEnd,
    scrollTop: Number.isFinite(Number(parsed.scrollTop)) ? Math.max(0, Number(parsed.scrollTop)) : 0,
    scrollLeft: Number.isFinite(Number(parsed.scrollLeft)) ? Math.max(0, Number(parsed.scrollLeft)) : 0,
    ...(parsed.file && typeof parsed.file === 'object' ? { file: parsed.file } : {})
  }
}

export function loadExitSession (utools) {
  return normalizeExitSession(utools.dbStorage.getItem(EXIT_SESSION_KEY))
}

export function saveExitSession (utools, session) {
  const normalized = normalizeExitSession(session)
  if (!normalized) {
    utools.dbStorage.removeItem(EXIT_SESSION_KEY)
    return null
  }
  utools.dbStorage.setItem(EXIT_SESSION_KEY, normalized)
  return normalized
}

export function clearExitSession (utools) {
  utools.dbStorage.removeItem(EXIT_SESSION_KEY)
}
