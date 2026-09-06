export const FEATURE_CODE = 'flash-note-text'
export const FEATURE_LABEL = '闪念文本'
export const STORAGE_NAMESPACE = 'flash_note_text'
export const FEATURE_COMMAND_LABELS = Object.freeze([
  FEATURE_LABEL,
  '闪念',
  '快速文本',
  '快速编辑',
  '文本编辑',
  '文本编辑器',
  '草稿本',
  'FlashNote Text'
])
export const HISTORY_PREFIX = `${FEATURE_CODE}/history/`
export const HISTORY_INDEX_KEY = `${STORAGE_NAMESPACE}_history_index`
export const HISTORY_INDEX_PATCH_KEY = `${STORAGE_NAMESPACE}_history_index_patch`
export const SETTINGS_KEY = `${STORAGE_NAMESPACE}_settings`
export const DRAFT_KEY = `${STORAGE_NAMESPACE}_draft`
export const DRAFT_ENTRY_PREFIX = `${DRAFT_KEY}/`
export const EXIT_SESSION_KEY = `${STORAGE_NAMESPACE}_exit_session`
export const LAST_VIEWED_HISTORY_KEY = `${STORAGE_NAMESPACE}_last_viewed`
export const HISTORY_VIEW_STATE_PREFIX = `${STORAGE_NAMESPACE}_view_state/`
export const SIDEBAR_STATE_KEY = `${STORAGE_NAMESPACE}_sidebar_state`
export const DEFAULT_SIDEBAR_SHORTCUT = 'Alt+Z'
export const DEFAULT_INTERFACE_FONT = 'system-ui'
export const DEFAULT_CONTENT_FONT = 'LXGW WenKai'

export const HISTORY_LIMIT_MODES = Object.freeze({ COUNT: 'count', TIME: 'time' })
export const THEME_MODES = Object.freeze({ AUTO: 'auto', LIGHT: 'light', DARK: 'dark' })
export const STARTUP_BEHAVIORS = Object.freeze({ NEW: 'new', RESTORE: 'restore' })
export const DEFAULT_SETTINGS = Object.freeze({
  themeMode: THEME_MODES.AUTO,
  language: 'auto',
  interfaceFont: DEFAULT_INTERFACE_FONT,
  contentFont: DEFAULT_CONTENT_FONT,
  historyLimitMode: HISTORY_LIMIT_MODES.COUNT,
  maxHistory: 20,
  historyMaxAgeDays: 30,
  autoSaveEntries: true,
  wordWrap: true,
  zoom: 100,
  editorMode: 'text',
  codeLanguage: 'auto',
  sidebarShortcut: DEFAULT_SIDEBAR_SHORTCUT,
  rememberSidebarState: true,
  startupBehavior: STARTUP_BEHAVIORS.RESTORE,
  imageSaveDirectory: '',
  aiModel: '',
  aiDirectEnabled: false,
  aiDirectBaseUrl: '',
  aiDirectApiKey: '',
  aiDirectModel: '',
  aiFormattingPrompt: '',
  aiImageGenerationPrompt: ''
})
export const MAX_HISTORY_MIN = 9
export const MAX_HISTORY_MAX = 9999
export const MIN_HISTORY_AGE_DAYS = 3
export const MAX_HISTORY_AGE_DAYS = 30 * 365
export const HISTORY_AGE_PRESETS = Object.freeze([
  { days: 3 },
  { days: 7 },
  { days: 30 },
  { days: 90 },
  { days: 365 },
  { days: 3 * 365 },
  { days: 5 * 365 },
  { days: 10 * 365 },
  { days: 20 * 365 },
  { days: 30 * 365 }
])
export const MAX_TEXT_LENGTH = 200000
export const MAX_HISTORY_TITLE_LENGTH = 120
export const AUTO_HISTORY_TITLE_LENGTH = 16
export const EDITOR_FONT_SIZE = 16
export const EDITOR_GUTTER_WIDTH = 44
export const MIN_EDITOR_ZOOM = 50
export const MAX_EDITOR_ZOOM = 200
