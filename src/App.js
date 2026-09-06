import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CssBaseline from '@mui/material/CssBaseline'
import Snackbar from '@mui/material/Snackbar'
import { ThemeProvider } from '@mui/material/styles'
import EditorPane from './components/EditorPane'
import EditorSearchBar from './components/EditorSearchBar'
import HistoryPanel from './components/HistoryPanel'
import {
  clearHistory,
  createTransientHistoryEntry,
  deleteHistoryEntry,
  getNextHistoryEntry,
  getHistoryRetentionPlan,
  loadHistory,
  loadHistoryEntry,
  loadSettings,
  mergeHistoryDrafts,
  mergeHistoryChanges,
  normalizeSettings,
  renameHistoryEntry,
  reorderHistoryEntries,
  restoreHistoryEntry,
  restoreHistorySnapshot,
  saveHistoryEntry,
  saveSettings,
  setHistoryEntryMode,
  trimHistory,
  updateHistoryEntryDraft
} from './historyStore'
import { clearDrafts, clearExitSession, deleteDraft, loadDraftEntry, loadDraftSummaries, loadExitSession, loadLatestDraft, saveDraft, saveExitSession, summarizeDraft } from './draftStore'
import { getEncodingLabel } from './encoding'
import { AUTO_CODE_LANGUAGE, detectEditorMode, getDefaultCodeExtension, normalizeCodeLanguage, normalizeEditorMode } from './editorMode'
import {
  FEATURE_CODE,
  HISTORY_PREFIX,
  HISTORY_LIMIT_MODES,
  MAX_HISTORY_MAX,
  MAX_EDITOR_ZOOM,
  MAX_TEXT_LENGTH,
  MIN_EDITOR_ZOOM,
  STARTUP_BEHAVIORS
} from './constants'
import { changeIndent, deleteLineBreakBackward, deleteSelectedLines, findLineStart, insertLineBreak, toggleMarkdownWrap } from './editorCommands'
import { createGhibliTheme } from './styles'
import { createContentFontStack, createInterfaceFontStack } from './localFonts'
import { eventMatchesShortcut, getCopyShortcutAction, getEditingShortcutAction, isKeyboardEventComposing, isNativeTextEditingShortcut } from './shortcut'
import { findLiteralMatches, replaceLiteralMatches } from './textSearch'
import { countLines } from './textMetrics'
import { formatText, mapFormattedOffset } from './textFormatting'
import { getExternalText } from './pluginEntry'
import { prepareHistoryForRestore } from './undoSnapshot'
import { createPersistenceTask, isPersistenceTaskCurrent } from './editorSession'
import {
  clearSidebarExpandedState,
  loadHistoryViewState,
  loadLastViewedHistoryState,
  loadSidebarExpandedState,
  saveSidebarExpandedState,
  saveHistoryViewState,
  saveLastViewedHistoryState
} from './viewStateStore'
import { preloadConfetti, triggerConfetti } from './confettiEffect'
import { formatHistoryAge, resolveLocale, t } from './locales'
import { host } from './services/host'
import { loadAiModels } from './services/aiService'

const SettingsDialog = lazy(() => import(/* webpackChunkName: "settings-dialog" */ './components/SettingsDialog'))
const HelpDialog = lazy(() => import(/* webpackChunkName: "help-dialog" */ './components/HelpDialog'))
const GuideOverlay = lazy(() => import(/* webpackChunkName: "guide-overlay" */ './components/GuideOverlay'))
const ClearHistoryDialog = lazy(() => import(/* webpackChunkName: "clear-history-dialog" */ './components/ClearHistoryDialog'))
const RetentionConfirmDialog = lazy(() => import(/* webpackChunkName: "retention-dialog" */ './components/RetentionConfirmDialog'))
const GoToLineDialog = lazy(() => import(/* webpackChunkName: "goto-line-dialog" */ './components/GoToLineDialog'))
const ShareStudioDialog = lazy(() => import(/* webpackChunkName: "share-studio-dialog" */ './components/ShareStudioDialog.jsx'))
const AIAssistantDialog = lazy(() => import(/* webpackChunkName: "ai-assistant-dialog" */ './components/AIAssistantDialog.jsx'))
const SHARE_STUDIO_CONFETTI_OPTIONS = Object.freeze({ zIndex: 1500 })

function directImageAiConnection (settings) {
  if (!settings?.aiDirectEnabled) return null
  return {
    enabled: true,
    baseUrl: settings.aiDirectBaseUrl,
    apiKey: settings.aiDirectApiKey,
    model: settings.aiDirectModel
  }
}

function activeAiModel (settings) {
  return settings?.aiModel
}

function activeImageAiModel (settings) {
  return settings?.aiDirectEnabled ? settings.aiDirectModel : settings?.aiModel
}

