import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Tooltip from './ActionTooltip'
import Typography from '@mui/material/Typography'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import TranslateIcon from '@mui/icons-material/Translate'
import FontDownloadOutlinedIcon from '@mui/icons-material/FontDownloadOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  DEFAULT_SIDEBAR_SHORTCUT,
  HISTORY_AGE_PRESETS,
  HISTORY_LIMIT_MODES,
  MAX_HISTORY_AGE_DAYS,
  MAX_HISTORY_MAX,
  MAX_HISTORY_MIN,
  MIN_HISTORY_AGE_DAYS,
  STARTUP_BEHAVIORS,
  THEME_MODES
} from '../constants'
import { isReservedEditorShortcut, shortcutFromKeyboardEvent } from '../shortcut'
import { formatHistoryAge, LANGUAGE_OPTIONS, t } from '../locales'
import {
  createContentFontStack,
  createInterfaceFontStack,
  DEFAULT_CONTENT_FONT,
  DEFAULT_INTERFACE_FONT,
  normalizeLocalFontFamilies
} from '../localFonts'
import { AI_MODEL_VISION_SUPPORT, getAiModelVisionSupport, resolveAiModelSelection } from '../services/aiService'

const FONT_MENU_BATCH_SIZE = 100
const SECTION_TITLE_SX = { mb: 1.25, fontWeight: 700 }
const SETTINGS_MENU_LIST_SX = {
  '& .MuiMenuItem-root': {
    transition: 'background-color 180ms ease, color 180ms ease'
  }
}

// 设置页标签页按钮使用 PhraseManager 的完整交互状态，确保悬停、按下和选中状态清晰可辨。
function createSettingsTabSx (isDark) {
  return {
    minWidth: 80,
    height: 36,
    minHeight: 36,
    px: 1.5,
    py: 0,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1.5,
    bgcolor: isDark ? '#2b2b2b' : '#fff',
    color: 'text.secondary',
    fontSize: '1rem',
    lineHeight: 1.2,
    fontWeight: 700,
    translate: '0 0',
    transition: [
      'translate 160ms cubic-bezier(0.2, 0, 0, 1)',
      'box-shadow 180ms ease',
      'background-color 180ms ease',
      'border-color 180ms ease',
      'color 180ms ease'
    ].join(', '),
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none'
    },
    '&:hover:not(.Mui-disabled)': {
      translate: '0 0',
      bgcolor: isDark ? 'rgba(143, 181, 149, 0.12)' : 'rgba(93, 124, 102, 0.08)',
      borderColor: isDark ? 'rgba(143, 181, 149, 0.72)' : 'rgba(93, 124, 102, 0.62)',
      color: isDark ? '#e5f0e7' : '#35523e'
    },
    '&:active:not(.Mui-disabled)': {
      translate: '0 0',
      bgcolor: isDark ? 'rgba(143, 181, 149, 0.2)' : 'rgba(93, 124, 102, 0.14)',
      borderColor: isDark ? 'rgba(143, 181, 149, 0.9)' : 'rgba(93, 124, 102, 0.82)'
    },
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: isDark ? 'rgba(0, 0, 0, 0.72)' : 'primary.contrastText',
      borderColor: 'primary.main',
      '&:hover:not(.Mui-disabled)': {
        translate: '0 0',
        bgcolor: isDark ? '#99bda0' : '#668970',
        color: isDark ? 'rgba(0, 0, 0, 0.72)' : 'primary.contrastText',
        borderColor: isDark ? '#99bda0' : '#668970'
      },
      '&:active:not(.Mui-disabled)': {
        translate: '0 0',
        bgcolor: isDark ? '#7da283' : '#4f6f58',
        color: isDark ? 'rgba(0, 0, 0, 0.72)' : 'primary.contrastText',
        borderColor: isDark ? '#7da283' : '#4f6f58'
      }
    }
  }
}

