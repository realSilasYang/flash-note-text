import {
  DEFAULT_SETTINGS,
  HISTORY_INDEX_KEY,
  HISTORY_INDEX_PATCH_KEY,
  HISTORY_PREFIX,
  HISTORY_LIMIT_MODES,
  MAX_HISTORY_AGE_DAYS,
  MAX_HISTORY_MAX,
  MAX_HISTORY_MIN,
  MAX_HISTORY_TITLE_LENGTH,
  MAX_EDITOR_ZOOM,
  MIN_EDITOR_ZOOM,
  MIN_HISTORY_AGE_DAYS,
  MAX_TEXT_LENGTH,
  STARTUP_BEHAVIORS,
  THEME_MODES,
  SETTINGS_KEY
} from './constants'
import { normalizeCodeLanguage, normalizeEditorMode } from './editorMode'
import { normalizeLanguagePreference } from './locales'
import { normalizeShortcut } from './shortcut'
import { deleteHistoryViewState, deleteHistoryViewStates } from './viewStateStore'
import { getFirstNonEmptyLine } from './textMetrics'
import { normalizeContentFont, normalizeInterfaceFont } from './localFonts'
import { normalizeAiModelSelection } from './services/aiService'

function parseStoredValue (value) {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function normalizeHistoryTitle (value) {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_HISTORY_TITLE_LENGTH)
}

function getAutoTitle (content) {
  return Array.from(getFirstNonEmptyLine(content)).slice(0, MAX_HISTORY_TITLE_LENGTH).join('')
}