function getSystemThemeMode () {
  try {
    if (window.utools?.isDarkColors) return window.utools.isDarkColors() ? 'dark' : 'light'
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light'
}

function resolveThemeMode (themeMode) {
  return themeMode === 'light' || themeMode === 'dark' ? themeMode : getSystemThemeMode()
}

function getInitialSidebarExpanded (settings) {
  if (!settings.rememberSidebarState || !window.utools) return true
  try {
    return loadSidebarExpandedState(window.utools)
  } catch {
    return true
  }
}

function getFileErrorMessage (error, language) {
  const messages = {
    BINARY_FILE: 'fileError.binary',
    ENCODING_LOSS: 'fileError.encodingLoss',
    FILE_TOO_LARGE: 'fileError.tooLarge',
    NOT_A_FILE: 'fileError.notFile',
    TEXT_TOO_LONG: 'fileError.textTooLong'
  }
  const key = messages[error?.code]
  return key ? t(language, key, { max: MAX_TEXT_LENGTH }) : t(language, 'fileError.generic')
}

function getFileDialogCopy (language) {
  return {
    openTitle: t(language, 'history.openFile'),
    saveTitle: t(language, 'history.saveFile'),
    saveButton: t(language, 'fileDialog.saveButton'),
    textFiles: t(language, 'fileDialog.textFiles'),
    allFiles: t(language, 'fileDialog.allFiles'),
    defaultName: t(language, 'fileDialog.defaultName'),
    detachRequired: t(language, 'fileDialog.detachRequired')
  }
}

function getFileMetadata (file) {
  if (!file || typeof file !== 'object') return file
  const metadata = { ...file }
  delete metadata.content
  return metadata
}

function readEditorSelection (editor) {
  if (!editor) return null
  if (typeof editor.getSourceSelection === 'function') {
    const sourceSelection = editor.getSourceSelection()
    if (sourceSelection) return sourceSelection
  }
  const selectionStart = Number(editor.selectionStart)
  const selectionEnd = Number(editor.selectionEnd)
  if (!Number.isFinite(selectionStart) || !Number.isFinite(selectionEnd)) return null
  return {
    selectionStart: Math.max(0, Math.floor(selectionStart)),
    selectionEnd: Math.max(0, Math.floor(selectionEnd))
  }
}

function countNormalizedLineBreaks (text) {
  return (String(text).match(/\n/g) || []).length
}

function readEditorViewState (editor, editorMode) {
  const selection = readEditorSelection(editor)
  if (!selection) return null
  const scrollTop = Number(editor.scrollTop)
  const scrollLeft = Number(editor.scrollLeft)
  return {
    ...selection,
    scrollTop: Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0,
    scrollLeft: Number.isFinite(scrollLeft) ? Math.max(0, scrollLeft) : 0,
    editorMode: normalizeEditorMode(editorMode)
  }
}

function hasValidEditorViewState (state, editorMode) {
  const hasStart = state?.selectionStart !== null && state?.selectionStart !== '' && Number.isFinite(Number(state?.selectionStart))
  const hasEnd = state?.selectionEnd !== null && state?.selectionEnd !== '' && Number.isFinite(Number(state?.selectionEnd))
  return hasStart && hasEnd &&
    (!state.editorMode || state.editorMode === normalizeEditorMode(editorMode))
}

const DRAFT_AUTOSAVE_DELAY = 150
const UNDO_HISTORY_LIMIT = 100
const TEXT_UNDO_MERGE_DELAY = 700

function getNoticeDuration (severity) {
  if (severity === 'error') return 5200
  if (severity === 'warning') return 4000
  if (severity === 'info') return 3000
  return 2200
}

function App ({ initialSettings }) {
  const [settings, setSettings] = useState(() => normalizeSettings(initialSettings))
  const [initialSidebarExpanded] = useState(() => getInitialSidebarExpanded(settings))
  const [theme, setTheme] = useState(() => resolveThemeMode(settings.themeMode))
  const isDark = theme === 'dark'
  const interfaceFontStack = useMemo(() => createInterfaceFontStack(settings.interfaceFont), [settings.interfaceFont])
  const contentFontStack = useMemo(() => createContentFontStack(settings.contentFont), [settings.contentFont])
  const ghibliTheme = useMemo(() => createGhibliTheme(isDark, interfaceFontStack), [interfaceFontStack, isDark])
  const [text, setText] = useState('')
  const [history, setHistory] = useState([])
  const [selectedHistoryId, setSelectedHistoryId] = useState(null)
  const [latestCreatedHistoryId, setLatestCreatedHistoryId] = useState(null)
  const [systemLanguage, setSystemLanguage] = useState(() => navigator.languages?.[0] || navigator.language)
  const language = useMemo(() => resolveLocale(settings.language, systemLanguage), [settings.language, systemLanguage])
  const [sidebarExpanded, setSidebarExpanded] = useState(initialSidebarExpanded)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState('general')
  const [helpOpen, setHelpOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(-1)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchMode, setSearchMode] = useState('find')
  const [goToLineOpen, setGoToLineOpen] = useState(false)
  const [goToLineValue, setGoToLineValue] = useState('1')
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const activeCodeDetectionRef = useRef(null)
  const [searchIndex, setSearchIndex] = useState(-1)
  const [markdownSearchMatches, setMarkdownSearchMatches] = useState([])
  const [notice, setNotice] = useState('')
  const [noticeSeverity, setNoticeSeverity] = useState('success')
  const [noticeId, setNoticeId] = useState(0)
  const [fileState, setFileState] = useState(null)
  const [historyPreview, setHistoryPreview] = useState(null)
  const [pendingRetentionChange, setPendingRetentionChange] = useState(null)
  const [shareStudio, setShareStudio] = useState(null)
  const [aiAssistant, setAiAssistant] = useState(null)
  const [availableAiModels, setAvailableAiModels] = useState([])
  const [aiModelsLoading, setAiModelsLoading] = useState(false)
  const aiModelsLoadedRef = useRef(false)

  const guideSteps = useMemo(() => [
    { selector: '#guide-history-list', placement: 'right', title: t(language, 'guide.historyTitle'), message: t(language, 'guide.historyMessage') },
    { selector: '#guide-sidebar-actions', placement: 'right', title: t(language, 'guide.actionsTitle'), message: `${t(language, 'guide.actionsMessage')}\n${t(language, 'autoSave.guideMessage')}` },
    { selector: '#guide-editor', placement: 'inside', title: t(language, 'guide.editorTitle'), message: `${t(language, 'help.featureMarkdownDesc')}\n\n• ${t(language, 'help.formattingDesc')}\n\n• ${t(language, 'help.aiDesc')}` },
    { selector: '#guide-statusbar', placement: 'top', title: t(language, 'guide.statusTitle'), message: `${t(language, 'guide.statusMessage')}\n\n• ${t(language, 'help.featureEncodingDesc')}\n\n• ${t(language, 'help.imageShareDesc')}\n\n• ${t(language, 'share.xhs.guideMessage')}` },
    { selector: '#guide-sidebar-tools', placement: 'right', title: t(language, 'guide.toolsTitle'), message: t(language, 'guide.toolsMessage') }
  ], [language])

  useEffect(() => {
    const handleLanguageChange = () => setSystemLanguage(navigator.languages?.[0] || navigator.language)
    window.addEventListener('languagechange', handleLanguageChange)
    return () => window.removeEventListener('languagechange', handleLanguageChange)
  }, [])

  useEffect(() => () => {
    if (historyMaintenanceTimerRef.current !== null) {
      clearTimeout(historyMaintenanceTimerRef.current)
      historyMaintenanceTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = t(language, 'app.name')
  }, [language])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-family', interfaceFontStack)
    document.documentElement.style.setProperty('--content-font-family', contentFontStack)
  }, [contentFontStack, interfaceFontStack])

  useEffect(() => {
    const preload = () => {
      import('./components/SettingsDialog')
      import('./components/HelpDialog')
      import('./components/GuideOverlay')
      import('./components/ClearHistoryDialog')
      import('./components/RetentionConfirmDialog')
      import('./components/GoToLineDialog')
      import('./components/ShareStudioDialog.jsx')
      import('./components/AIAssistantDialog.jsx')
      preloadConfetti()
    }
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(preload, { timeout: 1200 })
      : window.setTimeout(preload, 600)
    return () => {
      if (window.cancelIdleCallback && typeof idle === 'number') window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [])

  const textAreaRef = useRef(null)
  const searchInputRef = useRef(null)
  const replaceInputRef = useRef(null)
  const goToLineInputRef = useRef(null)
  const textRef = useRef('')
  const historyRef = useRef([])
  const activeHistoryIdRef = useRef(null)
  const latestCreatedHistoryIdRef = useRef(null)
  const settingsRef = useRef(settings)
  const fileRef = useRef(null)
  const sidebarExpandedRef = useRef(initialSidebarExpanded)
  const dirtyRef = useRef(false)
  const noticeTimerRef = useRef(null)
  const focusTimerRef = useRef(null)
  const historyMaintenanceTimerRef = useRef(null)
  const draftTimerRef = useRef(null)
  const editorRevisionRef = useRef(0)
  const compositionRef = useRef(false)
  const compositionStartRef = useRef(null)
  const historyPreviewScrollRef = useRef(null)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const undoReadyRef = useRef(false)
  const undoSuppressionRef = useRef(0)
  const editorUndoSequenceRef = useRef(0)
  const pendingSettingsUndoRef = useRef(null)
  const pendingCursorRestoreRef = useRef(null)
  const historyViewStatesRef = useRef(new Map())
  const historyBodyCacheRef = useRef(new Map())
  const draftSummariesRef = useRef(new Map())
  const draftBodiesRef = useRef(new Map())
  const pluginHandlersRef = useRef({ enter: null, out: null, pull: null })

  const nextEditorUndoMergeKey = useCallback((kind) => {
    editorUndoSequenceRef.current += 1
    return `${kind}:${editorUndoSequenceRef.current}`
  }, [])

  const refreshAiModels = useCallback((force = false) => {
    if (!force && (aiModelsLoadedRef.current || aiModelsLoading)) return
    aiModelsLoadedRef.current = true
    setAiModelsLoading(true)
    loadAiModels().then(models => {
      setAvailableAiModels(models)
    }).catch(error => {
      aiModelsLoadedRef.current = false
      console.warn('加载 AI 模型列表失败', error)
    }).finally(() => setAiModelsLoading(false))
  }, [aiModelsLoading])

  useEffect(() => {
    if (settingsOpen || aiAssistant?.mode === 'image-generation') refreshAiModels()
  }, [aiAssistant?.mode, refreshAiModels, settingsOpen])
  const cacheHistoryBody = useCallback((historyId, revision, content) => {
    if (!historyId || typeof content !== 'string') return
    const cache = historyBodyCacheRef.current
    cache.delete(historyId)
    cache.set(historyId, { _rev: revision, content })
    while (cache.size > 32) cache.delete(cache.keys().next().value)
  }, [])

  const cacheRemovedHistoryEntry = useCallback((item) => {
    if (!item || typeof item.content !== 'string') return
    cacheHistoryBody(item._id, item._rev, item.content)
  }, [cacheHistoryBody])

  const replaceDraftSummaries = useCallback((summaries) => {
    const nextSummaries = new Map(summaries.map(summary => [summary.historyId, summary]))
    draftSummariesRef.current = nextSummaries
    for (const [historyId, draft] of draftBodiesRef.current) {
      const summary = nextSummaries.get(historyId)
      if (!summary || summary.updatedAt !== draft.updatedAt) draftBodiesRef.current.delete(historyId)
    }
  }, [])

  const cacheDraftBody = useCallback((draft) => {
    const summary = summarizeDraft(draft)
    if (!summary) return null
    draftSummariesRef.current.set(draft.historyId, summary)
    draftBodiesRef.current.set(draft.historyId, draft)
    return draft
  }, [])

  const getDraftBody = useCallback((historyId) => {
    const cached = draftBodiesRef.current.get(historyId)
    if (cached) return cached
    if (!draftSummariesRef.current.has(historyId) || !window.utools) return null
    const loaded = loadDraftEntry(window.utools, historyId)
    return loaded ? cacheDraftBody(loaded) : null
  }, [cacheDraftBody])

  const forgetDraft = useCallback((utools, historyId) => {
    deleteDraft(utools, historyId)
    draftSummariesRef.current.delete(historyId)
    draftBodiesRef.current.delete(historyId)
  }, [])

  const resetDraftState = useCallback((utools) => {
    clearDrafts(utools)
    draftSummariesRef.current.clear()
    draftBodiesRef.current.clear()
  }, [])

  const saveLastViewedSafely = useCallback((utools, state) => {
    try {
      return saveLastViewedHistoryState(utools, state)
    } catch (error) {
      console.error('保存上次查看条目失败', error)
      return null
    }
  }, [])

  const saveEditorViewSafely = useCallback((utools, historyId, editorMode, viewState) => {
    if (hasValidEditorViewState(viewState, editorMode)) {
      historyViewStatesRef.current.set(historyId, viewState)
      try {
        saveHistoryViewState(utools, historyId, viewState)
      } catch (error) {
        console.error('保存条目显示位置失败', error)
      }
    }
    saveLastViewedSafely(utools, { historyId, ...(viewState || {}) })
  }, [saveLastViewedSafely])

  const focusEditorAndRestoreSelection = useCallback(() => {
    const editor = textAreaRef.current
    if (!editor) return false
    editor.focus()

    const pending = pendingCursorRestoreRef.current
    const restoreScrollPosition = (scrollTop, scrollLeft) => {
      const historyId = activeHistoryIdRef.current
      const applyPosition = () => {
        if (activeHistoryIdRef.current !== historyId || textAreaRef.current !== editor) return
        if (Number.isFinite(Number(scrollTop))) editor.scrollTop = Math.max(0, Number(scrollTop))
        if (Number.isFinite(Number(scrollLeft))) editor.scrollLeft = Math.max(0, Number(scrollLeft))
      }
      applyPosition()
      requestAnimationFrame(applyPosition)
    }
    let selectionRestored = false
    if (pending?.historyId === activeHistoryIdRef.current &&
      hasValidEditorViewState(pending, settingsRef.current.editorMode) &&
      (typeof editor.setSourceSelectionRange === 'function' || typeof editor.setSelectionRange === 'function')) {
      try {
        const setSelection = editor.setSourceSelectionRange || editor.setSelectionRange
        const selectionStart = pending.selectionStart
        const selectionEnd = pending.selectionEnd
        const scrollTop = pending.scrollTop
        const scrollLeft = pending.scrollLeft
        const restoreSelection = () => {
          if (activeHistoryIdRef.current !== pending.historyId || textAreaRef.current !== editor) return
          setSelection.call(editor, selectionStart, selectionEnd)
          restoreScrollPosition(scrollTop, scrollLeft)
        }
        restoreSelection()
        // 编辑器中的 Milkdown 可能在 mounted 回调之后替换初始文档。等待替换事务完成后，
        // 重新应用源码选择范围，确保光标仍落在用户原先的位置。
        requestAnimationFrame(restoreSelection)
        pendingCursorRestoreRef.current = null
        selectionRestored = true
      } catch (error) {
        console.error('恢复光标位置失败', error)
      }
    }
    if (!selectionRestored && (typeof editor.setSourceSelectionRange === 'function' || typeof editor.setSelectionRange === 'function')) {
      try {
        editor.scrollTop = 0
        editor.scrollLeft = 0
        const contentOverflows = typeof editor.isContentOverflowing === 'function'
          ? editor.isContentOverflowing()
          : Number(editor.scrollHeight) > Number(editor.clientHeight) + 1
        const usesSourceOffsets = typeof editor.setSourceSelectionRange === 'function'
        const setSelection = usesSourceOffsets
          ? editor.setSourceSelectionRange
          : editor.setSelectionRange
        const endOffset = usesSourceOffsets && typeof editor.getSourceEndSelectionOffset === 'function'
          ? editor.getSourceEndSelectionOffset()
          : typeof editor.getEndSelectionOffset === 'function'
            ? editor.getEndSelectionOffset()
            : textRef.current.length
        const targetOffset = contentOverflows ? 0 : endOffset
        setSelection.call(editor, targetOffset, targetOffset)
        restoreScrollPosition(0, 0)
        pendingCursorRestoreRef.current = null
      } catch (error) {
        console.error('定位光标到文本开头失败', error)
      }
    }
    return true
  }, [])

  const setEditorText = useCallback((value, isDirty = true) => {
    editorRevisionRef.current += 1
    textRef.current = value
    dirtyRef.current = isDirty
    setText(value)
  }, [])

  const applyEditorMode = useCallback((mode, codeLanguage = settingsRef.current.codeLanguage) => {
    const editorMode = normalizeEditorMode(mode)
    const normalizedCodeLanguage = normalizeCodeLanguage(codeLanguage)
    if (settingsRef.current.editorMode === editorMode && settingsRef.current.codeLanguage === normalizedCodeLanguage) return
    const nextSettings = { ...settingsRef.current, editorMode, codeLanguage: normalizedCodeLanguage }
    settingsRef.current = nextSettings
    setSettings(nextSettings)
  }, [])

  const syncFileState = useCallback((nextFile) => {
    fileRef.current = nextFile
    setFileState(nextFile)
  }, [])

  const syncLatestCreatedHistoryId = useCallback((itemId) => {
    latestCreatedHistoryIdRef.current = itemId
    setLatestCreatedHistoryId(itemId)
  }, [])

  const syncSidebarExpanded = useCallback((expanded) => {
    const normalized = expanded !== false
    sidebarExpandedRef.current = normalized
    setSidebarExpanded(normalized)
    const utools = window.utools
    if (!utools) return
    if (settingsRef.current.rememberSidebarState) saveSidebarExpandedState(utools, normalized)
    else clearSidebarExpandedState(utools)
  }, [])

  const removeEmptyTransientEntries = useCallback((items, exceptId = null) => (
    items.filter(item => item._id === exceptId || !item._transient || item.contentLength > 0 || Boolean(item.title?.trim()))
  ), [])

  const resolveHistoryEntry = useCallback((item) => {
    if (!item) return null
    if (item._id === activeHistoryIdRef.current) return { ...item, content: textRef.current }
    const draft = getDraftBody(item._id)
    if (draft) return { ...item, content: draft.content, editorMode: draft.editorMode, codeLanguage: draft.codeLanguage }
    const cached = historyBodyCacheRef.current.get(item._id)
    if (cached && (item._transient || cached._rev === item._rev)) return { ...item, content: cached.content }
    if (!window.utools) return item._transient ? { ...item, content: item.content || '' } : null
    const loaded = loadHistoryEntry(window.utools, item)
    if (loaded) cacheHistoryBody(item._id, loaded._rev, loaded.content)
    return loaded
  }, [cacheHistoryBody, getDraftBody])

  const syncHistoryState = useCallback((nextHistory) => {
    historyRef.current = nextHistory
    setHistory(nextHistory)
    const activeHistoryId = activeHistoryIdRef.current
    const activeEntry = activeHistoryId
      ? nextHistory.find(item => item._id === activeHistoryId)
      : null
    if (activeHistoryId && !activeEntry) {
      activeHistoryIdRef.current = null
      setSelectedHistoryId(null)
      setEditorText('', false)
      syncFileState(null)
      return
    }
    if (activeEntry) {
      setSelectedHistoryId(activeEntry._id)
      applyEditorMode(activeEntry.editorMode, activeEntry.codeLanguage)
      return
    }
    setSelectedHistoryId(null)
  }, [applyEditorMode, setEditorText, syncFileState])

  const rememberActiveEditorView = useCallback(() => {
    const historyId = activeHistoryIdRef.current
    if (!historyId) return null
    const viewState = readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
    if (!viewState) return null
    historyViewStatesRef.current.set(historyId, viewState)
    const activeEntry = historyRef.current.find(entry => entry._id === historyId)
    if (window.utools && activeEntry && !activeEntry._transient) {
      saveEditorViewSafely(window.utools, historyId, activeEntry.editorMode, viewState)
    }
    return viewState
  }, [saveEditorViewSafely])

  const getHistoryEditorView = useCallback((item) => {
    if (!item) return null
    const cached = historyViewStatesRef.current.get(item._id)
    if (hasValidEditorViewState(cached, item.editorMode)) return cached
    if (!window.utools || item._transient) return null
    try {
      const stored = loadHistoryViewState(window.utools, item._id)
      if (hasValidEditorViewState(stored, item.editorMode)) {
        historyViewStatesRef.current.set(item._id, stored)
        return stored
      }
    } catch (error) {
      console.error('读取条目显示位置失败', error)
    }
    return null
  }, [])

  const focusHistoryEntry = useCallback((item, focusEditor = true, requestedViewState) => {
    if (activeHistoryIdRef.current !== item?._id) rememberActiveEditorView()
    const loadedItem = item ? resolveHistoryEntry(item) : null
    const draft = item ? getDraftBody(item._id) : null
    const recordedView = requestedViewState === undefined
      ? (draft || getHistoryEditorView(item))
      : requestedViewState
    pendingCursorRestoreRef.current = item && hasValidEditorViewState(recordedView, item.editorMode)
      ? { historyId: item._id, ...recordedView }
      : item ? { historyId: item._id } : null
    activeHistoryIdRef.current = item?._id || null
    setSelectedHistoryId(item?._id || null)
    setEditorText(loadedItem?.content || '', Boolean(draft))
    if (item) applyEditorMode(draft?.editorMode || item.editorMode, draft?.codeLanguage || item.codeLanguage)
    syncFileState(draft?.file || null)
    if (window.utools && item && (!item._transient || item.contentLength > 0 || Boolean(item.title?.trim()) || draftSummariesRef.current.has(item._id))) {
      const storedView = hasValidEditorViewState(recordedView, item.editorMode) ? recordedView : null
      saveLastViewedSafely(window.utools, { historyId: item._id, ...(storedView || {}) })
    }
    if (focusEditor) requestAnimationFrame(focusEditorAndRestoreSelection)
  }, [applyEditorMode, focusEditorAndRestoreSelection, getDraftBody, getHistoryEditorView, rememberActiveEditorView, resolveHistoryEntry, saveLastViewedSafely, setEditorText, syncFileState])

  const captureUndoState = useCallback((options = {}) => {
    // 普通快照只保存索引和轻量元数据，避免把大段正文重复写入历史。涉及破坏性
    // 操作时，再由调用方明确指定需要恢复的完整条目。
    const requestedBodyIds = Array.isArray(options.bodyCacheIds)
      ? new Set(options.bodyCacheIds)
      : null
    const bodyCache = requestedBodyIds
      ? Object.fromEntries([...requestedBodyIds]
          .map(historyId => {
            const item = historyRef.current.find(entry => entry._id === historyId)
            const needsStoredBaseline = item && !item._transient && window.utools && (
              item._draft || (
                historyId === activeHistoryIdRef.current &&
                dirtyRef.current &&
                !settingsRef.current.autoSaveEntries
              )
            )
            if (needsStoredBaseline) {
              resolveHistoryEntry(item)
              const baseline = loadHistoryEntry(window.utools, item._draftBase || item)
              if (baseline && typeof baseline.content === 'string') {
                return [historyId, { _rev: baseline._rev, content: baseline.content }]
              }
            }
            const loaded = item ? resolveHistoryEntry(item) : null
            if (loaded && typeof loaded.content === 'string') {
              return [historyId, { _rev: loaded._rev, content: loaded.content }]
            }
            const cached = historyBodyCacheRef.current.get(historyId)
            return [historyId, cached && typeof cached.content === 'string'
              ? cached
              : null]
          })
          .filter(([, value]) => value))
      : undefined

    return {
      history: historyRef.current,
      selectedHistoryId: activeHistoryIdRef.current,
      latestCreatedHistoryId: latestCreatedHistoryIdRef.current,
      text: textRef.current,
      dirty: dirtyRef.current,
      settings: settingsRef.current,
      fileState: fileRef.current,
      sidebarExpanded: sidebarExpandedRef.current,
      drafts: options.includeDrafts === false
        ? undefined
        : Object.fromEntries([...draftSummariesRef.current].map(([historyId, summary]) => [
            historyId,
            draftBodiesRef.current.get(historyId) || summary
          ])),
      ...(bodyCache ? { bodyCache } : {})
    }
  }, [resolveHistoryEntry])

  const recordUndoChange = useCallback((before, after, options = {}) => {
    if (!undoReadyRef.current || undoSuppressionRef.current > 0) return
    const unchanged = before.history === after.history &&
      before.selectedHistoryId === after.selectedHistoryId &&
      before.latestCreatedHistoryId === after.latestCreatedHistoryId &&
      before.text === after.text &&
      before.dirty === after.dirty &&
      before.settings === after.settings &&
      before.fileState === after.fileState &&
      before.sidebarExpanded === after.sidebarExpanded
    if (unchanged) return

    const now = Date.now()
    const undoStack = undoStackRef.current
    const previous = undoStack[undoStack.length - 1]
    if (options.kind === 'text' && previous?.kind === 'text' &&
      previous.mergeKey === options.mergeKey && now - previous.time <= TEXT_UNDO_MERGE_DELAY) {
      previous.after = after
      previous.time = now
    } else {
      undoStack.push({ before, after, kind: options.kind || 'operation', mergeKey: options.mergeKey || null, time: now })
      if (undoStack.length > UNDO_HISTORY_LIMIT) undoStack.shift()
    }
    redoStackRef.current = []
  }, [])

  const performUndoable = useCallback((operation, options = {}) => {
    const before = options.before || captureUndoState(options)
    let completed = false
    undoSuppressionRef.current += 1
    try {
      const result = operation()
      completed = result !== false
      return result
    } finally {
      undoSuppressionRef.current -= 1
      if (completed) recordUndoChange(before, captureUndoState(options), options)
    }
  }, [captureUndoState, recordUndoChange])

  const showNotice = useCallback((message, severity = 'success') => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    setNotice(message)
    setNoticeSeverity(severity)
    setNoticeId(id => id + 1)
    noticeTimerRef.current = setTimeout(() => setNotice(''), getNoticeDuration(severity))
  }, [])

  const persistDraft = useCallback((content, isDirty, quiet = false) => {
    if (compositionRef.current) return false
    const utools = window.utools
    if (!utools) return false
    const historyId = activeHistoryIdRef.current
    if (!historyId) return false
    try {
      if (!isDirty) {
        forgetDraft(utools, historyId)
        return true
      }
      const activeEntry = historyRef.current.find(item => item._id === historyId)
      if (activeEntry?._transient && !content.trim() && !activeEntry.title?.trim()) {
        forgetDraft(utools, historyId)
        dirtyRef.current = false
        return true
      }
      const viewState = readEditorViewState(textAreaRef.current, settingsRef.current.editorMode) || {}
      const draft = saveDraft(utools, {
        historyId,
        content,
        dirty: true,
        editorMode: settingsRef.current.editorMode,
        codeLanguage: settingsRef.current.codeLanguage,
        ...viewState,
        file: fileRef.current
      })
      cacheDraftBody(draft)
      syncHistoryState(updateHistoryEntryDraft(historyRef.current, historyId, content, settingsRef.current.editorMode, settingsRef.current.codeLanguage))
      saveLastViewedSafely(utools, { historyId, ...viewState })
      return true
    } catch (error) {
      console.error('保存恢复草稿失败', error)
      if (!quiet) showNotice(t(settingsRef.current.language, 'notice.draftSaveFailed'), 'error')
      return false
    }
  }, [cacheDraftBody, forgetDraft, saveLastViewedSafely, showNotice, syncHistoryState])

  const applyUndoState = useCallback((snapshot, command) => {
    const utools = window.utools
    if (!utools) throw new Error(t(settingsRef.current.language, 'notice.apiUnavailable'))

    if (command?.kind === 'text') {
      snapshot = {
        ...snapshot,
        settings: {
          ...snapshot.settings,
          editorMode: settingsRef.current.editorMode,
          codeLanguage: settingsRef.current.codeLanguage
        }
      }
    }

    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }

    const restoredSettings = saveSettings(utools, snapshot.settings)
    const canRestoreTextEntryOnly = command?.kind === 'text' &&
      command.before.selectedHistoryId &&
      command.before.selectedHistoryId === command.after.selectedHistoryId
    let restoredHistory = null

    if (canRestoreTextEntryOnly && !snapshot.settings.autoSaveEntries) {
      const currentEntry = historyRef.current.find(item => item._id === snapshot.selectedHistoryId)
      if (currentEntry) {
        if (snapshot.dirty) {
          restoredHistory = updateHistoryEntryDraft(
            historyRef.current,
            snapshot.selectedHistoryId,
            snapshot.text,
            snapshot.settings.editorMode,
            snapshot.settings.codeLanguage
          )
          cacheDraftBody(saveDraft(utools, {
            historyId: snapshot.selectedHistoryId,
            content: snapshot.text,
            dirty: true,
            editorMode: snapshot.settings.editorMode,
            codeLanguage: snapshot.settings.codeLanguage,
            file: snapshot.fileState
          }))
        } else {
          forgetDraft(utools, snapshot.selectedHistoryId)
          restoredHistory = historyRef.current.map(item => item._id === snapshot.selectedHistoryId ? (item._draftBase || item) : item)
        }
      }
    } else if (canRestoreTextEntryOnly) {
      const snapshotEntry = snapshot.history.find(item => item._id === snapshot.selectedHistoryId)
      const currentEntry = historyRef.current.find(item => item._id === snapshot.selectedHistoryId)
      if (snapshotEntry && currentEntry) {
        const currentIndex = historyRef.current.findIndex(item => item._id === snapshot.selectedHistoryId)
        if (snapshot.text.trim() || snapshotEntry.title?.trim()) {
          restoredHistory = restoreHistoryEntry(utools, historyRef.current, {
            ...snapshotEntry,
            _rev: currentEntry._rev,
            content: snapshot.text,
            editorMode: snapshot.settings.editorMode,
            codeLanguage: snapshot.settings.codeLanguage
          }, currentIndex)
        } else {
          restoredHistory = saveHistoryEntry(
            utools,
            historyRef.current,
            '',
            { maxHistory: MAX_HISTORY_MAX },
            { historyId: snapshot.selectedHistoryId, editorMode: snapshot.settings.editorMode, codeLanguage: snapshot.settings.codeLanguage }
          )
        }
      }
    }

    if (!restoredHistory) {
      const targetHistory = prepareHistoryForRestore(
        snapshot.history,
        snapshot.selectedHistoryId,
        snapshot.text,
        snapshot.settings.editorMode,
        {
          codeLanguage: snapshot.settings.codeLanguage,
          persistSelectedText: snapshot.settings.autoSaveEntries || !snapshot.dirty,
          persistTransientEntries: snapshot.settings.autoSaveEntries
        }
      )
      const availableBodyCache = Object.fromEntries(historyBodyCacheRef.current)
      const persistedHistory = restoreHistorySnapshot(utools, targetHistory, {
        ...availableBodyCache,
        ...snapshot.bodyCache
      })
      const persistedById = new Map(persistedHistory.map(item => [item._id, item]))
      restoredHistory = targetHistory
        .map(item => item._transient ? item : persistedById.get(item._id))
        .filter(Boolean)

      const desiredDrafts = new Map(Object.entries(snapshot.drafts || {}).map(([historyId, draft]) => {
        if (typeof draft?.content === 'string') return [historyId, draft]
        return [historyId, loadDraftEntry(utools, historyId) || draft]
      }))
      const restoredById = new Map(restoredHistory.map(item => [item._id, item]))
      restoredHistory = snapshot.history.map(item => {
        if (item._transient) {
          if (snapshot.settings.autoSaveEntries) return restoredById.get(item._id)
          const content = item._id === snapshot.selectedHistoryId
            ? snapshot.text
            : desiredDrafts.get(item._id)?.content ?? snapshot.bodyCache?.[item._id]?.content ?? item.content ?? ''
          return { ...item, content }
        }
        if (item._id === snapshot.selectedHistoryId && snapshot.dirty && !snapshot.settings.autoSaveEntries) {
          const baseline = restoredById.get(item._id)
          return baseline
            ? updateHistoryEntryDraft([baseline], item._id, snapshot.text, snapshot.settings.editorMode, snapshot.settings.codeLanguage)[0]
            : null
        }
        if (!item._draft) return restoredById.get(item._id)
        const baseline = restoredById.get(item._id)
        const content = item._id === snapshot.selectedHistoryId
          ? snapshot.text
          : desiredDrafts.get(item._id)?.content
        return baseline && typeof content === 'string'
          ? updateHistoryEntryDraft([baseline], item._id, content, item.editorMode, item.codeLanguage)[0]
          : baseline
      }).filter(Boolean)

      resetDraftState(utools)
      for (const item of restoredHistory) {
        if (!item._draft && !(item._transient && item.contentLength > 0)) continue
        const storedDraft = desiredDrafts.get(item._id)
        const content = item._id === snapshot.selectedHistoryId
          ? snapshot.text
          : snapshot.bodyCache?.[item._id]?.content ?? storedDraft?.content ?? item.content
        if (typeof content !== 'string') continue
        const draft = saveDraft(utools, {
          historyId: item._id,
          content,
          dirty: true,
          editorMode: item.editorMode,
          codeLanguage: item.codeLanguage,
          file: item._id === snapshot.selectedHistoryId ? snapshot.fileState : storedDraft?.file
        })
        cacheDraftBody(draft)
      }
    }
    const restoredEntry = snapshot.selectedHistoryId
      ? restoredHistory.find(item => item._id === snapshot.selectedHistoryId)
      : null
    if (restoredEntry && !restoredEntry._transient && !restoredEntry._draft) {
      cacheHistoryBody(restoredEntry._id, restoredEntry._rev, snapshot.text)
    } else if (snapshot.selectedHistoryId) {
      historyBodyCacheRef.current.delete(snapshot.selectedHistoryId)
    }
    rememberActiveEditorView()
    const restoredView = getHistoryEditorView(restoredEntry)
    pendingCursorRestoreRef.current = restoredEntry && hasValidEditorViewState(restoredView, restoredEntry.editorMode)
      ? { historyId: restoredEntry._id, ...restoredView }
      : restoredEntry ? { historyId: restoredEntry._id } : null

    settingsRef.current = restoredSettings
    setSettings(restoredSettings)
    setTheme(resolveThemeMode(restoredSettings.themeMode))
    historyRef.current = restoredHistory
    setHistory(restoredHistory)
    activeHistoryIdRef.current = restoredEntry?._id || null
    setSelectedHistoryId(restoredEntry?._id || null)
    syncLatestCreatedHistoryId(restoredHistory.some(item => item._id === snapshot.latestCreatedHistoryId)
      ? snapshot.latestCreatedHistoryId
      : null)
    const restoredDirty = Boolean(restoredEntry && snapshot.dirty && !snapshot.settings.autoSaveEntries)
    setEditorText(restoredEntry ? snapshot.text : '', restoredDirty)
    syncFileState(snapshot.fileState)
    syncSidebarExpanded(snapshot.sidebarExpanded)
    setHistoryPreview(null)
    pendingSettingsUndoRef.current = null
    if (restoredEntry && restoredDirty) {
      const restoredDraft = loadDraftEntry(utools, restoredEntry._id) || saveDraft(utools, {
        historyId: restoredEntry._id,
        content: snapshot.text,
        dirty: true,
        editorMode: restoredEntry.editorMode,
        codeLanguage: restoredEntry.codeLanguage,
        file: snapshot.fileState
      })
      cacheDraftBody(restoredDraft)
    } else if (restoredEntry) {
      persistDraft(snapshot.text, false, true)
    }
    requestAnimationFrame(focusEditorAndRestoreSelection)
  }, [cacheDraftBody, cacheHistoryBody, focusEditorAndRestoreSelection, forgetDraft, getHistoryEditorView, persistDraft, rememberActiveEditorView, resetDraftState, setEditorText, syncFileState, syncLatestCreatedHistoryId, syncSidebarExpanded])

  const handleUndo = useCallback(() => {
    const undoStack = undoStackRef.current
    const command = undoStack[undoStack.length - 1]
    if (!command) {
      showNotice(t(settingsRef.current.language, 'notice.nothingUndo'))
      return false
    }

    undoSuppressionRef.current += 1
    try {
      applyUndoState(command.before, command)
      undoStack.pop()
      redoStackRef.current.push(command)
      if (command.kind !== 'text') showNotice(t(settingsRef.current.language, 'notice.undone'))
      return true
    } catch (error) {
      console.error('撤销操作失败', error)
      showNotice(t(settingsRef.current.language, 'notice.undoFailed'), 'error')
      return false
    } finally {
      undoSuppressionRef.current -= 1
    }
  }, [applyUndoState, showNotice])

  const handleRedo = useCallback(() => {
    const redoStack = redoStackRef.current
    const command = redoStack[redoStack.length - 1]
    if (!command) {
      showNotice(t(settingsRef.current.language, 'notice.nothingRedo'))
      return false
    }

    undoSuppressionRef.current += 1
    try {
      applyUndoState(command.after, command)
      redoStack.pop()
      undoStackRef.current.push(command)
      if (command.kind !== 'text') showNotice(t(settingsRef.current.language, 'notice.redone'))
      return true
    } catch (error) {
      console.error('重做操作失败', error)
      showNotice(t(settingsRef.current.language, 'notice.redoFailed'), 'error')
      return false
    } finally {
      undoSuppressionRef.current -= 1
    }
  }, [applyUndoState, showNotice])

  const persistText = useCallback((content) => {
    if (compositionRef.current) return false
    const activeHistoryId = activeHistoryIdRef.current
    if (!content.trim() && !activeHistoryId) {
      dirtyRef.current = false
      return true
    }
    if (!dirtyRef.current) return true

    const utools = window.utools
    if (!utools) {
      showNotice(t(settingsRef.current.language, 'notice.apiUnavailable'), 'error')
      return false
    }

    try {
      const previousHistoryIds = new Set(historyRef.current.map(item => item._id))
      const nextHistory = saveHistoryEntry(
        utools,
        historyRef.current,
        content,
        settingsRef.current,
        {
          historyId: activeHistoryId,
          editorMode: settingsRef.current.editorMode,
          codeLanguage: settingsRef.current.codeLanguage,
          onBeforeRemove: cacheRemovedHistoryEntry
        }
      )
      const persistedEntry = nextHistory.find(item => item._id === activeHistoryId) || nextHistory.find(item => !previousHistoryIds.has(item._id))
      if (persistedEntry && !persistedEntry._transient) {
        cacheHistoryBody(persistedEntry._id, persistedEntry._rev, content)
        const viewState = readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
        saveEditorViewSafely(utools, persistedEntry._id, persistedEntry.editorMode, viewState)
      } else if (activeHistoryId) {
        historyBodyCacheRef.current.delete(activeHistoryId)
      }
      syncHistoryState(nextHistory)
      const createdHistoryId = nextHistory.find(item => !previousHistoryIds.has(item._id))?._id || null
      const savedHistoryId = activeHistoryId && nextHistory.some(item => item._id === activeHistoryId)
        ? activeHistoryId
        : createdHistoryId
      activeHistoryIdRef.current = savedHistoryId
      setSelectedHistoryId(savedHistoryId)
      if (createdHistoryId) syncLatestCreatedHistoryId(createdHistoryId)
      dirtyRef.current = false
      persistDraft(content, false, true)
      return true
    } catch (error) {
      console.error('保存历史记录失败', error)
      persistDraft(content, true, true)
      showNotice(t(settingsRef.current.language, 'notice.saveFailed'), 'error')
      return false
    }
  }, [cacheHistoryBody, cacheRemovedHistoryEntry, persistDraft, saveEditorViewSafely, showNotice, syncHistoryState, syncLatestCreatedHistoryId])

  const preserveCurrentContent = useCallback((content = textRef.current) => {
    if (settingsRef.current.autoSaveEntries) return persistText(content)
    return persistDraft(content, dirtyRef.current, true)
  }, [persistDraft, persistText])

  const getCurrentPersistenceSession = useCallback(() => ({
    historyId: activeHistoryIdRef.current,
    content: textRef.current,
    dirty: dirtyRef.current,
      editorMode: settingsRef.current.editorMode,
      codeLanguage: settingsRef.current.codeLanguage,
    autoSaveEntries: settingsRef.current.autoSaveEntries,
    revision: editorRevisionRef.current
  }), [])

  const cancelPendingPersistence = useCallback(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
  }, [])

  const scheduleCurrentPersistence = useCallback(() => {
    cancelPendingPersistence()
    if (compositionRef.current) return
    const task = createPersistenceTask(getCurrentPersistenceSession())
    if (!task?.dirty) return
    draftTimerRef.current = setTimeout(() => {
      draftTimerRef.current = null
      if (!isPersistenceTaskCurrent(task, getCurrentPersistenceSession())) return
      preserveCurrentContent(task.content)
    }, DRAFT_AUTOSAVE_DELAY)
  }, [cancelPendingPersistence, getCurrentPersistenceSession, preserveCurrentContent])

  const updateEditorText = useCallback((value, options = {}) => {
    if (value.length > MAX_TEXT_LENGTH) {
      showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
      return false
    }
    if (compositionRef.current && !options.commitComposition) {
      textRef.current = value
      setText(value)
      return true
    }
    const previousValue = options.previousValue ?? textRef.current
    if (value === previousValue) return false
    const before = options.before || captureUndoState({ includeDrafts: false })
    if (!activeHistoryIdRef.current && value.length > 0 && window.utools) {
      const createdEntry = createTransientHistoryEntry(historyRef.current, settingsRef.current.editorMode, { codeLanguage: settingsRef.current.codeLanguage })
      syncHistoryState([createdEntry, ...removeEmptyTransientEntries(historyRef.current).filter(item => item._id !== createdEntry._id)])
      focusHistoryEntry(createdEntry, false)
      syncLatestCreatedHistoryId(createdEntry._id)
    }
    setEditorText(value, true)
    const after = captureUndoState({ includeDrafts: false })
    recordUndoChange(before, after, {
      kind: 'text',
      mergeKey: options.mergeKey || `${after.selectedHistoryId || 'draft'}:${after.settings.editorMode}:${after.settings.codeLanguage}`
    })
    return true
  }, [captureUndoState, focusHistoryEntry, recordUndoChange, removeEmptyTransientEntries, setEditorText, showNotice, syncHistoryState, syncLatestCreatedHistoryId])

  const commitComposition = useCallback(() => {
    const start = compositionStartRef.current
    compositionStartRef.current = null
    compositionRef.current = false
    if (start && textRef.current !== start.text) {
      updateEditorText(textRef.current, {
        commitComposition: true,
        previousValue: start.text,
        before: start.before
      })
    }
    return {
      content: textRef.current,
      viewState: readEditorViewState(textAreaRef.current, settingsRef.current.editorMode) || start?.viewState || null
    }
  }, [updateEditorText])

  const discardComposition = useCallback(() => {
    const start = compositionStartRef.current
    compositionStartRef.current = null
    compositionRef.current = false
    if (start && textRef.current !== start.text) setEditorText(start.text, start.dirty)
    return {
      content: start?.text ?? textRef.current,
      viewState: start?.viewState || readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
    }
  }, [setEditorText])

  const getFileServices = useCallback(() => {
    if (window.fileServices?.readFile && window.fileServices?.saveTextFile) return window.fileServices
    showNotice(t(settingsRef.current.language, 'notice.fileRequiresUtools'), 'warning')
    return null
  }, [showNotice])

  const handleEditorModeChange = useCallback((mode, requestedCodeLanguage = settingsRef.current.codeLanguage) => {
    const nextMode = normalizeEditorMode(mode)
    const codeLanguage = normalizeCodeLanguage(requestedCodeLanguage)
    if (settingsRef.current.editorMode === nextMode && settingsRef.current.codeLanguage === codeLanguage) return
    try {
      const nextSettings = saveSettings(window.utools, { ...settingsRef.current, editorMode: nextMode, codeLanguage })
      settingsRef.current = nextSettings
      setSettings(nextSettings)
      const activeHistoryId = activeHistoryIdRef.current
      if (activeHistoryId) {
        syncHistoryState(setHistoryEntryMode(window.utools, historyRef.current, activeHistoryId, nextMode, codeLanguage))
        if (dirtyRef.current) persistDraft(textRef.current, true, true)
      }
    } catch (error) {
      console.error('保存编辑模式失败', error)
      showNotice(t(settingsRef.current.language, 'notice.modeSaveFailed'), 'error')
    }
  }, [persistDraft, showNotice, syncHistoryState])

  const handleEditorModeChangeWithSelection = useCallback((mode) => {
    const selection = readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
    const historyId = activeHistoryIdRef.current
    const nextMode = normalizeEditorMode(mode)
    const enteringCodeMode = settingsRef.current.editorMode !== 'code' && nextMode === 'code'
    handleEditorModeChange(nextMode, enteringCodeMode ? AUTO_CODE_LANGUAGE : settingsRef.current.codeLanguage)
    if (selection && historyId) {
      const pendingSelection = { historyId, ...selection, editorMode: nextMode }
      pendingCursorRestoreRef.current = pendingSelection
    // 编辑器组件会在模式切换时异步替换。React 和 Milkdown 都挂载完成后再次设置
    // 源码选择范围，否则初始文档事务可能把选择位置重置到开头。
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (activeHistoryIdRef.current !== historyId || settingsRef.current.editorMode !== nextMode) return
          pendingCursorRestoreRef.current = pendingSelection
          focusEditorAndRestoreSelection()
        })
      })
    }
  }, [focusEditorAndRestoreSelection, handleEditorModeChange])

  const handleToggleEditorMode = useCallback(() => {
    handleEditorModeChangeWithSelection(settingsRef.current.editorMode === 'markdown' ? 'text' : 'markdown')
  }, [handleEditorModeChangeWithSelection])

  const handleCodeLanguageChange = useCallback((codeLanguage) => {
    handleEditorModeChange('code', codeLanguage)
  }, [handleEditorModeChange])

  const handleCodeDetectionChange = useCallback((detection) => {
    activeCodeDetectionRef.current = detection
  }, [])

  const handleThemeModeChange = useCallback((themeMode) => {
    if (settingsRef.current.themeMode === themeMode) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, themeMode })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
        setTheme(resolveThemeMode(nextSettings.themeMode))
      })
    } catch (error) {
      console.error('保存主题设置失败', error)
      showNotice(t(settingsRef.current.language, 'notice.themeSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleLanguageChange = useCallback((language) => {
    if (settingsRef.current.language === language) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, language })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存语言设置失败', error)
      showNotice(t(settingsRef.current.language, 'notice.languageSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleInterfaceFontChange = useCallback((interfaceFont) => {
    if (settingsRef.current.interfaceFont === interfaceFont) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, interfaceFont })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存界面字体失败', error)
      showNotice(t(settingsRef.current.language, 'notice.settingsSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleContentFontChange = useCallback((contentFont) => {
    if (settingsRef.current.contentFont === contentFont) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, contentFont })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存内容字体失败', error)
      showNotice(t(settingsRef.current.language, 'notice.settingsSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleImageSaveDirectoryChange = useCallback((imageSaveDirectory) => {
    const normalizedDirectory = typeof imageSaveDirectory === 'string' ? imageSaveDirectory.trim() : ''
    if (settingsRef.current.imageSaveDirectory === normalizedDirectory) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, imageSaveDirectory: normalizedDirectory })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存图片位置设置失败', error)
      showNotice(t(settingsRef.current.language, 'notice.settingsSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleStartupBehaviorChange = useCallback((startupBehavior) => {
    const normalizedBehavior = startupBehavior === STARTUP_BEHAVIORS.RESTORE
      ? STARTUP_BEHAVIORS.RESTORE
      : STARTUP_BEHAVIORS.NEW
    if (settingsRef.current.startupBehavior === normalizedBehavior) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, startupBehavior: normalizedBehavior })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存启动行为失败', error)
      showNotice(t(settingsRef.current.language, 'notice.startupSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleSidebarShortcutChange = useCallback((sidebarShortcut) => {
    try {
      let nextSettings
      performUndoable(() => {
        nextSettings = saveSettings(window.utools, { ...settingsRef.current, sidebarShortcut })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
      showNotice(t(nextSettings.language, 'notice.shortcutSet', { shortcut: nextSettings.sidebarShortcut }))
    } catch (error) {
      console.error('保存功能区快捷键失败', error)
      showNotice(t(settingsRef.current.language, 'notice.shortcutSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleRememberSidebarStateChange = useCallback((rememberSidebarState) => {
    if (settingsRef.current.rememberSidebarState === rememberSidebarState) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, rememberSidebarState })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
        if (nextSettings.rememberSidebarState) saveSidebarExpandedState(window.utools, sidebarExpandedRef.current)
        else clearSidebarExpandedState(window.utools)
      })
    } catch (error) {
      console.error('保存功能栏状态记忆设置失败', error)
      showNotice(t(settingsRef.current.language, 'notice.settingsSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const preserveCurrentDraft = useCallback(() => {
    cancelPendingPersistence()
    const { content: currentText } = discardComposition()
    if (!dirtyRef.current || (!currentText.trim() && !activeHistoryIdRef.current)) return true
    return preserveCurrentContent(currentText)
  }, [cancelPendingPersistence, discardComposition, preserveCurrentContent])

  const createStartupHistoryEntry = useCallback((currentHistory) => {
    const createdEntry = createTransientHistoryEntry(currentHistory, settingsRef.current.editorMode, { codeLanguage: settingsRef.current.codeLanguage })
    const nextHistory = [createdEntry, ...removeEmptyTransientEntries(currentHistory).filter(item => item._id !== createdEntry._id)]

    syncHistoryState(nextHistory)
    focusHistoryEntry(createdEntry, false)
    syncLatestCreatedHistoryId(createdEntry._id)
    return createdEntry
  }, [focusHistoryEntry, removeEmptyTransientEntries, syncHistoryState, syncLatestCreatedHistoryId])

  const restoreDraftSession = useCallback((draft, currentHistory) => {
    if (!draft?.dirty || !draft.historyId) return false
    const draftEntry = currentHistory.find(item => item._id === draft.historyId)
    if (!draftEntry) return false
    focusHistoryEntry(draftEntry, false, draft)
    showNotice(t(settingsRef.current.language, 'notice.draftRecovered'))
    return true
  }, [focusHistoryEntry, showNotice])

  const maintainHistory = useCallback((utools) => {
    const mergedHistory = mergeHistoryDrafts(loadHistory(utools), [...draftSummariesRef.current.values()])
    const mergedById = new Map(mergedHistory.map(item => [item._id, item]))
    const currentHistory = historyRef.current
      .map(item => item._transient || item._draft ? item : mergedById.get(item._id))
      .filter(Boolean)
    const currentIds = new Set(currentHistory.map(item => item._id))
    currentHistory.push(...mergedHistory.filter(item => !currentIds.has(item._id)))
    const { removed } = getHistoryRetentionPlan(currentHistory, settingsRef.current)
    if (removed.length === 0) return
    syncHistoryState(trimHistory(utools, currentHistory, settingsRef.current, {
      onBeforeRemove: cacheRemovedHistoryEntry
    }))
  }, [cacheRemovedHistoryEntry, syncHistoryState])

  const scheduleHistoryMaintenance = useCallback((utools) => {
    if (historyMaintenanceTimerRef.current !== null) return
    historyMaintenanceTimerRef.current = window.setTimeout(() => {
      historyMaintenanceTimerRef.current = null
      try {
        maintainHistory(utools)
      } catch (error) {
        console.error('维护历史记录失败', error)
      }
    }, 0)
  }, [maintainHistory])

  const consumeAutoSaveOffExit = useCallback((utools) => {
    const exitSession = loadExitSession(utools)
    if (!exitSession) return

    if (settingsRef.current.startupBehavior !== STARTUP_BEHAVIORS.RESTORE) {
      clearDrafts(utools)
      clearExitSession(utools)
      return
    }

    // 先清理旧会话遗留的所有草稿，再只重建上次插件退出时记录的那一条，
    // 避免过期恢复数据在本次启动时重新出现。
    clearDrafts(utools)
    if (exitSession.transient) {
      saveDraft(utools, {
        historyId: exitSession.historyId,
        content: exitSession.content,
        dirty: true,
        editorMode: exitSession.editorMode,
        codeLanguage: exitSession.codeLanguage,
        selectionStart: exitSession.selectionStart,
        selectionEnd: exitSession.selectionEnd,
        scrollTop: exitSession.scrollTop,
        scrollLeft: exitSession.scrollLeft,
        file: exitSession.file
      })
    }
    saveLastViewedSafely(utools, {
      historyId: exitSession.historyId,
      selectionStart: exitSession.selectionStart,
      selectionEnd: exitSession.selectionEnd,
      scrollTop: exitSession.scrollTop,
      scrollLeft: exitSession.scrollLeft,
      editorMode: exitSession.editorMode
    })
    clearExitSession(utools)
  }, [saveLastViewedSafely])

  const applyStartupBehavior = useCallback((utools) => {
    pendingCursorRestoreRef.current = null
    if (!preserveCurrentDraft()) return false
    if (!settingsRef.current.autoSaveEntries) consumeAutoSaveOffExit(utools)
    const drafts = loadDraftSummaries(utools)
    replaceDraftSummaries(drafts)
    const latestHistory = mergeHistoryDrafts(loadHistory(utools), drafts)
    syncHistoryState(latestHistory)

    if (settingsRef.current.startupBehavior === STARTUP_BEHAVIORS.RESTORE) {
      const lastViewedState = loadLastViewedHistoryState(utools)
      const lastViewedEntry = latestHistory.find(item => item._id === lastViewedState?.historyId)
      if (lastViewedEntry) {
        const recordedView = hasValidEditorViewState(lastViewedState, lastViewedEntry.editorMode)
          ? lastViewedState
          : undefined
        focusHistoryEntry(lastViewedEntry, false, recordedView)
        syncLatestCreatedHistoryId(null)
        return true
      }
      if (restoreDraftSession(loadLatestDraft(utools), latestHistory)) return true
    }

    createStartupHistoryEntry(latestHistory)
    return true
  }, [consumeAutoSaveOffExit, createStartupHistoryEntry, focusHistoryEntry, preserveCurrentDraft, replaceDraftSummaries, restoreDraftSession, syncHistoryState, syncLatestCreatedHistoryId])

  const persistLastViewedState = useCallback((utools, capturedViewState = null) => {
    const activeHistoryId = activeHistoryIdRef.current
    const activeEntry = historyRef.current.find(item => item._id === activeHistoryId)
    if (!activeEntry) return saveLastViewedSafely(utools, null)
    if (activeEntry._transient && activeEntry.contentLength === 0 && !activeEntry.title?.trim() && !draftSummariesRef.current.has(activeHistoryId)) {
      return loadLastViewedHistoryState(utools)
    }

    const previous = loadLastViewedHistoryState(utools)
    const viewState = capturedViewState || readEditorViewState(textAreaRef.current, settingsRef.current.editorMode) ||
      (previous?.historyId === activeHistoryId ? previous : null)
    saveEditorViewSafely(utools, activeHistoryId, activeEntry.editorMode, viewState)
    return { historyId: activeHistoryId, ...(viewState || {}) }
  }, [saveEditorViewSafely, saveLastViewedSafely])

  const persistAutoSaveOffExit = useCallback((utools, committed) => {
    const activeHistoryId = activeHistoryIdRef.current
    const activeEntry = historyRef.current.find(item => item._id === activeHistoryId)
    const shouldRestoreLastPosition = settingsRef.current.startupBehavior === STARTUP_BEHAVIORS.RESTORE
    const selection = committed?.viewState || readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
    const content = typeof committed?.content === 'string' ? committed.content : textRef.current

    // 插件宿主 uTools 可能在 onPluginOut 之后再次触发 beforeunload。前者已经清空当前条目
    // 并写入权威的退出快照，后一个回调不能把这份快照误删。
    const existingExitSession = !activeEntry && shouldRestoreLastPosition ? loadExitSession(utools) : null
    if (existingExitSession) return existingExitSession

    // 下一次启动只信任唯一的退出快照；其余恢复草稿都属于当前会话，必须清理，
    // 这样恢复流程不会在多个候选条目之间产生歧义。
    resetDraftState(utools)
    if (!shouldRestoreLastPosition || !activeEntry) {
      clearExitSession(utools)
      saveLastViewedSafely(utools, null)
      return { historyId: null, transient: false, draft: null }
    }

    let isTransient = Boolean(activeEntry._transient)
    if (!isTransient) {
      try {
        isTransient = !loadHistory(utools).some(item => item._id === activeHistoryId)
      } catch {
        // 关闭阶段可能无法读取历史索引，此时仍保留内存中的显式标记，
        // 让后续流程知道退出快照已经写入或正在写入。
      }
    }
    const storedView = hasValidEditorViewState(selection, activeEntry.editorMode) ? selection : null
    if (isTransient) {
      const session = {
        historyId: activeHistoryId,
        content,
        dirty: true,
        editorMode: activeEntry.editorMode,
        codeLanguage: activeEntry.codeLanguage,
        ...(selection || {}),
        file: fileRef.current
      }
      try {
        saveDraft(utools, session)
      } catch (error) {
        // 即使索引草稿写入过程中被中断，退出快照仍能为下一次启动提供完整的
        // 恢复兜底数据。
        console.error('保存退出临时条目草稿失败', error)
      }
      saveExitSession(utools, {
        historyId: activeHistoryId,
        transient: true,
        content,
        editorMode: activeEntry.editorMode,
        codeLanguage: activeEntry.codeLanguage,
        ...(selection || {}),
        file: fileRef.current
      })
    } else {
      saveExitSession(utools, { historyId: activeHistoryId, transient: false, ...(storedView || {}) })
    }
    saveLastViewedSafely(utools, { historyId: activeHistoryId, ...(storedView || {}) })
    return { historyId: activeHistoryId, transient: isTransient }
  }, [resetDraftState, saveLastViewedSafely])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return undefined
    const handleThemeChange = (event) => {
      try {
        setTheme(settingsRef.current.themeMode === 'auto'
          ? (event.matches ? 'dark' : 'light')
          : settingsRef.current.themeMode)
      } catch {
        setTheme(resolveThemeMode(settingsRef.current.themeMode))
      }
    }
    if (media.addEventListener) {
      media.addEventListener('change', handleThemeChange)
      return () => media.removeEventListener('change', handleThemeChange)
    }
    media.addListener?.(handleThemeChange)
    return () => media.removeListener?.(handleThemeChange)
  }, [])

  useEffect(() => {
    const utools = window.utools
    if (!utools) {
      showNotice(t(settingsRef.current.language, 'notice.runInUtools'), 'error')
      return undefined
    }

    try {
      const loadedSettings = normalizeSettings(initialSettings || loadSettings(utools))
      const loadedDrafts = loadDraftSummaries(utools)
      const loadedHistory = mergeHistoryDrafts(loadHistory(utools), loadedDrafts)
      replaceDraftSummaries(loadedDrafts)
      settingsRef.current = loadedSettings
      setSettings(loadedSettings)
      setTheme(resolveThemeMode(loadedSettings.themeMode))
      syncSidebarExpanded(loadedSettings.rememberSidebarState ? loadSidebarExpandedState(utools) : true)
      syncHistoryState(loadedHistory)
      scheduleHistoryMaintenance(utools)
    } catch (error) {
      console.error('加载本地数据失败', error)
      showNotice(t(settingsRef.current.language, 'notice.localLoadFailed'), 'error')
    }

    undoStackRef.current = []
    redoStackRef.current = []
    undoReadyRef.current = true

    const handlePluginEnter = (action) => {
      const { code } = action
      const incomingText = getExternalText(action, FEATURE_CODE)
      setTheme(resolveThemeMode(settingsRef.current.themeMode))
      syncSidebarExpanded(settingsRef.current.rememberSidebarState ? loadSidebarExpandedState(utools) : true)
      undoStackRef.current = []
      redoStackRef.current = []
      if (code === FEATURE_CODE) {
        let handledExternalText = false
        if (incomingText !== null) {
          handledExternalText = true
          pendingCursorRestoreRef.current = null
          cancelPendingPersistence()
          const { content: currentText } = discardComposition()
          if (dirtyRef.current && !preserveCurrentContent(currentText)) return false
          try {
            performUndoable(() => {
              createStartupHistoryEntry(historyRef.current)
              updateEditorText(incomingText)
            })
          } catch (error) {
            console.error('应用外部文本失败', error)
            showNotice(t(settingsRef.current.language, 'notice.saveFailed'), 'error')
            return false
          }
        }
        if (!handledExternalText) {
          try {
            if (!applyStartupBehavior(utools)) return false
            scheduleHistoryMaintenance(utools)
          } catch (error) {
            console.error('应用启动行为失败', error)
            showNotice(t(settingsRef.current.language, 'notice.startupApplyFailed'), 'error')
            return false
          }
        }
        if (handledExternalText) scheduleHistoryMaintenance(utools)
      }
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
      focusTimerRef.current = setTimeout(() => {
        focusTimerRef.current = null
        focusEditorAndRestoreSelection()
      }, 50)
      return true
    }

    const handlePluginOut = () => {
      cancelPendingPersistence()
      const committed = discardComposition()
      if (!settingsRef.current.autoSaveEntries) {
        try {
          persistAutoSaveOffExit(utools, committed)
          activeHistoryIdRef.current = null
          dirtyRef.current = false
          pendingCursorRestoreRef.current = null
          historyBodyCacheRef.current.clear()
          syncLatestCreatedHistoryId(null)
          syncHistoryState(mergeHistoryDrafts(loadHistory(utools), loadDraftSummaries(utools)))
          setEditorText('', false)
          syncFileState(null)
          return true
        } catch (error) {
          console.error('清理临时编辑内容失败', error)
          return false
        }
      }
      const selection = committed.viewState || readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
      if (!preserveCurrentContent(committed.content)) return false
      try {
        persistLastViewedState(utools, selection)
      } catch (error) {
        console.error('保存上次查看条目失败', error)
        return false
      }
      return true
    }

    const handleDbPull = (docs) => {
        if (!Array.isArray(docs) || !docs.some(doc => doc?._id?.startsWith(HISTORY_PREFIX))) return true
        try {
          const activeHistoryId = activeHistoryIdRef.current
          // 当前打开的条目属于本地编辑状态。忽略同一 ID 的所有远程推送（包括删除），
          // 防止同步过程覆盖或复制用户正在编辑的文本。
          const pulledDocs = activeHistoryId
            ? docs.filter(doc => doc?._id !== activeHistoryId)
            : docs
          if (!pulledDocs.some(doc => doc?._id?.startsWith(HISTORY_PREFIX))) return true
          pulledDocs.forEach(doc => {
            if (typeof doc?._id === 'string') historyBodyCacheRef.current.delete(doc._id)
          })
          const mergedHistory = mergeHistoryDrafts(
            mergeHistoryChanges(utools, historyRef.current, pulledDocs),
            [...draftSummariesRef.current.values()]
          )

          syncHistoryState(mergedHistory)
      } catch (error) {
        console.error('同步历史记录失败', error)
        showNotice(t(settingsRef.current.language, 'notice.syncFailed'), 'error')
        return false
      }
      return true
    }

    pluginHandlersRef.current = {
      enter: handlePluginEnter,
      out: handlePluginOut,
      pull: handleDbPull
    }
  }, [applyEditorMode, applyStartupBehavior, cancelPendingPersistence, createStartupHistoryEntry, discardComposition, focusEditorAndRestoreSelection, focusHistoryEntry, forgetDraft, loadHistory, maintainHistory, performUndoable, persistAutoSaveOffExit, persistLastViewedState, preserveCurrentContent, removeEmptyTransientEntries, replaceDraftSummaries, resetDraftState, saveLastViewedSafely, scheduleHistoryMaintenance, setEditorText, showNotice, syncFileState, syncHistoryState, syncSidebarExpanded, syncLatestCreatedHistoryId, updateEditorText, initialSettings])

  useEffect(() => {
    const utools = window.utools
    if (!utools) return undefined
    utools.onPluginEnter(action => pluginHandlersRef.current.enter?.(action))
    utools.onPluginOut(isKill => pluginHandlersRef.current.out?.(isKill))
    utools.onDbPull(docs => pluginHandlersRef.current.pull?.(docs))
    return undefined
  }, [])

  useEffect(() => {
    if (!window.utools) return undefined
    scheduleCurrentPersistence()
    return cancelPendingPersistence
  }, [cancelPendingPersistence, scheduleCurrentPersistence, settings.autoSaveEntries, text])

  useEffect(() => {
    const handleBeforeUnload = () => {
      cancelPendingPersistence()
      const committed = discardComposition()
      if (window.utools && !settingsRef.current.autoSaveEntries) {
        try {
          persistAutoSaveOffExit(window.utools, committed)
        } catch (error) {
          console.error('保存退出临时编辑内容失败', error)
        }
        return
      }
      const selection = committed.viewState || readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
      if (window.utools) {
        clearExitSession(window.utools)
        preserveCurrentContent(committed.content)
        try {
          persistLastViewedState(window.utools, selection)
        } catch (error) {
          console.error('保存上次查看条目失败', error)
        }
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [cancelPendingPersistence, discardComposition, persistAutoSaveOffExit, persistLastViewedState, preserveCurrentContent])

  useEffect(() => () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
  }, [])

  const visibleText = selectedHistoryId ? text : ''
  const plainTextSearchMatches = useMemo(
    () => findLiteralMatches(visibleText, searchText),
    [searchText, visibleText]
  )
  const searchMatches = settings.editorMode === 'markdown' ? markdownSearchMatches : plainTextSearchMatches

  useEffect(() => {
    if (!searchOpen || settings.editorMode !== 'markdown' || historyPreview) {
      setMarkdownSearchMatches([])
      return undefined
    }
    const frame = requestAnimationFrame(() => {
      setMarkdownSearchMatches(textAreaRef.current?.getSearchMatches?.(searchText) || [])
    })
    return () => cancelAnimationFrame(frame)
  }, [historyPreview, searchOpen, searchText, settings.editorMode, text])

  const handleTextChange = useCallback((event) => {
    if (event.modeNormalization) {
      if (event.target.value !== textRef.current) setEditorText(event.target.value, true)
      return
    }
    updateEditorText(event.target.value, event.undoMergeKey ? { mergeKey: event.undoMergeKey } : undefined)
  }, [setEditorText, updateEditorText])

  const handleFormatText = useCallback((action) => {
    const previousText = textRef.current
    const formattingOptions = { editorMode: settingsRef.current.editorMode }
    const nextText = formatText(previousText, action, formattingOptions)
    const actionLabel = t(settingsRef.current.language, `formatting.actions.${action}`)
    const editor = textAreaRef.current
    const selection = readEditorSelection(editor)

    if (nextText === previousText) {
      showNotice(t(settingsRef.current.language, 'formatting.unchanged'), 'info')
      requestAnimationFrame(() => editor?.focus())
      return false
    }
    if (nextText.length > MAX_TEXT_LENGTH) {
      updateEditorText(nextText)
      requestAnimationFrame(() => editor?.focus())
      return false
    }

    const nextSelection = selection
      ? {
          selectionStart: Math.min(mapFormattedOffset(previousText, action, selection.selectionStart, formattingOptions), nextText.length),
          selectionEnd: Math.min(mapFormattedOffset(previousText, action, selection.selectionEnd, formattingOptions), nextText.length)
        }
      : null
    const currentFile = fileRef.current
    const resetsMixedLineEndings = currentFile?.lineEnding === 'mixed' &&
      countNormalizedLineBreaks(previousText) !== countNormalizedLineBreaks(nextText)
    const before = resetsMixedLineEndings ? captureUndoState({ includeDrafts: false }) : undefined
    if (resetsMixedLineEndings) {
      syncFileState({
        ...currentFile,
        lineEnding: currentFile.dominantLineEnding || 'lf',
        lineEndingMap: undefined
      })
    }
    const updated = updateEditorText(nextText, { before, mergeKey: `format:${action}:${Date.now()}` })
    if (!updated) {
      if (resetsMixedLineEndings) syncFileState(currentFile)
      requestAnimationFrame(() => editor?.focus())
      return false
    }
    showNotice(t(settingsRef.current.language, 'formatting.applied', { action: actionLabel }))
    requestAnimationFrame(() => {
      editor?.focus()
      if (!nextSelection || typeof editor?.setSelectionRange !== 'function') return
      editor.setSelectionRange(
        nextSelection.selectionStart,
        Math.max(nextSelection.selectionStart, nextSelection.selectionEnd)
      )
    })
    return true
  }, [captureUndoState, showNotice, syncFileState, updateEditorText])

  const openAiFormatting = useCallback(() => {
    const currentText = textRef.current
    if (!String(currentText).trim()) {
      showNotice(t(settingsRef.current.language, 'ai.textRequired'), 'info')
      return false
    }
    setAiAssistant({ mode: 'formatting', content: currentText, title: '' })
    return true
  }, [showNotice])

  const applyAiFormatting = useCallback((nextText) => {
    const normalized = String(nextText || '').replace(/^```(?:text|markdown)?\s*/i, '').replace(/\s*```$/, '')
    if (!normalized || normalized === textRef.current) return false
    if (normalized.length > MAX_TEXT_LENGTH) {
      showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
      return false
    }
    const updated = updateEditorText(normalized, { before: captureUndoState({ includeDrafts: false }), mergeKey: `ai-format:${Date.now()}` })
    if (!updated) return false
    showNotice(t(settingsRef.current.language, 'ai.applied'))
    requestAnimationFrame(() => textAreaRef.current?.focus())
    return true
  }, [captureUndoState, showNotice, updateEditorText])

  const handleCompositionStart = useCallback(() => {
    cancelPendingPersistence()
    compositionRef.current = true
    compositionStartRef.current = {
      text: textRef.current,
      dirty: dirtyRef.current,
      before: captureUndoState({ includeDrafts: false }),
      viewState: readEditorViewState(textAreaRef.current, settingsRef.current.editorMode)
    }
  }, [cancelPendingPersistence, captureUndoState])

  const handleCompositionEnd = useCallback(() => {
    const start = compositionStartRef.current
    const committed = commitComposition()
    if (!start || committed.content === start.text) return
    scheduleCurrentPersistence()
  }, [commitComposition, scheduleCurrentPersistence])

  const restoreActiveEditorViewAfterPreview = useCallback(() => {
    const activeEntry = historyRef.current.find(item => item._id === activeHistoryIdRef.current)
    const recordedView = getHistoryEditorView(activeEntry)
    pendingCursorRestoreRef.current = activeEntry && hasValidEditorViewState(recordedView, activeEntry.editorMode)
      ? { historyId: activeEntry._id, ...recordedView }
      : activeEntry ? { historyId: activeEntry._id } : null
  }, [getHistoryEditorView])

  const handleHistoryPreviewChange = useCallback((nextPreview) => {
    if (nextPreview && !historyPreview) rememberActiveEditorView()
    setHistoryPreview(nextPreview)
    if (!nextPreview && historyPreview) restoreActiveEditorViewAfterPreview()
  }, [historyPreview, rememberActiveEditorView, restoreActiveEditorViewAfterPreview])

  const handleHistoryPreviewDismiss = useCallback(() => {
    setHistoryPreview(null)
    restoreActiveEditorViewAfterPreview()
  }, [restoreActiveEditorViewAfterPreview])

  const handleHistoryPreviewWheel = useCallback((event) => {
    const previewElement = historyPreviewScrollRef.current
    if (!previewElement) return
    event.preventDefault()
    event.stopPropagation()
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? previewElement.clientHeight : 1
    previewElement.scrollTop += event.deltaY * unit
  }, [])

  useEffect(() => {
    if (historyPreview && !history.some(item => item._id === historyPreview.id)) setHistoryPreview(null)
  }, [history, historyPreview])

  const handleCopy = useCallback(() => {
    const content = historyPreview?.content ?? textRef.current
    if (!content) return
    if (window.utools?.copyText(content)) {
      showNotice(t(settingsRef.current.language, 'notice.copied'))
      triggerConfetti()
    } else {
      showNotice(t(settingsRef.current.language, 'notice.copyFailed'), 'error')
    }
  }, [historyPreview, showNotice])

  const handleOpenFile = useCallback(async () => {
    const services = getFileServices()
    if (!services?.chooseOpenFile) return
    if (!preserveCurrentDraft()) return
    const detachMessage = t(settingsRef.current.language, 'fileDialog.detachRequired')
    if (typeof services.prepareFileDialog === 'function' && !(await services.prepareFileDialog(detachMessage))) {
      showNotice(detachMessage, 'warning')
      return
    }
    let filePath
    try {
      filePath = await services.chooseOpenFile(getFileDialogCopy(settingsRef.current.language))
    } catch (error) {
      console.error('打开文件选择器失败', error)
      showNotice(getFileErrorMessage(error, settingsRef.current.language), 'error')
      return
    }
    if (!filePath) return
    try {
      const nextFile = services.readFile(filePath)
      performUndoable(() => {
        createStartupHistoryEntry(historyRef.current)
        updateEditorText(nextFile.content)
        syncFileState(getFileMetadata(nextFile))
        const detectedMode = detectEditorMode(nextFile.name)
        handleEditorModeChange(detectedMode, detectedMode === 'code' ? AUTO_CODE_LANGUAGE : settingsRef.current.codeLanguage)
      })
      requestAnimationFrame(focusEditorAndRestoreSelection)
      if (nextFile.confidence < 0.8) {
        showNotice(t(settingsRef.current.language, 'notice.openedLowConfidence', { name: nextFile.name }), 'warning')
      } else {
        showNotice(t(settingsRef.current.language, 'notice.opened', { name: nextFile.name }))
      }
      triggerConfetti()
    } catch (error) {
      console.error('打开文件失败', error)
      showNotice(getFileErrorMessage(error, settingsRef.current.language), 'error')
    }
  }, [createStartupHistoryEntry, focusEditorAndRestoreSelection, getFileServices, handleEditorModeChange, performUndoable, preserveCurrentDraft, showNotice, syncFileState, updateEditorText])

  const handleSaveFile = useCallback(async () => {
    const services = getFileServices()
    if (!services?.saveTextFile) return false
    if (!activeHistoryIdRef.current && !fileRef.current && textRef.current.length === 0) {
      showNotice(t(settingsRef.current.language, 'notice.nothingSave'))
      return false
    }
    const currentFile = fileRef.current
    const wasDirty = dirtyRef.current
    const encoding = currentFile?.encoding || 'utf8'
    const lineEnding = currentFile?.lineEnding || 'lf'
    if (wasDirty && !preserveCurrentContent(textRef.current)) return false
    const detachMessage = t(settingsRef.current.language, 'fileDialog.detachRequired')
    if (typeof services.prepareFileDialog === 'function' && !(await services.prepareFileDialog(detachMessage))) {
      showNotice(detachMessage, 'warning')
      return false
    }
    try {
      const saved = await services.saveTextFile(
        currentFile?.path || '',
        settingsRef.current.editorMode,
        getFileDialogCopy(settingsRef.current.language),
        textRef.current,
        encoding,
        lineEnding,
        {
          codeExtension: getDefaultCodeExtension(
            settingsRef.current.codeLanguage === AUTO_CODE_LANGUAGE
              ? activeCodeDetectionRef.current?.language
              : settingsRef.current.codeLanguage
          ),
          codeLanguage: settingsRef.current.codeLanguage === AUTO_CODE_LANGUAGE
            ? activeCodeDetectionRef.current?.language
            : settingsRef.current.codeLanguage,
          lineEndingMap: currentFile?.lineEndingMap,
          dominantLineEnding: currentFile?.dominantLineEnding
        }
      )
      if (!saved) return false
      {
        const nextFile = { ...(currentFile || {}), ...saved, confidence: 1 }
        syncFileState(nextFile)
        if (dirtyRef.current) persistDraft(textRef.current, true, true)
      }
      showNotice(t(settingsRef.current.language, 'notice.saved', { name: saved.name }))
      triggerConfetti()
      return true
    } catch (error) {
      if (wasDirty) {
        dirtyRef.current = true
        persistDraft(textRef.current, true, true)
      }
      console.error('保存文件失败', error)
      showNotice(getFileErrorMessage(error, settingsRef.current.language), 'error')
      return false
    }
  }, [getFileServices, persistDraft, preserveCurrentContent, showNotice, syncFileState])

  const openAiImageGeneration = useCallback(async (contentOverride, titleOverride = '') => {
    if (!settingsRef.current.aiDirectEnabled) {
      setAiModelsLoading(true)
      try {
        const models = await loadAiModels()
        aiModelsLoadedRef.current = true
        setAvailableAiModels(models)
      } catch (error) {
        aiModelsLoadedRef.current = false
        console.warn('读取 AI 图片生成模型失败', error)
      } finally {
        setAiModelsLoading(false)
      }
    }
    const preview = historyPreview
    const content = contentOverride ?? preview?.content ?? textRef.current
    const title = titleOverride || preview?.title || historyRef.current.find(item => item._id === activeHistoryIdRef.current)?.title || ''
    setAiAssistant({ mode: 'image-generation', content: String(content || ''), title })
    return true
  }, [historyPreview])

  const handleOpenShareStudio = useCallback((kind, overrides = {}) => {
    const preview = historyPreview
    const content = preview?.content ?? textRef.current
    const editorMode = preview?.editorMode || settingsRef.current.editorMode
    const title = preview
      ? preview.title || ''
      : historyRef.current.find(item => item._id === activeHistoryIdRef.current)?.title || ''
    if (kind === 'ai-image') {
      openAiImageGeneration(content, title)
      return true
    }
    const isXiaohongshu = kind === 'xiaohongshu' || kind === 'xiaohongshu-long'
    const isSocialImage = kind === 'x' || kind === 'zhihu' || kind === 'wechat'
    if (!String(content).trim() && (isXiaohongshu || isSocialImage || !String(title).trim())) {
      showNotice(t(settingsRef.current.language, 'share.nothing'), 'info')
      return false
    }
    const firstLine = String(content).split(/\r?\n/).map(line => line.trim()).find(Boolean) || ''
    const sourceFileName = preview ? '' : fileRef.current?.name || ''
    const detectedLanguage = activeCodeDetectionRef.current?.language
    setShareStudio({
      kind: kind === 'code' ? 'code' : isXiaohongshu || isSocialImage ? kind : 'note',
      entryId: preview?._id || activeHistoryIdRef.current || fileRef.current?.path || 'current-entry',
      title,
      content,
      editorMode,
      codeLanguage: editorMode === 'code'
        ? (preview?.codeLanguage || (
            settingsRef.current.codeLanguage === AUTO_CODE_LANGUAGE
              ? detectedLanguage || AUTO_CODE_LANGUAGE
              : settingsRef.current.codeLanguage
          ))
        : AUTO_CODE_LANGUAGE,
      fileName: sourceFileName || title || Array.from(firstLine).slice(0, 32).join('') || 'code',
      ...overrides
    })
    return true
  }, [historyPreview, openAiImageGeneration, showNotice])

  const handleEncodingChange = useCallback((encoding) => {
    const currentFile = fileRef.current
    if ((currentFile?.encoding || 'utf8') === encoding) return
    performUndoable(() => {
      syncFileState(currentFile ? { ...currentFile, encoding } : { encoding, lineEnding: 'lf' })
    })
  }, [performUndoable, syncFileState])

  const handleReloadWithEncoding = useCallback(() => {
    const services = getFileServices()
    const currentFile = fileRef.current
    if (!services?.readFile || !currentFile?.path) {
      showNotice(t(settingsRef.current.language, 'notice.noAssociatedFile'))
      return
    }
    if (!preserveCurrentDraft()) return
    try {
      const nextFile = services.readFile(currentFile.path, currentFile.encoding)
      performUndoable(() => {
        updateEditorText(nextFile.content)
        syncFileState({ ...getFileMetadata(nextFile), encoding: currentFile.encoding })
      })
      showNotice(t(settingsRef.current.language, 'notice.reloadedEncoding', { encoding: getEncodingLabel(currentFile.encoding) }))
    } catch (error) {
      console.error('按指定编码读取失败', error)
      showNotice(getFileErrorMessage(error, settingsRef.current.language), 'error')
    }
  }, [getFileServices, performUndoable, preserveCurrentDraft, showNotice, syncFileState, updateEditorText])

  const handleLineEndingChange = useCallback((lineEnding) => {
    const currentFile = fileRef.current
    if ((currentFile?.lineEnding || 'lf') === lineEnding) return
    performUndoable(() => {
      syncFileState(currentFile ? { ...currentFile, lineEnding } : { encoding: 'utf8', lineEnding })
    })
  }, [performUndoable, syncFileState])

  const handleOpenSearch = useCallback((mode = 'find') => {
    const nextMode = mode === 'replace' ? 'replace' : 'find'
    setHistoryPreview(null)
    setSearchMode(nextMode)
    setSearchOpen(true)
    setSearchIndex(-1)
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => {
      const input = nextMode === 'replace' && searchText
        ? replaceInputRef.current
        : searchInputRef.current
      input?.focus()
      input?.select()
    }, 50)
  }, [searchText])

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false)
    setSearchIndex(-1)
  }, [])

  const applyEditorCommand = useCallback((command) => {
    const textArea = textAreaRef.current
    if (!textArea) return

    const result = command(textRef.current, textArea.selectionStart, textArea.selectionEnd)
    if (result.text.length > MAX_TEXT_LENGTH) {
      showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
      return
    }

    updateEditorText(result.text, { mergeKey: nextEditorUndoMergeKey('editor-command') })
    requestAnimationFrame(() => {
      textArea.focus()
      textArea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }, [nextEditorUndoMergeKey, showNotice, updateEditorText])

  const applyRichEditorCommand = useCallback((command) => {
    const editor = textAreaRef.current
    if (!editor?.isContentEditable) return false
    editor.focus()
    let handled
    if (command === 'bold' && editor.toggleStrong) {
      handled = editor.toggleStrong()
    } else if (command === 'italic' && editor.toggleEmphasis) {
      handled = editor.toggleEmphasis()
    } else if (command === 'indent' && editor.indentList) {
      handled = editor.indentList()
    } else if (command === 'outdent' && editor.outdentList) {
      handled = editor.outdentList()
    } else if (editor.isContentEditable) {
      return false
    } else if (typeof document.execCommand === 'function') {
      document.execCommand(command)
      editor.dispatchEvent?.(new Event('input', { bubbles: true }))
    } else {
      return false
    }
    return handled !== false
  }, [])

  const handleBold = useCallback(() => {
    if (settingsRef.current.editorMode !== 'markdown') {
      showNotice(t(settingsRef.current.language, 'notice.boldMarkdownOnly'), 'info')
      return
    }
    if (applyRichEditorCommand('bold')) return
    applyEditorCommand((content, start, end) => toggleMarkdownWrap(content, start, end, '**'))
  }, [applyEditorCommand, applyRichEditorCommand, showNotice])

  const handleItalic = useCallback(() => {
    if (settingsRef.current.editorMode !== 'markdown') {
      showNotice(t(settingsRef.current.language, 'notice.italicMarkdownOnly'), 'info')
      return
    }
    if (applyRichEditorCommand('italic')) return
    applyEditorCommand((content, start, end) => toggleMarkdownWrap(content, start, end, '*'))
  }, [applyEditorCommand, applyRichEditorCommand, showNotice])

  const handleIndent = useCallback((outdent = false) => {
    if (applyRichEditorCommand(outdent ? 'outdent' : 'indent')) return
    if (settingsRef.current.editorMode === 'markdown') return
    applyEditorCommand((content, start, end) => changeIndent(content, start, end, outdent))
  }, [applyEditorCommand, applyRichEditorCommand])

  const handleDeleteLine = useCallback(() => {
    const editor = textAreaRef.current
    if (!editor) return
    if (editor.deleteCurrentLine?.()) return
    if (settingsRef.current.editorMode === 'markdown') return
    applyEditorCommand(deleteSelectedLines)
  }, [applyEditorCommand])

  const handleOpenGoToLine = useCallback(() => {
    const textArea = textAreaRef.current
    const line = textArea?.getCurrentSourceLine?.(textRef.current) ??
      countLines(textRef.current.slice(0, textArea?.selectionStart ?? 0))
    setGoToLineValue(String(line))
    setGoToLineOpen(true)
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current)
    focusTimerRef.current = setTimeout(() => {
      goToLineInputRef.current?.focus()
      goToLineInputRef.current?.select()
    }, 50)
  }, [])

  const handleCloseGoToLine = useCallback(() => {
    setGoToLineOpen(false)
  }, [])

  const handleGoToLine = useCallback(() => {
    const requestedLine = Number(goToLineValue)
    const lineStart = findLineStart(textRef.current, requestedLine)
    if (lineStart < 0) {
      showNotice(t(settingsRef.current.language, 'notice.lineRange', { count: countLines(textRef.current) }))
      return
    }
    setGoToLineOpen(false)
    requestAnimationFrame(() => {
      if (textAreaRef.current?.goToSourceLine?.(requestedLine, textRef.current)) return
      textAreaRef.current?.focus()
      textAreaRef.current?.setSelectionRange(lineStart, lineStart)
    })
  }, [goToLineValue, showNotice])

  const handleZoom = useCallback((direction) => {
    const current = settingsRef.current
    const requestedZoom = direction === 0 ? 100 : current.zoom + direction * 10
    const zoom = Math.min(MAX_EDITOR_ZOOM, Math.max(MIN_EDITOR_ZOOM, requestedZoom))
    if (zoom === current.zoom) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...current, zoom })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存缩放设置失败', error)
      showNotice(t(settingsRef.current.language, 'notice.zoomSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleEditorWheel = useCallback((event) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    handleZoom(event.deltaY < 0 ? 1 : -1)
  }, [handleZoom])

  const handleToggleSidebar = useCallback(() => {
    performUndoable(() => syncSidebarExpanded(!sidebarExpandedRef.current))
  }, [performUndoable, syncSidebarExpanded])

  const handleNewHistory = useCallback(() => {
    if (!preserveCurrentDraft()) return
    const utools = window.utools
    if (!utools) {
      showNotice(t(settingsRef.current.language, 'notice.apiUnavailable'), 'error')
      return
    }

    try {
      performUndoable(() => {
        const createdEntry = createTransientHistoryEntry(historyRef.current, settingsRef.current.editorMode, { codeLanguage: settingsRef.current.codeLanguage })
        const nextHistory = [createdEntry, ...removeEmptyTransientEntries(historyRef.current).filter(item => item._id !== createdEntry._id)]

        syncHistoryState(nextHistory)
        focusHistoryEntry(createdEntry)
        syncLatestCreatedHistoryId(createdEntry._id)
      })
      showNotice(t(settingsRef.current.language, 'notice.newEntry'))
      triggerConfetti()
    } catch (error) {
      console.error('新增历史条目失败', error)
      showNotice(t(settingsRef.current.language, 'notice.newEntryFailed'), 'error')
    }
  }, [focusHistoryEntry, performUndoable, preserveCurrentDraft, removeEmptyTransientEntries, showNotice, syncHistoryState, syncLatestCreatedHistoryId])

  const handleKeyDown = useCallback((event) => {
    if (isKeyboardEventComposing(event, compositionRef.current)) return
    const commandKey = (event.ctrlKey || event.metaKey) && !event.altKey
    const key = String(event.key || '').toLowerCase()
    const modeToggleShortcut = commandKey && !event.shiftKey && (key === '/' || event.code === 'Slash')
    const editingShortcut = getEditingShortcutAction(event)

    if (key === 'escape' && searchOpen) {
      event.preventDefault()
      handleCloseSearch()
    } else if (key === 'escape') {
      event.preventDefault()
      preserveCurrentContent(textRef.current)
      window.utools?.outPlugin?.()
    } else if (editingShortcut === 'delete-line') {
      event.preventDefault()
      handleDeleteLine()
    } else if (editingShortcut === 'undo' || editingShortcut === 'redo') {
      event.preventDefault()
      if (editingShortcut === 'redo') handleRedo()
      else handleUndo()
    } else if (modeToggleShortcut) {
      event.preventDefault()
      handleToggleEditorMode()
    } else if (commandKey && key === 'n') {
      event.preventDefault()
      handleNewHistory()
    } else if (commandKey && key === 'f') {
      event.preventDefault()
      handleOpenSearch('find')
    } else if (commandKey && key === 'h') {
      event.preventDefault()
      handleOpenSearch('replace')
    } else if (commandKey && key === 'b') {
      event.preventDefault()
      handleBold()
    } else if (commandKey && key === 'i') {
      event.preventDefault()
      handleItalic()
    } else if (commandKey && key === 'o') {
      event.preventDefault()
      handleOpenFile()
    } else if (commandKey && key === 's') {
      event.preventDefault()
      handleSaveFile()
    } else if (commandKey && key === 'g') {
      event.preventDefault()
      handleOpenGoToLine()
    } else if (commandKey && (key === '+' || key === '=' || key === 'add')) {
      event.preventDefault()
      handleZoom(1)
    } else if (commandKey && (key === '-' || key === 'subtract')) {
      event.preventDefault()
      handleZoom(-1)
    } else if (commandKey && key === '0') {
      event.preventDefault()
      handleZoom(0)
    } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'tab') {
      event.preventDefault()
      handleIndent(event.shiftKey)
    } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'backspace' && settingsRef.current.editorMode === 'text') {
      const textArea = textAreaRef.current
      const selectionStart = Number(textArea?.selectionStart)
      const selectionEnd = Number(textArea?.selectionEnd)
      const isAtLineStart = Number.isFinite(selectionStart) &&
        selectionStart === selectionEnd &&
        selectionStart > 0 &&
        textRef.current[selectionStart - 1] === '\n'
      if (isAtLineStart) {
        const result = deleteLineBreakBackward(textRef.current, selectionStart, selectionEnd)
        if (!result) return
        event.preventDefault()
        applyEditorCommand(deleteLineBreakBackward)
      }
    } else if (!event.ctrlKey && !event.metaKey && !event.altKey && key === 'enter' && settingsRef.current.editorMode === 'text') {
      event.preventDefault()
      applyEditorCommand(insertLineBreak)
    } else if (commandKey && key === 'enter') {
      event.preventDefault()
      const currentText = textRef.current
      if (!activeHistoryIdRef.current || !currentText.trim() || !preserveCurrentContent(currentText)) return
      if (window.utools.copyText(currentText)) {
        window.utools.outPlugin()
      } else {
        showNotice(t(settingsRef.current.language, 'notice.copyWindowKept'), 'error')
      }
    }
  }, [applyEditorCommand, handleBold, handleCloseSearch, handleDeleteLine, handleIndent, handleItalic, handleNewHistory, handleOpenFile, handleOpenGoToLine, handleOpenSearch, handleRedo, handleSaveFile, handleToggleEditorMode, handleUndo, handleZoom, preserveCurrentContent, searchOpen, showNotice])

  useEffect(() => {
    const handleGlobalShortcut = (event) => {
      if (event.defaultPrevented || isKeyboardEventComposing(event, compositionRef.current)) return
      const editor = textAreaRef.current
      const editorHasFocus = event.target === editor || editor?.contains?.(event.target)
      const editorSelection = editorHasFocus ? readEditorSelection(editor) : null
      const editorHasSelection = Boolean(editorSelection && editorSelection.selectionStart !== editorSelection.selectionEnd)
      const target = event.target
      const targetAcceptsText = target instanceof HTMLElement && (
        target.matches('input, textarea, select') || target.isContentEditable
      )
      const hasTextSelection = Boolean(window.getSelection?.()?.toString())
      const commandKey = (event.ctrlKey || event.metaKey) && !event.altKey
      const key = String(event.key || '').toLowerCase()
      const editingShortcut = getEditingShortcutAction(event)

      if (key === 'escape' && searchOpen) {
        event.preventDefault()
        handleCloseSearch()
        return
      }

      if ((editingShortcut === 'undo' || editingShortcut === 'redo') && !targetAcceptsText) {
        event.preventDefault()
        if (editingShortcut === 'redo') handleRedo()
        else handleUndo()
        return
      }

      const copyAction = getCopyShortcutAction(event, { editorHasFocus, editorHasSelection, hasTextSelection, targetAcceptsText })
      if (copyAction) {
        if (copyAction === 'copy-entry') {
          event.preventDefault()
          handleCopy()
        }
        return
      }
      const sidebarShortcutMatches = eventMatchesShortcut(event, settingsRef.current.sidebarShortcut)
      const preserveNativeEditing = (editorHasFocus || targetAcceptsText) && isNativeTextEditingShortcut(event)
      if (sidebarShortcutMatches && !preserveNativeEditing) {
        event.preventDefault()
        handleToggleSidebar()
        return
      }
      if (editorHasFocus) return
      if (!commandKey) return

      const modeToggleShortcut = !event.shiftKey && (key === '/' || event.code === 'Slash')
      if (modeToggleShortcut) {
        event.preventDefault()
        handleToggleEditorMode()
      } else if (key === 'n') {
        event.preventDefault()
        handleNewHistory()
      } else if (key === 'f') {
        event.preventDefault()
        handleOpenSearch('find')
      } else if (key === 'h') {
        event.preventDefault()
        handleOpenSearch('replace')
      } else if (key === 'o') {
        event.preventDefault()
        handleOpenFile()
      } else if (key === 's') {
        event.preventDefault()
        handleSaveFile()
      } else if (key === 'g') {
        event.preventDefault()
        handleOpenGoToLine()
      } else if (key === '+' || key === '=' || key === 'add') {
        event.preventDefault()
        handleZoom(1)
      } else if (key === '-' || key === 'subtract') {
        event.preventDefault()
        handleZoom(-1)
      } else if (key === '0') {
        event.preventDefault()
        handleZoom(0)
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut)
    return () => window.removeEventListener('keydown', handleGlobalShortcut)
  }, [handleCloseSearch, handleCopy, handleNewHistory, handleOpenFile, handleOpenGoToLine, handleOpenSearch, handleRedo, handleSaveFile, handleToggleEditorMode, handleToggleSidebar, handleUndo, handleZoom, searchOpen])

  const handleLoadHistory = useCallback((item) => {
    setHistoryPreview(null)
    if (activeHistoryIdRef.current === item._id) {
      requestAnimationFrame(() => textAreaRef.current?.focus())
      return
    }
    const currentText = textRef.current
    const resolvedItem = resolveHistoryEntry(item)
    if (!resolvedItem) return
    if (dirtyRef.current && !preserveCurrentContent(currentText)) return
    const nextHistory = removeEmptyTransientEntries(historyRef.current)
    if (nextHistory.length !== historyRef.current.length) syncHistoryState(nextHistory)
    performUndoable(() => focusHistoryEntry(item))
  }, [focusHistoryEntry, performUndoable, preserveCurrentContent, removeEmptyTransientEntries, resolveHistoryEntry, syncHistoryState])

  const handleDeleteHistory = useCallback((itemId) => {
    try {
      if (activeHistoryIdRef.current === itemId) {
        cancelPendingPersistence()
        discardComposition()
      }
      const deletedEntry = resolveHistoryEntry(historyRef.current.find(item => item._id === itemId))
      if (deletedEntry) historyBodyCacheRef.current.set(itemId, { _rev: deletedEntry._rev, content: deletedEntry.content })
      performUndoable(() => {
        const currentHistory = historyRef.current
        const shouldMoveFocus = activeHistoryIdRef.current === itemId
        const nextEntry = shouldMoveFocus ? getNextHistoryEntry(currentHistory, itemId) : null
        syncHistoryState(deleteHistoryEntry(window.utools, currentHistory, itemId))
        forgetDraft(window.utools, itemId)
        historyBodyCacheRef.current.delete(itemId)
        if (shouldMoveFocus) focusHistoryEntry(nextEntry)
        if (latestCreatedHistoryIdRef.current === itemId) syncLatestCreatedHistoryId(null)
      }, { bodyCacheIds: [itemId] })
      showNotice(t(settingsRef.current.language, 'notice.deletedOne'))
    } catch (error) {
      console.error('删除历史记录失败', error)
      showNotice(t(settingsRef.current.language, 'notice.deleteFailed'), 'error')
    }
  }, [cancelPendingPersistence, discardComposition, focusHistoryEntry, forgetDraft, performUndoable, resolveHistoryEntry, showNotice, syncHistoryState, syncLatestCreatedHistoryId])

  const handleRenameHistory = useCallback((itemId, title) => {
    try {
      if (draftSummariesRef.current.has(itemId)) getDraftBody(itemId)
      let changed = false
      performUndoable(() => {
        const currentHistory = historyRef.current
        const nextHistory = renameHistoryEntry(window.utools, currentHistory, itemId, title)
        if (nextHistory === currentHistory) return false
        syncHistoryState(nextHistory)
        changed = true
        return true
      })
      if (!changed) return
      showNotice(t(settingsRef.current.language, 'notice.titleUpdated'))
      triggerConfetti()
    } catch (error) {
      console.error('重命名历史记录失败', error)
      showNotice(t(settingsRef.current.language, 'notice.renameFailed'), 'error')
    }
  }, [getDraftBody, performUndoable, showNotice, syncHistoryState])

  const handleReorderHistory = useCallback((orderedIds) => {
    if (!Array.isArray(orderedIds) || orderedIds.length < 2) return
    try {
      performUndoable(() => {
        const nextHistory = reorderHistoryEntries(window.utools, historyRef.current, orderedIds)
        syncHistoryState(nextHistory)
      })
    } catch (error) {
      console.error('保存历史排序失败', error)
      try { syncHistoryState(loadHistory(window.utools)) } catch {}
      showNotice(t(settingsRef.current.language, 'notice.reorderFailed'), 'error')
    }
  }, [performUndoable, showNotice, syncHistoryState])

  const handleClearHistory = useCallback(() => {
    try {
      cancelPendingPersistence()
      discardComposition()
      performUndoable(() => {
        syncHistoryState(clearHistory(window.utools))
        resetDraftState(window.utools)
        clearExitSession(window.utools)
        historyBodyCacheRef.current.clear()
        focusHistoryEntry(null, false)
        syncLatestCreatedHistoryId(null)
        setClearConfirmOpen(false)
      }, { bodyCacheIds: historyRef.current.map(item => item._id) })
      showNotice(t(settingsRef.current.language, 'notice.historyCleared'))
    } catch (error) {
      console.error('清空历史记录失败', error)
      try { syncHistoryState(loadHistory(window.utools)) } catch {}
      showNotice(t(settingsRef.current.language, 'notice.clearFailed'), 'error')
    }
  }, [cancelPendingPersistence, discardComposition, focusHistoryEntry, performUndoable, resetDraftState, showNotice, syncHistoryState, syncLatestCreatedHistoryId])

  const handleSettingsChange = useCallback((changes) => {
    if (!pendingSettingsUndoRef.current) pendingSettingsUndoRef.current = captureUndoState()
    const nextSettings = normalizeSettings({ ...settingsRef.current, ...changes })
    settingsRef.current = nextSettings
    setSettings(nextSettings)
  }, [captureUndoState])

  const commitSettingsChange = useCallback((changes, before) => {
    try {
      let nextSettings
      performUndoable(() => {
        nextSettings = saveSettings(window.utools, { ...settingsRef.current, ...changes })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
        syncHistoryState(trimHistory(window.utools, historyRef.current, nextSettings, {
          onBeforeRemove: cacheRemovedHistoryEntry
        }))
      }, { before })
      pendingSettingsUndoRef.current = null
      const retentionChanged = ['historyLimitMode', 'historyMaxAgeDays', 'maxHistory'].some(key => Object.prototype.hasOwnProperty.call(changes, key))
      if (retentionChanged) {
        const limitLabel = nextSettings.historyLimitMode === HISTORY_LIMIT_MODES.TIME
          ? t(nextSettings.language, 'notice.retentionTimeSet', { duration: formatHistoryAge(nextSettings.historyMaxAgeDays, nextSettings.language) })
          : t(nextSettings.language, 'notice.retentionCountSet', { count: nextSettings.maxHistory })
        showNotice(limitLabel)
      }
      return true
    } catch (error) {
      console.error('保存设置失败', error)
      try { syncHistoryState(loadHistory(window.utools)) } catch {}
      showNotice(t(settingsRef.current.language, 'notice.settingsSaveFailed'), 'error')
      return false
    }
  }, [cacheRemovedHistoryEntry, performUndoable, showNotice, syncHistoryState])

  const handleSettingsCommit = useCallback((changes) => {
    let before = pendingSettingsUndoRef.current || captureUndoState()
    const nextSettings = normalizeSettings({ ...settingsRef.current, ...changes })
    const { removed } = getHistoryRetentionPlan(historyRef.current, nextSettings)
    if (removed.length > 0) {
      const destructiveSnapshot = captureUndoState({ bodyCacheIds: removed.map(item => item._id) })
      before = {
        ...before,
        bodyCache: { ...(before.bodyCache || {}), ...(destructiveSnapshot.bodyCache || {}) }
      }
      settingsRef.current = nextSettings
      setSettings(nextSettings)
      setPendingRetentionChange({ before, changes, count: removed.length })
      return
    }
    commitSettingsChange(changes, before)
  }, [captureUndoState, commitSettingsChange])

  const handleCancelRetentionChange = useCallback(() => {
    const before = pendingRetentionChange?.before
    if (before?.settings) {
      settingsRef.current = before.settings
      setSettings(before.settings)
    }
    pendingSettingsUndoRef.current = null
    setPendingRetentionChange(null)
  }, [pendingRetentionChange])

  const handleConfirmRetentionChange = useCallback(() => {
    const pending = pendingRetentionChange
    if (!pending) return
    setPendingRetentionChange(null)
    commitSettingsChange(pending.changes, pending.before)
  }, [commitSettingsChange, pendingRetentionChange])

  const handleWordWrapChange = useCallback((wordWrap) => {
    if (settingsRef.current.wordWrap === wordWrap) return
    try {
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, wordWrap })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
      })
    } catch (error) {
      console.error('保存自动换行设置失败', error)
      showNotice(t(settingsRef.current.language, 'notice.wordWrapSaveFailed'), 'error')
    }
  }, [performUndoable, showNotice])

  const handleAutoSaveEntriesChange = useCallback((autoSaveEntries) => {
    if (settingsRef.current.autoSaveEntries === autoSaveEntries) return
    let draftCommitFailed = false
    try {
      cancelPendingPersistence()
      const draftIds = autoSaveEntries
        ? [...new Set([
            ...draftSummariesRef.current.keys(),
            ...(dirtyRef.current && activeHistoryIdRef.current ? [activeHistoryIdRef.current] : [])
          ])]
        : []
      const before = captureUndoState({ bodyCacheIds: draftIds })
      performUndoable(() => {
        const nextSettings = saveSettings(window.utools, { ...settingsRef.current, autoSaveEntries })
        settingsRef.current = nextSettings
        setSettings(nextSettings)
        if (autoSaveEntries) {
          const activeHistoryId = activeHistoryIdRef.current
          let nextHistory = historyRef.current
          for (const historyId of draftIds) {
            const draft = historyId === activeHistoryId && dirtyRef.current
              ? {
                  historyId,
                  content: textRef.current,
                  dirty: true,
                  editorMode: settingsRef.current.editorMode,
                  codeLanguage: settingsRef.current.codeLanguage,
                  file: fileRef.current
                }
              : getDraftBody(historyId)
            if (!draft) {
              forgetDraft(window.utools, historyId)
              continue
            }
            try {
              nextHistory = saveHistoryEntry(window.utools, nextHistory, draft.content, nextSettings, {
                historyId,
                editorMode: draft.editorMode,
                codeLanguage: draft.codeLanguage,
                onBeforeRemove: cacheRemovedHistoryEntry
              })
              const persisted = nextHistory.find(item => item._id === historyId)
              if (persisted && !persisted._transient) cacheHistoryBody(historyId, persisted._rev, draft.content)
              forgetDraft(window.utools, historyId)
            } catch (error) {
              draftCommitFailed = true
              console.error('提交恢复草稿失败', error)
              if (historyId === activeHistoryId && !draftSummariesRef.current.has(historyId)) {
                cacheDraftBody(saveDraft(window.utools, draft))
              }
            }
          }
          const remainingDrafts = [...draftSummariesRef.current.values()]
          syncHistoryState(mergeHistoryDrafts(loadHistory(window.utools), remainingDrafts))
          dirtyRef.current = Boolean(activeHistoryId && draftSummariesRef.current.has(activeHistoryId))
        } else if (dirtyRef.current) {
          persistDraft(textRef.current, true, true)
        }
      }, { before })
      if (draftCommitFailed) showNotice(t(settingsRef.current.language, 'notice.saveFailed'), 'error')
    } catch (error) {
      console.error('保存自动保存设置失败', error)
      try {
        syncHistoryState(mergeHistoryDrafts(loadHistory(window.utools), [...draftSummariesRef.current.values()]))
      } catch {}
      showNotice(t(settingsRef.current.language, 'notice.settingsSaveFailed'), 'error')
    }
  }, [cacheDraftBody, cacheHistoryBody, cacheRemovedHistoryEntry, cancelPendingPersistence, captureUndoState, forgetDraft, getDraftBody, performUndoable, persistDraft, showNotice, syncHistoryState])

  const handleOpenSettings = useCallback(() => {
    pendingSettingsUndoRef.current = null
    setSettingsInitialTab('general')
    setSettingsOpen(true)
  }, [])
  const handleOpenPluginAiSettings = useCallback(() => {
    pendingSettingsUndoRef.current = null
    setAiAssistant(null)
    setSettingsInitialTab('ai')
    setSettingsOpen(true)
  }, [])
  const handleOpenHelp = useCallback(() => {
    setHistoryPreview(null)
    setHelpOpen(true)
  }, [])
  const handleCloseHelp = useCallback(() => setHelpOpen(false), [])
  const handleStartGuide = useCallback(() => {
    setHelpOpen(false)
    setHistoryPreview(null)
    if (!sidebarExpandedRef.current) syncSidebarExpanded(true)
    requestAnimationFrame(() => setGuideStep(0))
  }, [syncSidebarExpanded])
  const handleEndGuide = useCallback((skipped = false) => {
    setGuideStep(-1)
    if (!skipped) {
      showNotice(t(settingsRef.current.language, 'notice.tutorialCompleted'))
      triggerConfetti()
    }
  }, [showNotice])
  const handleCloseSettings = useCallback(() => {
    const pendingState = pendingRetentionChange?.before || pendingSettingsUndoRef.current
    if (pendingState) {
      settingsRef.current = pendingState.settings
      setSettings(pendingState.settings)
      pendingSettingsUndoRef.current = null
    }
    setPendingRetentionChange(null)
    setSettingsOpen(false)
  }, [pendingRetentionChange])
  const handleRequestClear = useCallback(() => setClearConfirmOpen(true), [])
  const handleCancelClear = useCallback(() => setClearConfirmOpen(false), [])

  const handleSearchTextChange = useCallback((value) => {
    setSearchText(value)
    setSearchIndex(-1)
  }, [])

  const handleFindNext = useCallback(() => {
    if (searchMatches.length === 0) {
      showNotice(t(settingsRef.current.language, searchText ? 'notice.noMatches' : 'notice.enterFind'))
      return
    }

    const textArea = textAreaRef.current
    const currentSelectionEnd = textArea?.selectionEnd ?? 0
    const current = searchMatches[searchIndex]
    const selectionIsCurrent = current && textArea?.selectionStart === current.start && currentSelectionEnd === current.end
    let nextIndex = selectionIsCurrent
      ? (searchIndex + 1) % searchMatches.length
      : searchMatches.findIndex(match => match.start >= currentSelectionEnd)
    if (nextIndex < 0) nextIndex = 0

    const match = searchMatches[nextIndex]
    setSearchIndex(nextIndex)
    requestAnimationFrame(() => {
      textArea?.focus()
      textArea?.setSelectionRange(match.start, match.end)
    })
  }, [searchIndex, searchMatches, searchText, showNotice])

  const handleFindPrevious = useCallback(() => {
    if (searchMatches.length === 0) {
      showNotice(t(settingsRef.current.language, searchText ? 'notice.noMatches' : 'notice.enterFind'))
      return
    }

    const textArea = textAreaRef.current
    const currentSelectionStart = textArea?.selectionStart ?? 0
    const currentSelectionEnd = textArea?.selectionEnd ?? 0
    const current = searchMatches[searchIndex]
    const selectionIsCurrent = current && currentSelectionStart === current.start && currentSelectionEnd === current.end
    let previousIndex
    if (selectionIsCurrent) {
      previousIndex = (searchIndex - 1 + searchMatches.length) % searchMatches.length
    } else {
      previousIndex = searchMatches.findLastIndex(match => match.end <= currentSelectionStart)
      if (previousIndex < 0) previousIndex = searchMatches.length - 1
    }

    const match = searchMatches[previousIndex]
    setSearchIndex(previousIndex)
    requestAnimationFrame(() => {
      textArea?.focus()
      textArea?.setSelectionRange(match.start, match.end)
    })
  }, [searchIndex, searchMatches, searchText, showNotice])

  const handleReplaceCurrent = useCallback(() => {
    if (searchMatches.length === 0) {
      showNotice(t(settingsRef.current.language, searchText ? 'notice.noMatches' : 'notice.enterFind'))
      return
    }

    const textArea = textAreaRef.current
    const selectionStart = textArea?.selectionStart ?? 0
    const selectionEnd = textArea?.selectionEnd ?? 0
    let matchIndex = searchMatches.findIndex(match => match.start === selectionStart && match.end === selectionEnd)
    if (matchIndex < 0) {
      matchIndex = searchMatches.findIndex(match => match.start >= selectionEnd)
      if (matchIndex < 0) matchIndex = 0
    }

    const match = searchMatches[matchIndex]
    if (settingsRef.current.editorMode === 'markdown' && textArea?.replaceTextRange) {
      const estimatedLength = textRef.current.length + replaceText.length - (match.end - match.start)
      if (estimatedLength > MAX_TEXT_LENGTH) {
        showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
        return
      }
      textArea.replaceTextRange(match.start, match.end, replaceText)
      const nextMatches = textArea.getSearchMatches?.(searchText) || []
      let nextIndex = nextMatches.findIndex(item => item.start >= match.start + replaceText.length)
      if (nextIndex < 0 && nextMatches.length > 0) nextIndex = 0
      setMarkdownSearchMatches(nextMatches)
      setSearchIndex(nextIndex)
      showNotice(t(settingsRef.current.language, 'notice.replacedOne'))
      requestAnimationFrame(() => {
        const nextMatch = nextMatches[nextIndex]
        if (nextMatch) textArea.setSelectionRange(nextMatch.start, nextMatch.end)
      })
      return
    }
    const nextText = textRef.current.slice(0, match.start) + replaceText + textRef.current.slice(match.end)
    if (nextText.length > MAX_TEXT_LENGTH) {
      showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
      return
    }

    const nextMatches = findLiteralMatches(nextText, searchText)
    const nextSearchStart = match.start + replaceText.length
    let nextIndex = nextMatches.findIndex(item => item.start >= nextSearchStart)
    if (nextIndex < 0 && nextMatches.length > 0) nextIndex = 0
    updateEditorText(nextText, { mergeKey: nextEditorUndoMergeKey('replace') })
    setSearchIndex(nextIndex)
    showNotice(t(settingsRef.current.language, 'notice.replacedOne'))
    requestAnimationFrame(() => {
      textArea?.focus()
      if (nextIndex >= 0) {
        textArea?.setSelectionRange(nextMatches[nextIndex].start, nextMatches[nextIndex].end)
      } else {
        textArea?.setSelectionRange(nextSearchStart, nextSearchStart)
      }
    })
  }, [nextEditorUndoMergeKey, replaceText, searchMatches, searchText, showNotice, updateEditorText])

  const handleReplaceAll = useCallback(() => {
    const textArea = textAreaRef.current
    if (settingsRef.current.editorMode === 'markdown' && textArea?.replaceAllText) {
      const matches = textArea.getSearchMatches?.(searchText) || []
      if (matches.length === 0) {
        showNotice(t(settingsRef.current.language, 'notice.noMatches'))
        return
      }
      const estimatedLength = textRef.current.length + matches.length * (replaceText.length - searchText.length)
      if (estimatedLength > MAX_TEXT_LENGTH) {
        showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
        return
      }
      const count = textArea.replaceAllText(searchText, replaceText)
      setMarkdownSearchMatches([])
      setSearchIndex(-1)
      showNotice(t(settingsRef.current.language, 'notice.replacedMany', { count }))
      return
    }
    const result = replaceLiteralMatches(textRef.current, searchText, replaceText)
    if (result.count === 0) {
      showNotice(t(settingsRef.current.language, 'notice.noMatches'))
      return
    }
    if (result.text.length > MAX_TEXT_LENGTH) {
      showNotice(t(settingsRef.current.language, 'notice.textTooLong', { max: MAX_TEXT_LENGTH }), 'error')
      return
    }
    updateEditorText(result.text, { mergeKey: nextEditorUndoMergeKey('replace-all') })
    setSearchIndex(-1)
    showNotice(t(settingsRef.current.language, 'notice.replacedMany', { count: result.count }))
  }, [nextEditorUndoMergeKey, replaceText, searchText, showNotice, updateEditorText])

  return (
    <ThemeProvider theme={ghibliTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'transparent', color: 'text.primary', transition: 'background-color 0.3s ease, color 0.3s ease' }}>
        <Snackbar
          key={noticeId}
          open={Boolean(notice)}
          autoHideDuration={getNoticeDuration(noticeSeverity)}
          onClose={(_, reason) => {
            if (reason !== 'clickaway') setNotice('')
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            severity={noticeSeverity}
            icon={false}
            sx={{
              width: 'auto',
              minWidth: 120,
              bgcolor: noticeSeverity === 'error'
                ? (isDark ? '#8C3F45' : '#A94F49')
                : noticeSeverity === 'warning'
                  ? (isDark ? '#735C24' : '#8A6A20')
                  : noticeSeverity === 'info'
                    ? (isDark ? '#496778' : '#527789')
                    : (isDark ? '#4A6651' : '#5D7C66'),
              color: '#fff',
              boxShadow: isDark ? '0 6px 16px rgba(0,0,0,0.4)' : '0 6px 16px rgba(93, 124, 102, 0.3)',
              borderRadius: 3,
              border: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiAlert-message': { width: '100%', py: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 600 }
            }}
          >
            {notice}
          </Alert>
        </Snackbar>
        <HistoryPanel
          autoSaveEntries={settings.autoSaveEntries}
          canCopy={Boolean((historyPreview?.content ?? visibleText).length)}
          canSave={!historyPreview && Boolean(selectedHistoryId || fileState)}
          expanded={sidebarExpanded}
          history={history}
          latestCreatedHistoryId={latestCreatedHistoryId}
          language={language}
          selectedHistoryId={selectedHistoryId}
          onAutoSaveEntriesChange={handleAutoSaveEntriesChange}
          onCopy={handleCopy}
          onDelete={handleDeleteHistory}
          onLoad={handleLoadHistory}
          onNew={handleNewHistory}
          onOpenHelp={handleOpenHelp}
          onOpenFile={handleOpenFile}
          onOpenSettings={handleOpenSettings}
          onPreviewChange={handleHistoryPreviewChange}
          onPreviewWheel={handleHistoryPreviewWheel}
          onRename={handleRenameHistory}
          onReorder={handleReorderHistory}
          onResolveEntry={resolveHistoryEntry}
          onRequestClear={handleRequestClear}
          onSave={handleSaveFile}
        />
        <EditorPane
          codeLanguage={settings.codeLanguage}
          contentFontFamily={contentFontStack}
          editorMode={settings.editorMode}
          language={language}
          encoding={fileState?.encoding || 'utf8'}
          fileState={fileState}
          lineEnding={fileState?.lineEnding || 'lf'}
          onChange={handleTextChange}
          onCompositionEnd={handleCompositionEnd}
          onCompositionStart={handleCompositionStart}
          onCodeDetectionChange={handleCodeDetectionChange}
          onCodeLanguageChange={handleCodeLanguageChange}
          onEditorModeChange={handleEditorModeChangeWithSelection}
          onEncodingChange={handleEncodingChange}
          onFormatText={handleFormatText}
          onOpenAiFormatting={openAiFormatting}
          onEditorReady={focusEditorAndRestoreSelection}
          onKeyDown={handleKeyDown}
          onCopyAll={handleCopy}
          onLineEndingChange={handleLineEndingChange}
          onReloadWithEncoding={handleReloadWithEncoding}
          onOpenShareStudio={handleOpenShareStudio}
          onPreviewDismiss={handleHistoryPreviewDismiss}
          onToggleSidebar={handleToggleSidebar}
          onWheel={handleEditorWheel}
          onZoomChange={handleZoom}
          sidebarExpanded={sidebarExpanded}
          sidebarShortcut={settings.sidebarShortcut}
          text={visibleText}
          textAreaRef={textAreaRef}
          preview={historyPreview}
          previewScrollRef={historyPreviewScrollRef}
          searchPanel={(
            <EditorSearchBar
              currentMatch={searchIndex}
              language={language}
              matchCount={searchMatches.length}
              mode={searchMode}
              onClose={handleCloseSearch}
              onFindNext={handleFindNext}
              onFindPrevious={handleFindPrevious}
              onReplaceAll={handleReplaceAll}
              onReplaceCurrent={handleReplaceCurrent}
              onReplaceTextChange={setReplaceText}
              onSearchTextChange={handleSearchTextChange}
              open={searchOpen}
              replaceInputRef={replaceInputRef}
              replaceText={replaceText}
              searchInputRef={searchInputRef}
              searchText={searchText}
            />
          )}
          wordWrap={settings.wordWrap}
          zoom={settings.zoom}
        />
        {settingsOpen ? <Suspense fallback={null}><SettingsDialog
          initialTab={settingsInitialTab}
          isDark={isDark}
          language={language}
          languagePreference={settings.language}
          interfaceFont={settings.interfaceFont}
          contentFont={settings.contentFont}
          imageSaveDirectory={settings.imageSaveDirectory}
          onImageSaveDirectoryChange={handleImageSaveDirectoryChange}
          onContentFontChange={handleContentFontChange}
          onInterfaceFontChange={handleInterfaceFontChange}
          onLanguageChange={handleLanguageChange}
          onRememberSidebarStateChange={handleRememberSidebarStateChange}
          onSidebarShortcutChange={handleSidebarShortcutChange}
          onStartupBehaviorChange={handleStartupBehaviorChange}
          onThemeModeChange={handleThemeModeChange}
          themeMode={settings.themeMode}
          historyLimitMode={settings.historyLimitMode}
          historyMaxAgeDays={settings.historyMaxAgeDays}
          maxHistory={settings.maxHistory}
          aiModel={settings.aiModel}
          aiDirectEnabled={settings.aiDirectEnabled}
          aiDirectBaseUrl={settings.aiDirectBaseUrl}
          aiDirectApiKey={settings.aiDirectApiKey}
          aiDirectModel={settings.aiDirectModel}
          aiFormattingPrompt={settings.aiFormattingPrompt}
          aiImageGenerationPrompt={settings.aiImageGenerationPrompt}
          availableAiModels={availableAiModels}
          aiModelsLoading={aiModelsLoading}
          onRefreshAiModels={() => refreshAiModels(true)}
          onOpenAiModelsSettings={() => host.openAiModelsSettings()}
          onChange={handleSettingsChange}
          onClose={handleCloseSettings}
          onCommit={handleSettingsCommit}
          onNotify={showNotice}
          open={settingsOpen}
          rememberSidebarState={settings.rememberSidebarState}
          sidebarShortcut={settings.sidebarShortcut}
          startupBehavior={settings.startupBehavior}
          wordWrap={settings.wordWrap}
          onWordWrapChange={handleWordWrapChange}
        /></Suspense> : null}
        {goToLineOpen ? <Suspense fallback={null}><GoToLineDialog
          inputRef={goToLineInputRef}
          language={language}
          lineCount={countLines(visibleText)}
          onChange={setGoToLineValue}
          onClose={handleCloseGoToLine}
          onConfirm={handleGoToLine}
          open={goToLineOpen}
          value={goToLineValue}
        /></Suspense> : null}
        {clearConfirmOpen ? <Suspense fallback={null}><ClearHistoryDialog
          count={history.length}
          language={language}
          onCancel={handleCancelClear}
          onConfirm={handleClearHistory}
          open={clearConfirmOpen}
        /></Suspense> : null}
        {pendingRetentionChange ? <Suspense fallback={null}><RetentionConfirmDialog
          count={pendingRetentionChange?.count || 0}
          language={language}
          onCancel={handleCancelRetentionChange}
          onConfirm={handleConfirmRetentionChange}
          open={Boolean(pendingRetentionChange)}
        /></Suspense> : null}
        {helpOpen ? <Suspense fallback={null}><HelpDialog
          isDark={isDark}
          language={language}
          onClose={handleCloseHelp}
          onDonationThanks={() => showNotice(t(language, 'donation.thanks'))}
          onStartGuide={handleStartGuide}
          open={helpOpen}
          sidebarShortcut={settings.sidebarShortcut}
        /></Suspense> : null}
        {guideStep >= 0 ? <Suspense fallback={null}><GuideOverlay
          currentStep={guideStep}
          language={language}
          onComplete={handleEndGuide}
          onNext={() => setGuideStep(current => Math.min(guideSteps.length - 1, current + 1))}
          onPrev={() => setGuideStep(current => Math.max(0, current - 1))}
          steps={guideSteps}
        /></Suspense> : null}
        {shareStudio ? <Suspense fallback={null}><ShareStudioDialog
          aiImageGenerationPrompt={settings.aiImageGenerationPrompt}
          aiModel={shareStudio.kind === 'generated-image' ? activeImageAiModel(settings) : activeAiModel(settings)}
          directAi={shareStudio.kind === 'generated-image' ? directImageAiConnection(settings) : null}
          data={shareStudio}
          imageSaveDirectory={settings.imageSaveDirectory}
          isDark={isDark}
          language={language}
          onClose={() => setShareStudio(null)}
          onExported={() => triggerConfetti(SHARE_STUDIO_CONFETTI_OPTIONS)}
          onNotify={showNotice}
          open={Boolean(shareStudio)}
        /></Suspense> : null}
        {aiAssistant ? <Suspense fallback={null}><AIAssistantDialog
          aiFormattingPrompt={settings.aiFormattingPrompt}
          aiModel={aiAssistant.mode === 'image-generation' ? activeImageAiModel(settings) : activeAiModel(settings)}
          directAi={aiAssistant.mode === 'image-generation' ? directImageAiConnection(settings) : null}
          aiImageGenerationPrompt={settings.aiImageGenerationPrompt}
          content={aiAssistant.content}
          imageSaveDirectory={settings.imageSaveDirectory}
          isDark={isDark}
          language={language}
          mode={aiAssistant.mode}
          onNotify={showNotice}
          onOpenPluginAiSettings={handleOpenPluginAiSettings}
          onApply={result => {
            if (aiAssistant.mode !== 'formatting') return false
            if (textRef.current !== aiAssistant.content) {
              showNotice(t(settingsRef.current.language, 'ai.sourceChanged'), 'warning')
              return false
            }
            return applyAiFormatting(result)
          }}
          onClose={() => setAiAssistant(null)}
          onOpenImageWorkbench={(image, generation = {}) => {
            if (aiAssistant.mode !== 'image-generation' || !image) return
            setAiAssistant(null)
            setShareStudio({
              kind: 'generated-image',
              image,
              content: aiAssistant.content,
              generationPrompt: generation.prompt || '',
              title: aiAssistant.title || t(settingsRef.current.language, 'ai.generateImage')
            })
          }}
          open={Boolean(aiAssistant)}
          title={t(language, aiAssistant.mode === 'image-generation' ? 'ai.generateImage' : 'ai.formatting')}
        /></Suspense> : null}
      </Box>
    </ThemeProvider>
  )
}

export default App