// 设置页普通按钮的视觉反馈与 PhraseManager 主题保持一致。
function createSettingsButtonSx (isDark) {
  return {
    borderRadius: '12px',
    boxShadow: 'none',
    transform: 'none',
    translate: '0 0',
    transition: [
      'translate 160ms cubic-bezier(0.2, 0, 0, 1)',
      'box-shadow 180ms ease',
      'background-color 180ms ease',
      'border-color 180ms ease',
      'color 180ms ease'
    ].join(', '),
    '@media (hover: hover) and (pointer: fine)': {
      '&:hover:not(.Mui-disabled)': { translate: '0 -1px' }
    },
    '&:active:not(.Mui-disabled)': { translate: '0 0', transform: 'none' },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&:hover:not(.Mui-disabled)': { translate: '0 0' }
    },
    '&:hover:not(.Mui-disabled)': { boxShadow: 'none' },
    '&.MuiButton-contained': {
      boxShadow: isDark
        ? '0 2px 5px rgba(0, 0, 0, 0.28)'
        : '0 2px 5px rgba(67, 52, 27, 0.16)',
      '&:hover:not(.Mui-disabled)': {
        boxShadow: isDark
          ? '0 4px 11px rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(143, 181, 149, 0.08)'
          : '0 4px 11px rgba(67, 52, 27, 0.18), 0 0 0 1px rgba(93, 124, 102, 0.08)'
      },
      '&:active:not(.Mui-disabled)': {
        boxShadow: isDark
          ? '0 1px 3px rgba(0, 0, 0, 0.24)'
          : '0 1px 3px rgba(67, 52, 27, 0.13)'
      }
    },
    '&.MuiButton-containedPrimary:hover:not(.Mui-disabled)': {
      backgroundColor: isDark ? '#99bda0' : '#668970'
    },
    '&.MuiButton-outlined:hover:not(.Mui-disabled)': {
      backgroundColor: isDark ? 'rgba(143, 181, 149, 0.1)' : 'rgba(93, 124, 102, 0.07)',
      borderColor: isDark ? 'rgba(143, 181, 149, 0.72)' : 'rgba(93, 124, 102, 0.62)'
    },
    '&.MuiButton-text:hover:not(.Mui-disabled)': {
      backgroundColor: isDark ? 'rgba(143, 181, 149, 0.1)' : 'rgba(93, 124, 102, 0.07)'
    }
  }
}

// 图标按钮沿用 PhraseManager 的颜色、阴影和悬停反馈。
function createSettingsIconButtonSx (isDark) {
  return {
    transform: 'none',
    translate: '0 0',
    transition: [
      'translate 160ms cubic-bezier(0.2, 0, 0, 1)',
      'box-shadow 180ms ease',
      'background-color 180ms ease',
      'color 180ms ease'
    ].join(', '),
    color: 'var(--ghibli-text)',
    '&:hover:not(.Mui-disabled)': {
      translate: '0 -1px',
      transform: 'none',
      backgroundColor: isDark ? 'rgba(143, 181, 149, 0.14)' : 'rgba(93, 124, 102, 0.1)',
      boxShadow: isDark
        ? '0 2px 7px rgba(0, 0, 0, 0.18)'
        : '0 2px 7px rgba(67, 52, 27, 0.1)'
    },
    '&:active:not(.Mui-disabled)': { translate: '0 0', transform: 'none' },
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
      '&:hover:not(.Mui-disabled)': { translate: '0 0', transform: 'none' }
    }
  }
}

// MUI 的 Select 基于 OutlinedInput，以下规则直接复用 PhraseManager 的下拉框边框状态。
function createSettingsSelectSx (isDark) {
  return {
    borderRadius: 12,
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(143, 181, 149, 0.5)' : 'rgba(93, 124, 102, 0.5)'
    },
    '&:hover:not(.Mui-disabled):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(143, 181, 149, 0.72)' : 'rgba(93, 124, 102, 0.62)'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? '#8FB595' : '#5D7C66',
      borderWidth: '2px'
    },
    '&.Mui-focused:not(:focus-within):not(:has([aria-expanded="true"])) .MuiOutlinedInput-notchedOutline': {
      borderColor: isDark ? 'rgba(143, 181, 149, 0.5)' : 'rgba(93, 124, 102, 0.5)',
      borderWidth: '1px'
    }
  }
}

// 下拉菜单容器采用 PhraseManager 的纸张边框和阴影。
function createSettingsMenuPaperSx (isDark) {
  return {
    backgroundImage: 'none',
    border: isDark ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(67, 52, 27, 0.1)',
    borderRadius: 2,
    boxShadow: 'var(--ghibli-shadow)'
  }
}

function getAiModelValue (model) {
  return typeof model === 'string' ? model : model?.id || model?.name || model?.model || ''
}

function getAiModelLabel (model) {
  return typeof model === 'string' ? model : model?.label || model?.name || model?.id || model?.model || ''
}

function AiModelVisionIndicator ({ language, model, models }) {
  const support = getAiModelVisionSupport(model, models)
  if (support === AI_MODEL_VISION_SUPPORT.UNKNOWN) return null
  const supported = support === AI_MODEL_VISION_SUPPORT.YES
  const resolvedModel = resolveAiModelSelection(model, models)
  const modelName = resolvedModel?.label || resolvedModel?.id || getAiModelLabel(model) || t(language, 'ai.modelAuto')
  const label = t(language, supported ? 'ai.visionSupported' : 'ai.visionUnsupported', { model: modelName })
  const Icon = supported ? VisibilityOutlinedIcon : VisibilityOffOutlinedIcon
  return (
    <Tooltip title={label}>
      <Icon
        aria-label={label}
        fontSize="small"
        sx={{
          color: supported ? 'success.main' : 'text.disabled',
          flex: '0 0 auto'
        }}
      />
    </Tooltip>
  )
}