function hashContent (content) {
  let hash = 2166136261
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function makeHistoryId () {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  return `${HISTORY_PREFIX}${Date.now()}-${randomId}`
}

function assertResult (result, operation) {
  if (!result?.ok) {
    const error = new Error(result?.message || `${operation}失败`)
    error.code = result?.error ? 'HISTORY_CONFLICT' : 'HISTORY_WRITE_FAILED'
    throw error
  }
  return result
}

function removeDoc (utools, item) {
  const current = utools.db.get(item._id)
  if (!current) return
  let result = utools.db.remove(current)
  if (!result?.ok) {
    const latest = utools.db.get(item._id)
    if (!latest) return
    result = utools.db.remove(latest)
  }
  assertResult(result, '删除历史记录')
}

function metadataFromContent (item, content, revision) {
  const title = normalizeHistoryTitle(item.title)
  return {
    _id: item._id,
    ...(typeof revision === 'string' ? { _rev: revision } : {}),
    editorMode: normalizeEditorMode(item.editorMode),
    codeLanguage: normalizeCodeLanguage(item.codeLanguage),
    time: Number(item.time),
    order: Number(item.order),
    contentLength: content.length,
    contentHash: hashContent(content),
    autoTitle: getAutoTitle(content),
    ...(title ? { title } : {})
  }
}

function bodyFromEntry (item, content, revision = item._rev) {
  const title = normalizeHistoryTitle(item.title)
  return {
    _id: item._id,
    ...(typeof revision === 'string' ? { _rev: revision } : {}),
    content,
    editorMode: normalizeEditorMode(item.editorMode),
    codeLanguage: normalizeCodeLanguage(item.codeLanguage),
    time: Number(item.time),
    ...(title ? { title } : {})
  }
}

function saveHistoryIndex (utools, history) {
  const ordered = sortHistory(history.filter(item => !item?._transient)).map((item, index) => ({
    ...item,
    order: index,
    ...(item._draftBase ? { _draftBase: { ...item._draftBase, order: index } } : {})
  }))
  const stored = ordered.map((item, index) => ({ ...(item._draftBase || item), order: index }))
  utools.dbStorage.setItem(HISTORY_INDEX_KEY, stored)
  utools.dbStorage.removeItem(HISTORY_INDEX_PATCH_KEY)
  return ordered
}

function saveHistoryIndexPatch (utools, history, changedItems) {
  const storedPatches = normalizeHistoryDocs(
    parseStoredValue(utools.dbStorage.getItem(HISTORY_INDEX_PATCH_KEY)),
    { preserveOrder: true }
  )
  const patchById = new Map(storedPatches.map(item => [item._id, item]))
  for (const item of changedItems) {
    if (item && !item._transient) patchById.set(item._id, item._draftBase || item)
  }

  // 限制待回放补丁的数量；达到阈值后立即合并到稳定索引，避免补丁无限累积，
  // 同时缩短下次启动时重放历史记录的时间。
  if (patchById.size >= 128) return saveHistoryIndex(utools, history)
  utools.dbStorage.setItem(HISTORY_INDEX_PATCH_KEY, [...patchById.values()])
  return history
}

export function normalizeSettings (value) {
  const parsed = parseStoredValue(value)
  const themeMode = Object.values(THEME_MODES).includes(parsed?.themeMode) ? parsed.themeMode : DEFAULT_SETTINGS.themeMode
  const language = normalizeLanguagePreference(parsed?.language)
  const hasContentFontSetting = Object.prototype.hasOwnProperty.call(parsed || {}, 'contentFont')
  const legacyInterfaceFont = normalizeInterfaceFont(parsed?.interfaceFont)
  const interfaceFont = !hasContentFontSetting && legacyInterfaceFont === 'LXGW WenKai'
    ? DEFAULT_SETTINGS.interfaceFont
    : legacyInterfaceFont
  const contentFont = normalizeContentFont(parsed?.contentFont)
  const requested = Number(typeof parsed === 'number' ? parsed : parsed?.maxHistory)
  const maxHistory = Number.isFinite(requested)
    ? Math.min(MAX_HISTORY_MAX, Math.max(MAX_HISTORY_MIN, Math.round(requested)))
    : DEFAULT_SETTINGS.maxHistory
  const historyLimitMode = parsed?.historyLimitMode === HISTORY_LIMIT_MODES.TIME ? HISTORY_LIMIT_MODES.TIME : HISTORY_LIMIT_MODES.COUNT
  const requestedHistoryAge = Number(parsed?.historyMaxAgeDays)
  const historyMaxAgeDays = Number.isFinite(requestedHistoryAge)
    ? Math.min(MAX_HISTORY_AGE_DAYS, Math.max(MIN_HISTORY_AGE_DAYS, Math.round(requestedHistoryAge)))
    : DEFAULT_SETTINGS.historyMaxAgeDays
  const requestedZoom = Number(parsed?.zoom)
  const zoom = Number.isFinite(requestedZoom)
    ? Math.min(MAX_EDITOR_ZOOM, Math.max(MIN_EDITOR_ZOOM, Math.round(requestedZoom / 10) * 10))
    : DEFAULT_SETTINGS.zoom
  const wordWrap = typeof parsed?.wordWrap === 'boolean' ? parsed.wordWrap : DEFAULT_SETTINGS.wordWrap
  const autoSaveEntries = typeof parsed?.autoSaveEntries === 'boolean' ? parsed.autoSaveEntries : DEFAULT_SETTINGS.autoSaveEntries
  const editorMode = normalizeEditorMode(parsed?.editorMode || DEFAULT_SETTINGS.editorMode)
  const codeLanguage = normalizeCodeLanguage(parsed?.codeLanguage || DEFAULT_SETTINGS.codeLanguage)
  const sidebarShortcut = normalizeShortcut(parsed?.sidebarShortcut, DEFAULT_SETTINGS.sidebarShortcut)
  const rememberSidebarState = typeof parsed?.rememberSidebarState === 'boolean'
    ? parsed.rememberSidebarState
    : DEFAULT_SETTINGS.rememberSidebarState
  const startupBehavior = Object.values(STARTUP_BEHAVIORS).includes(parsed?.startupBehavior)
    ? parsed.startupBehavior
    : DEFAULT_SETTINGS.startupBehavior
  const imageSaveDirectory = typeof parsed?.imageSaveDirectory === 'string'
    ? parsed.imageSaveDirectory.trim()
    : DEFAULT_SETTINGS.imageSaveDirectory
  const aiModel = typeof parsed?.aiModel === 'string' ? normalizeAiModelSelection(parsed.aiModel) : DEFAULT_SETTINGS.aiModel
  const aiDirectEnabled = typeof parsed?.aiDirectEnabled === 'boolean' ? parsed.aiDirectEnabled : DEFAULT_SETTINGS.aiDirectEnabled
  const aiDirectBaseUrl = typeof parsed?.aiDirectBaseUrl === 'string' ? parsed.aiDirectBaseUrl.trim().slice(0, 2000) : DEFAULT_SETTINGS.aiDirectBaseUrl
  const aiDirectApiKey = typeof parsed?.aiDirectApiKey === 'string' ? parsed.aiDirectApiKey.trim().slice(0, 4000) : DEFAULT_SETTINGS.aiDirectApiKey
  const aiDirectModel = typeof parsed?.aiDirectModel === 'string' ? normalizeAiModelSelection(parsed.aiDirectModel) : DEFAULT_SETTINGS.aiDirectModel
  const aiFormattingPrompt = typeof parsed?.aiFormattingPrompt === 'string' ? parsed.aiFormattingPrompt.slice(0, 4000) : DEFAULT_SETTINGS.aiFormattingPrompt
  const aiImageGenerationPrompt = typeof parsed?.aiImageGenerationPrompt === 'string' ? parsed.aiImageGenerationPrompt.slice(0, 4000) : DEFAULT_SETTINGS.aiImageGenerationPrompt
  return { themeMode, language, interfaceFont, contentFont, historyLimitMode, maxHistory, historyMaxAgeDays, autoSaveEntries, wordWrap, zoom, editorMode, codeLanguage, sidebarShortcut, rememberSidebarState, startupBehavior, imageSaveDirectory, aiModel, aiDirectEnabled, aiDirectBaseUrl, aiDirectApiKey, aiDirectModel, aiFormattingPrompt, aiImageGenerationPrompt }
}

export function loadSettings (utools) {
  return normalizeSettings(utools.dbStorage.getItem(SETTINGS_KEY))
}

export function saveSettings (utools, settings) {
  const normalized = normalizeSettings(settings)
  utools.dbStorage.setItem(SETTINGS_KEY, normalized)
  return normalized
}

function sortHistory (history) {
  return [...history].sort((left, right) => {
    const leftOrder = Number(left.order)
    const rightOrder = Number(right.order)
    const leftHasOrder = Number.isFinite(leftOrder)
    const rightHasOrder = Number.isFinite(rightOrder)
    if (leftHasOrder && rightHasOrder && leftOrder !== rightOrder) return leftOrder - rightOrder
    if (leftHasOrder !== rightHasOrder) return leftHasOrder ? -1 : 1
    return Number(right.time) - Number(left.time) || left._id.localeCompare(right._id)
  })
}

function normalizeHistoryDocs (docs, options = {}) {
  if (!Array.isArray(docs)) return []
  const normalized = sortHistory(docs.filter(doc => (
    doc &&
    typeof doc._id === 'string' &&
    doc._id.startsWith(HISTORY_PREFIX) &&
    Number.isFinite(Number(doc.time)) &&
    Number.isFinite(Number(doc.contentLength))
  )).map(doc => {
    const title = normalizeHistoryTitle(doc.title)
    return {
      _id: doc._id,
      ...(typeof doc._rev === 'string' ? { _rev: doc._rev } : {}),
      editorMode: normalizeEditorMode(doc.editorMode),
      codeLanguage: normalizeCodeLanguage(doc.codeLanguage),
      time: Number(doc.time),
      order: Number.isFinite(Number(doc.order)) ? Number(doc.order) : Number.MAX_SAFE_INTEGER,
      contentLength: Math.max(0, Math.floor(Number(doc.contentLength))),
      contentHash: typeof doc.contentHash === 'string' ? doc.contentHash : '',
      autoTitle: typeof doc.autoTitle === 'string' ? doc.autoTitle : '',
      ...(title ? { title } : {})
    }
  }))
  if (options.preserveOrder) return normalized
  return normalized.map((item, index) => item.order === index ? item : { ...item, order: index })
}

export function createTransientHistoryEntry (history, editorMode, options = {}) {
  const content = typeof options.content === 'string' ? options.content : ''
  const title = normalizeHistoryTitle(options.title)
  return {
    _id: options.id || makeHistoryId(),
    _transient: true,
    content,
    contentLength: content.length,
    contentHash: hashContent(content),
    autoTitle: getAutoTitle(content),
    editorMode: normalizeEditorMode(editorMode),
    codeLanguage: normalizeCodeLanguage(options.codeLanguage),
    time: options.now ?? Date.now(),
    order: -1,
    ...(title ? { title } : {})
  }
}

export function updateHistoryEntryDraft (history, historyId, content, editorMode, codeLanguage) {
  if (!Array.isArray(history) || typeof content !== 'string') return history
  const item = history.find(entry => entry._id === historyId)
  if (!item) return history
  const draftBase = item._draftBase || item
  const metadata = metadataFromContent({
    ...item,
    editorMode: normalizeEditorMode(editorMode ?? item.editorMode),
    codeLanguage: normalizeCodeLanguage(codeLanguage ?? item.codeLanguage),
    time: item.time
  }, content, item._rev)
  const updated = item._transient
    ? { ...metadata, _transient: true, content }
    : { ...metadata, _draft: true, _draftBase: draftBase }
  return history.map(entry => entry._id === historyId ? updated : entry)
}

export function mergeHistoryDrafts (history, drafts) {
  let merged = Array.isArray(history) ? history : []
  const missing = []
  for (const draft of Array.isArray(drafts) ? drafts : []) {
    if (!draft?.historyId) continue
    if (merged.some(item => item._id === draft.historyId)) {
      if (typeof draft.content === 'string') {
        merged = updateHistoryEntryDraft(merged, draft.historyId, draft.content, draft.editorMode, draft.codeLanguage)
      } else {
        merged = merged.map(item => item._id === draft.historyId
          ? {
              ...item,
              editorMode: normalizeEditorMode(draft.editorMode),
              codeLanguage: normalizeCodeLanguage(draft.codeLanguage),
              contentLength: Number(draft.contentLength) || 0,
              autoTitle: typeof draft.autoTitle === 'string' ? draft.autoTitle : '',
              _draft: true,
              _draftBase: item._draftBase || item
            }
          : item)
      }
      continue
    }
    const transient = createTransientHistoryEntry(merged, draft.editorMode, {
      id: draft.historyId,
      content: typeof draft.content === 'string' ? draft.content : '',
      codeLanguage: draft.codeLanguage,
      now: draft.updatedAt
    })
    missing.push(typeof draft.content === 'string'
      ? transient
      : {
          ...transient,
          contentLength: Number(draft.contentLength) || 0,
          autoTitle: typeof draft.autoTitle === 'string' ? draft.autoTitle : ''
        })
  }
  return [...missing, ...merged]
}

export function loadHistory (utools) {
  const stored = normalizeHistoryDocs(parseStoredValue(utools.dbStorage.getItem(HISTORY_INDEX_KEY)))
  const patches = normalizeHistoryDocs(parseStoredValue(utools.dbStorage.getItem(HISTORY_INDEX_PATCH_KEY)), { preserveOrder: true })
  if (patches.length === 0) return stored
  const byId = new Map(stored.map(item => [item._id, item]))
  for (const item of patches) byId.set(item._id, item)
  return normalizeHistoryDocs([...byId.values()])
}

export function loadHistoryEntry (utools, itemOrId) {
  const item = typeof itemOrId === 'string'
    ? loadHistory(utools).find(entry => entry._id === itemOrId)
    : itemOrId
  if (!item) return null
  if (item._transient) return { ...item, content: item.content || '' }
  const body = utools.db.get(item._id)
  if (!body || typeof body.content !== 'string') return null
  return { ...item, _rev: body._rev, content: body.content }
}

export function mergeHistoryChanges (utools, history, docs) {
  if (!Array.isArray(docs)) return history
  const transientById = new Map(history.filter(item => item._transient).map(item => [item._id, item]))
  const byId = new Map(history.filter(item => !item._transient).map(item => [item._id, item]))
  let changed = false
  const deletedIds = []

  for (const doc of docs) {
    if (typeof doc?._id !== 'string' || !doc._id.startsWith(HISTORY_PREFIX)) continue
    if (doc._deleted || typeof doc.content !== 'string') {
      deletedIds.push(doc._id)
      const removedTransient = transientById.delete(doc._id)
      if (!byId.has(doc._id)) {
        if (removedTransient) changed = true
        continue
      }
      changed = true
      byId.delete(doc._id)
      continue
    }
    transientById.delete(doc._id)
    const previous = byId.get(doc._id)
    if (previous && typeof doc._rev === 'string' && previous._rev === doc._rev) continue
    changed = true
    const metadata = metadataFromContent({
      _id: doc._id,
      editorMode: doc.editorMode,
      codeLanguage: doc.codeLanguage,
      time: Number.isFinite(Number(doc.time)) ? Number(doc.time) : Date.now(),
      order: Number.isFinite(Number(previous?.order)) ? Number(previous.order) : byId.size,
      title: doc.title
    }, doc.content, doc._rev)
    byId.set(doc._id, metadata)
  }

  deleteHistoryViewStates(utools, deletedIds)
  if (!changed) return history
  const persistent = saveHistoryIndex(utools, [...byId.values()])
  return sortHistory([...transientById.values(), ...persistent])
}

function applyHistoryLimit (history, settings, now = Date.now()) {
  const protectedEntries = history.filter(item => item?._transient || item?._draft)
  const persisted = history.filter(item => !item?._transient && !item?._draft)
  const sorted = sortHistory(persisted)
  if (settings.historyLimitMode === HISTORY_LIMIT_MODES.TIME) {
    const cutoff = now - settings.historyMaxAgeDays * 24 * 60 * 60 * 1000
    const kept = sorted.filter(item => item.time >= cutoff)
    const keptIds = new Set(kept.map(item => item._id))
    return { kept: sortHistory([...protectedEntries, ...kept]), removed: sorted.filter(item => !keptIds.has(item._id)) }
  }
  const newestIds = new Set([...persisted]
    .sort((left, right) => right.time - left.time || left._id.localeCompare(right._id))
    .slice(0, settings.maxHistory)
    .map(item => item._id))
  return {
    kept: sortHistory([...protectedEntries, ...sorted.filter(item => newestIds.has(item._id))]),
    removed: sorted.filter(item => !newestIds.has(item._id))
  }
}

export function getHistoryRetentionPlan (history, historyLimit, options = {}) {
  return applyHistoryLimit(Array.isArray(history) ? history : [], normalizeSettings(historyLimit), options.now)
}

export function trimHistory (utools, history, historyLimit, options = {}) {
  const { kept, removed } = getHistoryRetentionPlan(history, historyLimit, options)
  for (const item of removed) {
    const currentBody = utools.db.get(item._id)
    if (typeof currentBody?.content === 'string') options.onBeforeRemove?.({ ...item, _rev: currentBody._rev, content: currentBody.content })
    removeDoc(utools, item)
  }
  deleteHistoryViewStates(utools, removed.map(item => item._id))
  const transient = kept.filter(item => item._transient)
  return sortHistory([...transient, ...saveHistoryIndex(utools, kept)])
}

function planHistorySave (history, content, historyLimit, options = {}) {
  if (typeof content !== 'string' || content.length > MAX_TEXT_LENGTH) throw new Error('文本过长')
  const existing = typeof options.historyId === 'string' ? history.find(item => item._id === options.historyId) : null
  const title = normalizeHistoryTitle(existing?.title)
  if (!content.trim() && !title) {
    if (!existing) return { entry: null, history: sortHistory(history), removed: [] }
    const transientEntry = {
      ...existing,
      _transient: true,
      content: '',
      contentLength: 0,
      contentHash: hashContent(''),
      autoTitle: '',
      editorMode: normalizeEditorMode(options.editorMode ?? existing.editorMode),
      codeLanguage: normalizeCodeLanguage(options.codeLanguage ?? existing.codeLanguage),
      time: options.now ?? Date.now()
    }
    delete transientEntry._rev
    delete transientEntry._draft
    delete transientEntry._draftBase
    return {
      entry: transientEntry,
      history: sortHistory(history.map(item => item._id === transientEntry._id ? transientEntry : item)),
      removed: [],
      removeEntry: existing._transient ? null : existing
    }
  }

  const now = options.now ?? Date.now()
  const base = existing || {
    _id: options.id || makeHistoryId(),
    time: now,
    order: -1
  }
  const entry = metadataFromContent({
    ...base,
    editorMode: normalizeEditorMode(options.editorMode ?? existing?.editorMode),
    codeLanguage: normalizeCodeLanguage(options.codeLanguage ?? existing?.codeLanguage),
    time: now,
    title
  }, content, existing?._rev)
  const candidates = [entry, ...history.filter(item => item._id !== entry._id)]
  const settings = normalizeSettings(historyLimit)
  if (existing && !existing._transient) {
    const persisted = candidates.filter(item => !item?._transient && !item?._draft)
    const needsRemoval = settings.historyLimitMode === HISTORY_LIMIT_MODES.TIME
      ? persisted.some(item => item.time < now - settings.historyMaxAgeDays * 24 * 60 * 60 * 1000)
      : persisted.length > settings.maxHistory
    if (!needsRemoval) {
      return {
        entry,
        history: history.map(item => item._id === entry._id ? entry : item),
        removed: [],
        content
      }
    }
  }
  const { kept, removed } = applyHistoryLimit(candidates, settings, now)
  return { entry, history: kept, removed, content }
}

export function saveHistoryEntry (utools, history, content, historyLimit, options = {}) {
  const plan = planHistorySave(history, content, historyLimit, options)
  if (!plan.entry) return plan.history
  if (plan.entry._transient && !plan.removeEntry) return plan.history
  if (plan.removeEntry) {
    const currentBody = utools.db.get(plan.removeEntry._id)
    if (typeof currentBody?.content === 'string') options.onBeforeRemove?.({ ...plan.removeEntry, _rev: currentBody._rev, content: currentBody.content })
    removeDoc(utools, plan.removeEntry)
    deleteHistoryViewState(utools, plan.removeEntry._id)
    const persistent = saveHistoryIndex(utools, plan.history)
    return sortHistory([...plan.history.filter(item => item._transient), ...persistent])
  }

  const currentBody = utools.db.get(plan.entry._id)
  const body = bodyFromEntry(plan.entry, content, currentBody?._rev)
  const result = assertResult(utools.db.put(body), '保存历史记录')
  const savedEntry = { ...plan.entry, _rev: result.rev }
  const nextHistory = plan.history.map(item => item._id === savedEntry._id ? savedEntry : item)
  const updatesExistingPersistentEntry = history.some(item => item._id === savedEntry._id && !item._transient)
  for (const item of plan.removed) {
    const currentBody = utools.db.get(item._id)
    if (typeof currentBody?.content === 'string') options.onBeforeRemove?.({ ...item, _rev: currentBody._rev, content: currentBody.content })
    removeDoc(utools, item)
    deleteHistoryViewState(utools, item._id)
  }
  if (updatesExistingPersistentEntry && plan.removed.length === 0) {
    saveHistoryIndexPatch(utools, nextHistory, [savedEntry])
    return nextHistory
  }
  const transient = nextHistory.filter(item => item._transient)
  const persistent = saveHistoryIndex(utools, nextHistory)
  return sortHistory([...transient, ...persistent])
}

export function deleteHistoryEntry (utools, history, itemId) {
  const item = history.find(entry => entry._id === itemId)
  if (!item) return history
  if (!item._transient) removeDoc(utools, item)
  deleteHistoryViewState(utools, itemId)
  const nextHistory = history.filter(entry => entry._id !== itemId)
  const transient = nextHistory.filter(entry => entry._transient)
  return sortHistory([...transient, ...saveHistoryIndex(utools, nextHistory)])
}

export function renameHistoryEntry (utools, history, itemId, title) {
  const item = history.find(entry => entry._id === itemId)
  if (!item) return history
  const normalizedTitle = normalizeHistoryTitle(title)
  if ((item.title || '') === normalizedTitle) return history

  if (!normalizedTitle && item.contentLength === 0) return deleteHistoryEntry(utools, history, itemId)
  if (item._transient) {
    const content = item.content || ''
    return saveHistoryEntry(utools, history.map(entry => entry._id === itemId ? { ...entry, title: normalizedTitle } : entry), content, { maxHistory: MAX_HISTORY_MAX }, { historyId: itemId, editorMode: item.editorMode, codeLanguage: item.codeLanguage })
  }

  const storedItem = item._draftBase || item
  const loaded = loadHistoryEntry(utools, storedItem)
  if (!loaded) throw new Error('历史记录不存在')
  const nextStoredItem = { ...storedItem, ...(normalizedTitle ? { title: normalizedTitle } : {}) }
  if (!normalizedTitle) delete nextStoredItem.title
  const result = assertResult(utools.db.put(bodyFromEntry(nextStoredItem, loaded.content, loaded._rev)), '重命名历史记录')
  const updatedBase = { ...nextStoredItem, _rev: result.rev }
  const updated = item._draft
    ? { ...item, _rev: result.rev, ...(normalizedTitle ? { title: normalizedTitle } : {}), _draftBase: updatedBase }
    : updatedBase
  if (!normalizedTitle) delete updated.title
  const nextHistory = history.map(entry => entry._id === itemId ? updated : entry)
  saveHistoryIndexPatch(utools, nextHistory, [updatedBase])
  return nextHistory
}

export function setHistoryEntryMode (utools, history, itemId, editorMode, codeLanguage) {
  const item = history.find(entry => entry._id === itemId)
  if (!item) return history
  const normalizedMode = normalizeEditorMode(editorMode)
  const normalizedCodeLanguage = normalizeCodeLanguage(codeLanguage ?? item.codeLanguage)
  if (item.editorMode === normalizedMode && item.codeLanguage === normalizedCodeLanguage) return history
  if (item._transient || item._draft) return history.map(entry => entry._id === itemId ? { ...entry, editorMode: normalizedMode, codeLanguage: normalizedCodeLanguage } : entry)

  const loaded = loadHistoryEntry(utools, item)
  if (!loaded) throw new Error('历史记录不存在')
  const nextItem = { ...item, editorMode: normalizedMode, codeLanguage: normalizedCodeLanguage }
  const result = assertResult(utools.db.put(bodyFromEntry(nextItem, loaded.content, loaded._rev)), '保存编辑模式')
  const updated = { ...nextItem, _rev: result.rev }
  const nextHistory = history.map(entry => entry._id === itemId ? updated : entry)
  saveHistoryIndexPatch(utools, nextHistory, [updated])
  return nextHistory
}

export function getNextHistoryEntry (history, itemId) {
  if (!Array.isArray(history)) return null
  const index = history.findIndex(entry => entry._id === itemId)
  return index >= 0 ? history[index + 1] || history[index - 1] || null : null
}

export function reorderHistoryEntries (utools, history, orderedIds) {
  const byId = new Map(history.map(item => [item._id, item]))
  const ids = [...new Set(Array.isArray(orderedIds) ? orderedIds : [])].filter(id => byId.has(id))
  for (const item of sortHistory(history)) if (!ids.includes(item._id)) ids.push(item._id)
  const reordered = ids.map((id, order) => ({ ...byId.get(id), order }))
  const transient = reordered.filter(item => item._transient)
  return sortHistory([...transient, ...saveHistoryIndex(utools, reordered)])
}

export function restoreHistoryEntry (utools, history, entry, index = 0) {
  if (!entry || typeof entry.content !== 'string') return history
  const existingIndex = history.findIndex(item => item._id === entry._id)
  const body = bodyFromEntry(entry, entry.content, utools.db.get(entry._id)?._rev)
  const result = assertResult(utools.db.put(body), '恢复历史记录')
  const metadata = metadataFromContent(entry, entry.content, result.rev)
  const nextHistory = [...history.filter(item => item._id !== metadata._id)]
  nextHistory.splice(Math.max(0, Math.min(nextHistory.length, index)), 0, metadata)
  const ordered = sortHistory(nextHistory.map((item, order) => ({ ...item, order })))
  if (existingIndex >= 0 && existingIndex === index) saveHistoryIndexPatch(utools, ordered, [ordered[index]])
  else saveHistoryIndex(utools, ordered)
  return ordered
}

export function restoreHistorySnapshot (utools, snapshot, bodyCache = {}) {
  const entries = Array.isArray(snapshot) ? snapshot.filter(item => !item?._transient) : []
  const current = loadHistory(utools)
  const targetIds = new Set(entries.map(item => item._id))
  const currentById = new Map(current.map(item => [item._id, item]))
  const removedIds = []
  for (const item of current) {
    if (targetIds.has(item._id)) continue
    removeDoc(utools, item)
    removedIds.push(item._id)
  }
  deleteHistoryViewStates(utools, removedIds)
  const metadata = entries.flatMap((item, order) => {
    const currentItem = currentById.get(item._id)
    const currentBody = utools.db.get(item._id)
    const metadataMatches = currentItem &&
      currentItem.editorMode === normalizeEditorMode(item.editorMode) &&
      currentItem.codeLanguage === normalizeCodeLanguage(item.codeLanguage) &&
      (currentItem.title || '') === (item.title || '') &&
      Number(currentItem.time) === Number(item.time) &&
      Number(currentItem.order) === order &&
      Number(currentItem.contentLength) === Number(item.contentLength) &&
      (!item.contentHash || currentItem.contentHash === item.contentHash)
    if (metadataMatches && typeof currentBody?.content === 'string' && typeof item.content !== 'string' && !bodyCache[item._id]) {
      return [{ ...currentItem, order }]
    }

    const cachedContent = typeof item.content === 'string' ? item.content : bodyCache[item._id]?.content
    const content = typeof cachedContent === 'string' ? cachedContent : currentBody?.content
    if (typeof content !== 'string') return []
    const result = assertResult(utools.db.put(bodyFromEntry({ ...item, order }, content, currentBody?._rev)), '恢复历史排序')
    return [metadataFromContent({ ...item, order }, content, result.rev)]
  })
  return saveHistoryIndex(utools, metadata)
}

export function clearHistory (utools) {
  const history = loadHistory(utools)
  for (const item of history) {
    removeDoc(utools, item)
  }
  deleteHistoryViewStates(utools, history.map(item => item._id))
  utools.dbStorage.removeItem(HISTORY_INDEX_KEY)
  utools.dbStorage.removeItem(HISTORY_INDEX_PATCH_KEY)
  return []
}