function AiModelOption ({ isDefault = false, language, model, models }) {
  const resolvedModel = isDefault ? resolveAiModelSelection('', models) : model
  const label = isDefault && resolvedModel
    ? `${getAiModelLabel(model)}：${getAiModelLabel(resolvedModel)}`
    : getAiModelLabel(model)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, width: '100%' }}>
      <Typography component="span" noWrap sx={{ minWidth: 0, flex: 1 }}>{label}</Typography>
      <AiModelVisionIndicator language={language} model={resolvedModel || model} models={models} />
    </Box>
  )
}

function FontSetting ({
  createFontStack,
  defaultFont,
  defaultLabel,
  fontFamilies,
  isDark,
  label,
  language,
  localFontStatus,
  onChange,
  onRequestFonts,
  value
}) {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [menuLimit, setMenuLimit] = useState(FONT_MENU_BATCH_SIZE)
  const fontStack = useMemo(() => createFontStack(value), [createFontStack, value])
  const visibleFontFamilies = useMemo(() => normalizeLocalFontFamilies(
    fontFamilies,
    language,
    [defaultFont, value]
  ), [defaultFont, fontFamilies, language, value])
  const renderedFontFamilies = useMemo(
    () => visibleFontFamilies.slice(0, menuLimit),
    [menuLimit, visibleFontFamilies]
  )

  const openMenu = event => {
    setMenuLimit(FONT_MENU_BATCH_SIZE)
    setMenuAnchor(event.currentTarget)
    onRequestFonts()
  }

  return (
    <Box sx={{ mt: 2.25 }}>
      <Typography variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
        {label}
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        startIcon={<FontDownloadOutlinedIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={Boolean(menuAnchor)}
        sx={{
          ...createSettingsButtonSx(isDark),
          justifyContent: 'flex-start',
          fontFamily: fontStack,
          '& .MuiButton-endIcon': { ml: 'auto' }
        }}
      >
        {value === defaultFont ? defaultLabel : value}
      </Button>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        disableRestoreFocus
        disableScrollLock
        MenuListProps={{ dense: true, 'aria-label': label, sx: SETTINGS_MENU_LIST_SX }}
        slotProps={{
          paper: {
            onScroll: event => {
              const menu = event.currentTarget
              if (menu.scrollTop + menu.clientHeight >= menu.scrollHeight - 80) {
                setMenuLimit(limit => Math.min(limit + FONT_MENU_BATCH_SIZE, visibleFontFamilies.length))
              }
            },
            sx: { ...createSettingsMenuPaperSx(isDark), mt: 0.5, minWidth: 300, maxHeight: 360 }
          }
        }}
      >
        {renderedFontFamilies.map(font => (
          <MenuItem
            key={font}
            selected={value === font}
            onClick={() => {
              onChange(font)
              setMenuAnchor(null)
            }}
            sx={{ fontFamily: createFontStack(font) }}
          >
            {font === defaultFont ? defaultLabel : font}
          </MenuItem>
        ))}
        {localFontStatus === 'loading' && <MenuItem disabled>{t(language, 'settings.fontLoading')}</MenuItem>}
        {localFontStatus === 'unavailable' && <MenuItem disabled>{t(language, 'settings.fontUnavailable')}</MenuItem>}
      </Menu>
    </Box>
  )
}

function SettingsDialog ({
  initialTab = 'general',
  isDark,
  language,
  languagePreference,
  interfaceFont,
  contentFont,
  imageSaveDirectory,
  onImageSaveDirectoryChange,
  onContentFontChange,
  onInterfaceFontChange,
  onLanguageChange,
  onThemeModeChange,
  themeMode,
  historyLimitMode,
  historyMaxAgeDays,
  maxHistory,
  aiModel,
  aiDirectEnabled = false,
  aiDirectBaseUrl = '',
  aiDirectApiKey = '',
  aiDirectModel = '',
  aiFormattingPrompt,
  aiImageGenerationPrompt,
  availableAiModels = [],
  aiModelsLoading = false,
  onRefreshAiModels,
  onOpenAiModelsSettings,
  onChange,
  onClose,
  onCommit,
  onNotify,
  onRememberSidebarStateChange,
  onSidebarShortcutChange,
  onStartupBehaviorChange,
  onWordWrapChange,
  open,
  rememberSidebarState,
  sidebarShortcut,
  startupBehavior,
  wordWrap
}) {
  const settingsButtonSx = createSettingsButtonSx(isDark)
  const settingsIconButtonSx = createSettingsIconButtonSx(isDark)
  const settingsSelectSx = createSettingsSelectSx(isDark)
  const settingsMenuPaperSx = createSettingsMenuPaperSx(isDark)
  const [ageInput, setAgeInput] = useState(String(historyMaxAgeDays))
  const [historyCountInput, setHistoryCountInput] = useState(String(maxHistory))
  const [shortcutError, setShortcutError] = useState('')
  const [ageError, setAgeError] = useState('')
  const [historyCountError, setHistoryCountError] = useState('')
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null)
  const [localFontFamilies, setLocalFontFamilies] = useState([])
  const [localFontStatus, setLocalFontStatus] = useState('idle')
  const [formattingPromptInput, setFormattingPromptInput] = useState(aiFormattingPrompt || t(language, 'ai.formattingSystem'))
  const [imageGenerationPromptInput, setImageGenerationPromptInput] = useState(aiImageGenerationPrompt || t(language, 'ai.imageGenerationSystem'))
  const [directApiKeyVisible, setDirectApiKeyVisible] = useState(false)
  const [settingsTab, setSettingsTab] = useState(initialTab === 'ai' ? 'ai' : 'general')
  const localFontsLoadingRef = useRef(false)
  const isTimeMode = historyLimitMode === HISTORY_LIMIT_MODES.TIME
  const defaultImageSaveDirectory = useMemo(() => {
    try {
      return window.imageServices?.getDefaultSaveDirectory?.() || ''
    } catch {
      return ''
    }
  }, [])
  const displayedImageSaveDirectory = imageSaveDirectory || defaultImageSaveDirectory || t(language, 'settings.defaultImageSaveDirectory')
  const selectedAgePreset = HISTORY_AGE_PRESETS.some(preset => preset.days === historyMaxAgeDays)
    ? String(historyMaxAgeDays)
    : 'custom'

  useEffect(() => {
    setAgeInput(String(historyMaxAgeDays))
  }, [historyMaxAgeDays])

  useEffect(() => {
    setHistoryCountInput(String(maxHistory))
  }, [maxHistory])

  useEffect(() => {
    setFormattingPromptInput(aiFormattingPrompt || t(language, 'ai.formattingSystem'))
    setImageGenerationPromptInput(aiImageGenerationPrompt || t(language, 'ai.imageGenerationSystem'))
  }, [aiFormattingPrompt, aiImageGenerationPrompt, language, open])

  useEffect(() => {
    if (open) setShortcutError('')
  }, [open])

  useEffect(() => {
    if (open) setSettingsTab(initialTab === 'ai' ? 'ai' : 'general')
  }, [initialTab, open])

  const loadLocalFonts = useCallback(async (allowBrowserAccess = false) => {
    if (localFontStatus === 'loaded' || localFontsLoadingRef.current) return
    localFontsLoadingRef.current = true
    setLocalFontStatus('loading')
    try {
      let fonts = await window.fontServices?.listLocalFonts?.()
      if ((!fonts || fonts.length === 0) && allowBrowserAccess && typeof window.queryLocalFonts === 'function') {
        fonts = await window.queryLocalFonts()
      }
      if (!fonts?.length) throw new Error('当前设备没有可用的本地字体')
      setLocalFontFamilies(normalizeLocalFontFamilies(fonts, language))
      setLocalFontStatus('loaded')
    } catch {
      if (allowBrowserAccess && typeof window.queryLocalFonts === 'function') {
        try {
          const fonts = await window.queryLocalFonts()
          if (fonts?.length) {
            setLocalFontFamilies(normalizeLocalFontFamilies(fonts, language))
            setLocalFontStatus('loaded')
            return
          }
        } catch {}
      }
      setLocalFontStatus('unavailable')
    } finally {
      localFontsLoadingRef.current = false
    }
  }, [language, localFontStatus])

  useEffect(() => {
    if (open && localFontStatus === 'idle') loadLocalFonts(false)
  }, [loadLocalFonts, localFontStatus, open])

  const requestLocalFonts = useCallback(() => {
    if (localFontStatus !== 'loaded') loadLocalFonts(true)
  }, [loadLocalFonts, localFontStatus])

  const commitAgeInput = () => {
    const requested = Number(ageInput)
    if (!Number.isInteger(requested) || requested < MIN_HISTORY_AGE_DAYS || requested > MAX_HISTORY_AGE_DAYS) {
      setAgeError(t(language, 'settings.ageInvalid', { min: MIN_HISTORY_AGE_DAYS, max: MAX_HISTORY_AGE_DAYS }))
      return
    }
    setAgeError('')
    onChange({ historyMaxAgeDays: requested })
    onCommit({ historyMaxAgeDays: requested })
  }

  const commitHistoryCountInput = () => {
    const requested = Number(historyCountInput)
    if (!Number.isInteger(requested) || requested < MAX_HISTORY_MIN || requested > MAX_HISTORY_MAX) {
      setHistoryCountError(t(language, 'settings.countInvalid', { min: MAX_HISTORY_MIN, max: MAX_HISTORY_MAX }))
      return
    }
    setHistoryCountError('')
    onChange({ maxHistory: requested })
    onCommit({ maxHistory: requested })
  }

  const captureSidebarShortcut = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.key === 'Escape') {
      event.target.blur?.()
      onClose()
      return
    }
    if (event.key === 'Backspace' || event.key === 'Delete') {
      resetSidebarShortcut()
      return
    }

    const shortcut = shortcutFromKeyboardEvent(event)
    if (!shortcut) {
      if (!['Alt', 'Control', 'Meta', 'Shift'].includes(event.key)) {
        setShortcutError(t(language, 'settings.shortcutInvalid'))
      }
      return
    }
    if (isReservedEditorShortcut(shortcut)) {
      setShortcutError(t(language, 'settings.shortcutReserved'))
      return
    }

    setShortcutError('')
    onSidebarShortcutChange(shortcut)
  }

  const resetSidebarShortcut = () => {
    setShortcutError('')
    onSidebarShortcutChange(DEFAULT_SIDEBAR_SHORTCUT)
  }

  const chooseImageSaveDirectory = async () => {
    try {
      const detachMessage = t(language, 'fileDialog.detachRequired')
      const prepareFileDialog = window.fileServices?.prepareFileDialog
      if (typeof prepareFileDialog === 'function' && !(await prepareFileDialog(detachMessage))) {
        onNotify?.(detachMessage, 'warning')
        return
      }
      const selected = await window.imageServices?.chooseSaveDirectory?.(
        imageSaveDirectory,
        t(language, 'settings.chooseImageSaveDirectory'),
        detachMessage
      )
      if (selected) onImageSaveDirectoryChange(selected)
    } catch (error) {
      console.error('选择图片保存文件夹失败', error)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      PaperProps={{
        sx: {
          height: 548,
          maxHeight: 'calc(100% - 32px)',
          borderRadius: 3,
          bgcolor: isDark ? '#2b2b2b' : '#fff'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsOutlinedIcon color="primary" />
          {t(language, 'settings.title')}
        </Box>
      </DialogTitle>
      <Tabs
        value={settingsTab}
        onChange={(_, value) => {
          setLanguageMenuAnchor(null)
          setSettingsTab(value)
        }}
        aria-label={t(language, 'settings.title')}
        sx={{
          px: 3,
          height: 48,
          minHeight: 48,
          borderBottom: '1px dashed',
          borderColor: 'divider',
          '& .MuiTabs-scroller': { height: '100%' },
          '& .MuiTabs-flexContainer': {
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
            pb: 0.5,
            gap: 1
          },
          '& .MuiTabs-indicator': { display: 'none' }
        }}
      >
        <Tab value="general" label={t(language, 'settings.general')} id="settings-tab-general" aria-controls="settings-panel-general" sx={createSettingsTabSx(isDark)} />
        <Tab value="ai" label="AI" id="settings-tab-ai" aria-controls="settings-panel-ai" sx={createSettingsTabSx(isDark)} />
      </Tabs>
      <DialogContent sx={{ minHeight: 0, pb: 3, '&&': { pt: 3 } }}>
        <Box role="tabpanel" hidden={settingsTab !== 'general'} id="settings-panel-general" aria-labelledby="settings-tab-general">
          <Box>
          <Typography variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
            {t(language, 'settings.language')}
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<TranslateIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={event => setLanguageMenuAnchor(event.currentTarget)}
            aria-haspopup="menu"
            aria-expanded={Boolean(languageMenuAnchor)}
            sx={{
              ...settingsButtonSx,
              justifyContent: 'flex-start',
              '& .MuiButton-endIcon': { ml: 'auto' }
            }}
          >
            {languagePreference === 'auto'
              ? t(language, 'settings.languageAuto')
              : LANGUAGE_OPTIONS.find(option => option.value === languagePreference)?.label || t(language, 'settings.languageAuto')}
          </Button>
          <Menu
            anchorEl={languageMenuAnchor}
            open={Boolean(languageMenuAnchor)}
            onClose={() => setLanguageMenuAnchor(null)}
            disableRestoreFocus
            disableScrollLock
            MenuListProps={{ dense: true, 'aria-label': t(language, 'settings.language'), sx: SETTINGS_MENU_LIST_SX }}
            slotProps={{ paper: { sx: { ...settingsMenuPaperSx, mt: 0.5, minWidth: 260, maxHeight: 360 } } }}
          >
            <MenuItem
              selected={languagePreference === 'auto'}
              onClick={() => {
                onLanguageChange('auto')
                setLanguageMenuAnchor(null)
              }}
            >
              {t(language, 'settings.languageAuto')}
            </MenuItem>
            {LANGUAGE_OPTIONS.map(option => (
              <MenuItem
                key={option.value}
                selected={languagePreference === option.value}
                onClick={() => {
                  onLanguageChange(option.value)
                  setLanguageMenuAnchor(null)
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
          </Box>

        <FontSetting
          createFontStack={createInterfaceFontStack}
          defaultFont={DEFAULT_INTERFACE_FONT}
          defaultLabel={t(language, 'settings.defaultInterfaceFont')}
          fontFamilies={localFontFamilies}
          isDark={isDark}
          label={t(language, 'settings.interfaceFont')}
          language={language}
          localFontStatus={localFontStatus}
          onChange={onInterfaceFontChange}
          onRequestFonts={requestLocalFonts}
          value={interfaceFont}
        />

        <FontSetting
          createFontStack={createContentFontStack}
          defaultFont={DEFAULT_CONTENT_FONT}
          defaultLabel={t(language, 'settings.defaultContentFont')}
          fontFamilies={localFontFamilies}
          isDark={isDark}
          label={t(language, 'settings.contentFont')}
          language={language}
          localFontStatus={localFontStatus}
          onChange={onContentFontChange}
          onRequestFonts={requestLocalFonts}
          value={contentFont}
        />

        <Box sx={{ mt: 2.25 }}>
          <Typography variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
            {t(language, 'settings.theme')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
            {[
              [THEME_MODES.AUTO, t(language, 'settings.themeAuto')],
              [THEME_MODES.LIGHT, t(language, 'settings.themeLight')],
              [THEME_MODES.DARK, t(language, 'settings.themeDark')]
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={themeMode === value ? 'contained' : 'outlined'}
                size="small"
                aria-pressed={themeMode === value}
                onClick={() => onThemeModeChange(value)}
                sx={{
                  ...settingsButtonSx,
                  minWidth: 0,
                  minHeight: 34,
                  px: 1,
                  whiteSpace: 'normal',
                  lineHeight: 1.25,
                  overflowWrap: 'anywhere',
                  color: isDark && themeMode === value ? 'rgba(0, 0, 0, 0.72)' : undefined
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 2.25 }}>
          <Typography id="startup-behavior-label" variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
            {t(language, 'settings.startup')}
          </Typography>
          <Box role="group" aria-labelledby="startup-behavior-label" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
            {[
              [STARTUP_BEHAVIORS.NEW, t(language, 'settings.startupNew')],
              [STARTUP_BEHAVIORS.RESTORE, t(language, 'settings.startupRestore')]
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={startupBehavior === value ? 'contained' : 'outlined'}
                size="small"
                aria-pressed={startupBehavior === value}
                onClick={() => onStartupBehaviorChange(value)}
                sx={{
                  ...settingsButtonSx,
                  minWidth: 0,
                  minHeight: 34,
                  px: 1,
                  whiteSpace: 'normal',
                  lineHeight: 1.25,
                  overflowWrap: 'anywhere',
                  color: isDark && startupBehavior === value ? 'rgba(0, 0, 0, 0.72)' : undefined
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>

        <Box sx={{ mt: 2.25 }}>
          <Typography variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
            {t(language, 'settings.imageSaveDirectory')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FolderOpenOutlinedIcon />}
              onClick={chooseImageSaveDirectory}
              title={displayedImageSaveDirectory}
              sx={{
                ...settingsButtonSx,
                minWidth: 0,
                justifyContent: 'flex-start',
                '& .MuiButton-startIcon': { flex: '0 0 auto' }
              }}
            >
              <Box component="span" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayedImageSaveDirectory}
              </Box>
            </Button>
            <Tooltip title={t(language, 'settings.resetImageSaveDirectory')}>
              <span>
                <IconButton
                  disabled={!imageSaveDirectory}
                  aria-label={t(language, 'settings.resetImageSaveDirectory')}
                  onClick={() => onImageSaveDirectoryChange('')}
                  sx={settingsIconButtonSx}
                >
                  <RestartAltIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {t(language, 'settings.imageSaveDirectoryHint')}
          </Typography>
        </Box>

        <Box sx={{ mt: 2.25 }}>
          <Typography variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
            {t(language, 'settings.shortcuts')}
          </Typography>
          <TextField
            fullWidth
            size="small"
            label={t(language, 'settings.toggleSidebar')}
            value={sidebarShortcut}
            error={Boolean(shortcutError)}
            helperText={shortcutError || undefined}
            onFocus={() => setShortcutError('')}
            onKeyDown={captureSidebarShortcut}
            slotProps={{
              htmlInput: { readOnly: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={t(language, 'settings.resetShortcut')}>
                      <IconButton
                        edge="end"
                        size="small"
                        aria-label={t(language, 'settings.resetShortcut')}
                        onClick={resetSidebarShortcut}
                        sx={settingsIconButtonSx}
                      >
                        <RestartAltIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
          <FormControlLabel
            sx={{
              mt: 1,
              '& .MuiFormControlLabel-label': {
                color: 'text.secondary',
                fontSize: '0.875rem'
              }
            }}
            control={<Switch checked={rememberSidebarState} onChange={event => onRememberSidebarStateChange(event.target.checked)} />}
            label={t(language, 'settings.rememberSidebarState')}
          />
        </Box>

        <Box sx={{ mt: 2.25 }}>
          <Typography id="history-limit-mode-label" variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'} sx={SECTION_TITLE_SX}>
            {t(language, 'settings.retention')}
          </Typography>
          <Box role="group" aria-labelledby="history-limit-mode-label" sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
            {[
              [HISTORY_LIMIT_MODES.COUNT, t(language, 'settings.byCount')],
              [HISTORY_LIMIT_MODES.TIME, t(language, 'settings.byTime')]
            ].map(([value, label]) => (
              <Button
                key={value}
                variant={historyLimitMode === value ? 'contained' : 'outlined'}
                size="small"
                aria-pressed={historyLimitMode === value}
                onClick={() => onCommit({ historyLimitMode: value })}
                sx={{
                  ...settingsButtonSx,
                  minWidth: 0,
                  minHeight: 34,
                  px: 1,
                  whiteSpace: 'normal',
                  lineHeight: 1.25,
                  overflowWrap: 'anywhere',
                  color: isDark && historyLimitMode === value ? 'rgba(0, 0, 0, 0.72)' : undefined
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Box>

        {isTimeMode ? (
          <Box sx={{ mt: 2.25 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="history-age-preset-label">
                {t(language, 'settings.commonDuration')}
              </InputLabel>
              <Select
                labelId="history-age-preset-label"
                label={t(language, 'settings.commonDuration')}
                value={selectedAgePreset}
                sx={settingsSelectSx}
                MenuProps={{ disableRestoreFocus: true, PaperProps: { sx: settingsMenuPaperSx }, MenuListProps: { sx: SETTINGS_MENU_LIST_SX } }}
                onChange={event => {
                  const days = Number(event.target.value)
                  if (!Number.isInteger(days)) return
                  setAgeError('')
                  onChange({ historyMaxAgeDays: days })
                  onCommit({ historyMaxAgeDays: days })
                }}
              >
                {selectedAgePreset === 'custom' && (
                  <MenuItem value="custom" disabled>
                    {t(language, 'settings.customDuration', { duration: formatHistoryAge(historyMaxAgeDays, language) })}
                  </MenuItem>
                )}
                {HISTORY_AGE_PRESETS.map(preset => (
                  <MenuItem key={preset.days} value={String(preset.days)}>
                    {formatHistoryAge(preset.days, language)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t(language, 'settings.exactDays')}
              size="small"
              type="number"
              fullWidth
              value={ageInput}
              error={Boolean(ageError)}
              helperText={ageError || t(language, 'settings.ageRange', { min: MIN_HISTORY_AGE_DAYS, max: formatHistoryAge(MAX_HISTORY_AGE_DAYS, language) })}
              slotProps={{ htmlInput: { min: MIN_HISTORY_AGE_DAYS, max: MAX_HISTORY_AGE_DAYS, step: 1 } }}
              onChange={event => {
                setAgeInput(event.target.value)
                setAgeError('')
              }}
              onBlur={commitAgeInput}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitAgeInput()
                }
              }}
              sx={{ mt: 1.5 }}
            />
          </Box>
        ) : (
          <Box sx={{ mt: 2.25 }}>
            <TextField
              label={t(language, 'settings.maxEntries')}
              size="small"
              type="number"
              fullWidth
              value={historyCountInput}
              error={Boolean(historyCountError)}
              helperText={historyCountError || t(language, 'settings.countRange', { min: MAX_HISTORY_MIN, max: MAX_HISTORY_MAX })}
              slotProps={{ htmlInput: { min: MAX_HISTORY_MIN, max: MAX_HISTORY_MAX, step: 1 } }}
              onChange={event => {
                setHistoryCountInput(event.target.value)
                setHistoryCountError('')
              }}
              onBlur={commitHistoryCountInput}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitHistoryCountInput()
                }
              }}
            />
          </Box>
        )}

        <FormControlLabel
          sx={{ mt: 2.25 }}
          control={<Switch checked={wordWrap} onChange={event => onWordWrapChange(event.target.checked)} />}
          label={t(language, 'settings.wordWrap')}
        />
        </Box>

        {settingsTab === 'ai' && (<Box role="tabpanel" id="settings-panel-ai" aria-labelledby="settings-tab-ai" sx={{ pt: 0.5 }}>
          <FormControlLabel
            sx={{ mb: 1 }}
            control={<Switch checked={aiDirectEnabled} onChange={event => onCommit({ aiDirectEnabled: event.target.checked })} />}
            label={t(language, 'ai.directEnabled')}
          />
          {aiDirectEnabled ? (
            <Box sx={{ mb: 2.25 }}>
              <TextField
                fullWidth
                size="small"
                label={t(language, 'ai.directBaseUrl')}
                value={aiDirectBaseUrl}
                onChange={event => onChange({ aiDirectBaseUrl: event.target.value })}
                onBlur={event => onCommit({ aiDirectBaseUrl: event.target.value })}
                sx={{ mb: 1.25 }}
              />
              <TextField
                fullWidth
                size="small"
                label={t(language, 'ai.directApiKey')}
                type={directApiKeyVisible ? 'text' : 'password'}
                value={aiDirectApiKey}
                onChange={event => onChange({ aiDirectApiKey: event.target.value })}
                onBlur={event => onCommit({ aiDirectApiKey: event.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={t(language, directApiKeyVisible ? 'ai.hideApiKey' : 'ai.showApiKey')}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => setDirectApiKeyVisible(value => !value)}
                          aria-label={t(language, directApiKeyVisible ? 'ai.hideApiKey' : 'ai.showApiKey')}
                          sx={settingsIconButtonSx}
                        >
                          {directApiKeyVisible ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 1.25 }}
              />
              <TextField
                fullWidth
                size="small"
                label={t(language, 'ai.directModel')}
                value={aiDirectModel}
                onChange={event => onChange({ aiDirectModel: event.target.value })}
                onBlur={event => onCommit({ aiDirectModel: event.target.value })}
                sx={{ mb: 1.25 }}
              />
            </Box>
          ) : null}
          <Box sx={SECTION_TITLE_SX}>
            <Typography variant="subtitle1" color={isDark ? '#b1ada6' : 'text.primary'}>{t(language, 'ai.model')}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 2.25, minWidth: 0 }}>
          <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
            <Select
              aria-label={t(language, 'ai.model')}
              value={aiModel || ''}
              onChange={event => onCommit({ aiModel: event.target.value })}
              displayEmpty
              sx={settingsSelectSx}
              renderValue={value => {
                if (!value) return <AiModelOption isDefault language={language} model={{ label: t(language, 'ai.modelAuto') }} models={availableAiModels} />
                const selectedModel = availableAiModels.find(model => getAiModelValue(model) === value)
                return <AiModelOption language={language} model={selectedModel || { id: value, label: value }} models={availableAiModels} />
              }}
              MenuProps={{ disableRestoreFocus: true, PaperProps: { sx: settingsMenuPaperSx }, MenuListProps: { sx: SETTINGS_MENU_LIST_SX } }}
            >
              <MenuItem value=""><AiModelOption isDefault language={language} model={{ label: t(language, 'ai.modelAuto') }} models={availableAiModels} /></MenuItem>
              {availableAiModels.map(model => {
                const value = getAiModelValue(model)
                if (!value) return null
                return <MenuItem key={value} value={value}><AiModelOption language={language} model={model} models={availableAiModels} /></MenuItem>
              })}
              {aiModelsLoading ? <MenuItem disabled>{t(language, 'ai.modelLoading')}</MenuItem> : null}
            </Select>
          </FormControl>
          <Tooltip title={t(language, 'ai.refreshModels')}>
            <IconButton
              size="small"
              aria-label={t(language, 'ai.refreshModels')}
              onClick={onRefreshAiModels}
              disabled={aiModelsLoading}
              sx={{
                ...settingsIconButtonSx,
                width: 34,
                height: 34,
                flex: '0 0 34px',
                color: 'text.secondary',
                opacity: 0.72,
                '&:hover': { opacity: 0.9 },
                '& .MuiSvgIcon-root': { width: 22, height: 22, fontSize: 22 }
              }}
            >
              <RefreshOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t(language, 'ai.openModelsSettings')}>
            <IconButton
              size="small"
              aria-label={t(language, 'ai.openModelsSettings')}
              onClick={onOpenAiModelsSettings}
              sx={{
                ...settingsIconButtonSx,
                width: 34,
                height: 34,
                flex: '0 0 34px',
                color: 'text.secondary',
                opacity: 0.72,
                '&:hover': { opacity: 0.9 },
                '& .MuiSvgIcon-root': { width: 22, height: 22, fontSize: 22 }
              }}
            >
              <ChecklistOutlinedIcon />
            </IconButton>
          </Tooltip>
          </Box>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={5}
            maxRows={10}
            label={t(language, 'ai.formattingPrompt')}
            value={formattingPromptInput}
            onChange={event => setFormattingPromptInput(event.target.value)}
            onBlur={() => {
              const builtInPrompt = t(language, 'ai.formattingSystem')
              if (!formattingPromptInput.trim()) setFormattingPromptInput(builtInPrompt)
              onCommit({ aiFormattingPrompt: !formattingPromptInput.trim() || formattingPromptInput === builtInPrompt ? '' : formattingPromptInput })
            }}
            sx={{ mb: 1.5 }}
          />
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={5}
            maxRows={10}
            label={t(language, 'ai.imageGenerationPrompt')}
            value={imageGenerationPromptInput}
            onChange={event => setImageGenerationPromptInput(event.target.value)}
            onBlur={() => {
              const builtInPrompt = t(language, 'ai.imageGenerationSystem')
              if (!imageGenerationPromptInput.trim()) setImageGenerationPromptInput(builtInPrompt)
              onCommit({ aiImageGenerationPrompt: !imageGenerationPromptInput.trim() || imageGenerationPromptInput === builtInPrompt ? '' : imageGenerationPromptInput })
            }}
            sx={{ mb: 1.5 }}
          />
          {!availableAiModels.length && !aiModelsLoading ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {t(language, 'ai.modelUnavailable')}
            </Typography>
          ) : null}
        </Box>)}
      </DialogContent>
    </Dialog>
  )
}

export default memo(SettingsDialog)
