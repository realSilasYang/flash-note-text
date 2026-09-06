import { memo, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from './ActionTooltip'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft'
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight'
import RemoveIcon from '@mui/icons-material/Remove'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { ENCODING_OPTIONS, getEncodingLabel, getLineEndingLabel } from '../encoding'
import { AUTO_CODE_LANGUAGE, EDITOR_MODES, getEditorModeLabel, loadCodeLanguageOptions, PLAIN_CODE_LANGUAGE } from '../editorMode'
import { t } from '../locales'
import { MARKDOWN_SHORTCUT_HINT_GROUPS } from '../markdownShortcuts'

const STATUS_SECTION_KEYS = ['characters', 'mode', 'zoom', 'lineEnding', 'encoding']

function StatisticsRow ({ color = 'text.primary', label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant="body2" sx={{ color, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
    </Box>
  )
}

function ShortcutHintRow ({ label, shortcut }) {
  return (
    <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
      <Box
        component="kbd"
        sx={{
          flex: '0 0 auto',
          border: 0,
          bgcolor: 'transparent',
          color: 'text.primary',
          fontFamily: 'var(--content-font-family)',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.5,
          whiteSpace: 'nowrap'
        }}
      >
        {shortcut}
      </Box>
    </Box>
  )
}

function StatusBar ({
  codeLanguage,
  codeDetection,
  documentStats,
  editorMode,
  encoding,
  encodingCandidates,
  encodingConfidence,
  fileName,
  filePath,
  language,
  lineEnding,
  onEditorModeChange,
  onCodeLanguageChange,
  onEncodingChange,
  onLineEndingChange,
  onReloadWithEncoding,
  onToggleSidebar,
  onZoomChange,
  readOnly,
  sidebarExpanded,
  sidebarShortcut,
  zoom
}) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [anchor, setAnchor] = useState(null)
  const [activeSection, setActiveSection] = useState('')
  const [displayedSection, setDisplayedSection] = useState('')
  const [switchDirection, setSwitchDirection] = useState(1)
  const [switchPhase, setSwitchPhase] = useState('idle')
  const [codeLanguages, setCodeLanguages] = useState([])
  const closeTimerRef = useRef(0)
  const switchTimerRef = useRef(0)
  const pendingSwitchRef = useRef(null)
  const hoverSuppressedRef = useRef(false)
  const open = Boolean(anchor)

  useEffect(() => {
    if (editorMode !== 'code') return undefined
    let active = true
    loadCodeLanguageOptions().then(options => {
      if (active) setCodeLanguages(options)
    }).catch(() => {})
    return () => { active = false }
  }, [editorMode])

  const cancelScheduledClose = () => window.clearTimeout(closeTimerRef.current)
  const cancelSectionSwitch = () => {
    window.clearTimeout(switchTimerRef.current)
    pendingSwitchRef.current = null
  }

  const showPopover = (event, section) => {
    cancelScheduledClose()
    const nextAnchor = event.currentTarget
    if (!anchor || !displayedSection || displayedSection === section) {
      cancelSectionSwitch()
      setAnchor(nextAnchor)
      setDisplayedSection(section)
      setSwitchPhase('idle')
      setActiveSection(section)
      return
    }

    const currentIndex = STATUS_SECTION_KEYS.indexOf(displayedSection)
    const nextIndex = STATUS_SECTION_KEYS.indexOf(section)
    const direction = nextIndex >= currentIndex ? 1 : -1
    cancelSectionSwitch()
    pendingSwitchRef.current = { anchor: nextAnchor, section }
    setActiveSection(section)
    setSwitchDirection(direction)
    setSwitchPhase('out')
    switchTimerRef.current = window.setTimeout(() => {
      const pending = pendingSwitchRef.current
      if (!pending) return
      setAnchor(pending.anchor)
      setDisplayedSection(pending.section)
      setSwitchPhase('in')
      switchTimerRef.current = window.setTimeout(() => {
        pendingSwitchRef.current = null
        setSwitchPhase('idle')
      }, 120)
    }, 90)
  }

  const showHoverPopover = (event, section) => {
    if (!hoverSuppressedRef.current) showPopover(event, section)
  }

  const closePopover = () => {
    cancelScheduledClose()
    cancelSectionSwitch()
    setSwitchPhase('idle')
    setAnchor(null)
  }

  const scheduleClosePopover = () => {
    cancelScheduledClose()
    closeTimerRef.current = window.setTimeout(closePopover, 120)
  }

  useEffect(() => () => {
    window.clearTimeout(closeTimerRef.current)
    window.clearTimeout(switchTimerRef.current)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      window.clearTimeout(closeTimerRef.current)
      window.clearTimeout(switchTimerRef.current)
      pendingSwitchRef.current = null
      setSwitchPhase('idle')
      setAnchor(null)
    }
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [open])

  useEffect(() => {
    hoverSuppressedRef.current = true
    cancelSectionSwitch()
    setSwitchPhase('idle')
    setAnchor(null)
    const timer = window.setTimeout(() => { hoverSuppressedRef.current = false }, 220)
    return () => window.clearTimeout(timer)
  }, [sidebarExpanded])

  const runAndClose = (action) => {
    action?.()
    closePopover()
  }

  const stats = documentStats || {
    totalCharacters: 0,
    effectiveCharacters: 0,
    basicCjkCharacters: 0,
    wordsAndPhrases: 0,
    latinLetters: 0,
    arabicDigits: 0,
    punctuationMarks: 0,
    nonEmptyLines: 0
  }

  const sections = [
    { key: 'characters', label: t(language, 'status.characters', { count: stats.totalCharacters }), flex: 1.7 },
    { key: 'mode', label: getEditorModeLabel(editorMode, language), flex: 1.15 },
    { key: 'zoom', label: zoom + '%', flex: 1 },
    {
      key: 'lineEnding',
      label: readOnly
        ? getLineEndingLabel(lineEnding, language)
        : fileName
          ? getLineEndingLabel(lineEnding, language)
          : getLineEndingLabel(lineEnding, language),
      flex: 1.25
    },
    {
      key: 'encoding',
      label: readOnly
        ? t(language, 'status.unicodeText')
        : fileName
          ? getEncodingLabel(encoding)
          : getEncodingLabel(encoding),
      flex: 1.65
    }
  ]

  return (
    <Paper
      id="guide-statusbar"
      component="footer"
      aria-label={t(language, 'status.editorStatus')}
      elevation={0}
      sx={{
        flex: '0 0 30px',
        height: 30,
        mx: '12px',
        minHeight: 30,
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '0 !important',
        boxShadow: isDark ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'inset 0 0 0 1px rgba(67,52,27,0.12)',
        opacity: 0.98,
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        transition: 'background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.2s ease',
        '& > button': { minWidth: 58 },
        '& > button:first-of-type::before': { left: -1 },
        '& > button:last-of-type::before': { right: -1 }
      }}
    >
      <Box
        component="button"
        type="button"
        aria-label={t(language, sidebarExpanded ? 'status.collapseSidebarAria' : 'status.expandSidebarAria', { shortcut: sidebarShortcut })}
        aria-controls="feature-sidebar"
        aria-expanded={sidebarExpanded}
        aria-keyshortcuts={sidebarShortcut}
        onClick={() => {
          closePopover()
          onToggleSidebar()
        }}
          sx={{
            flex: '0 0 96px',
            alignSelf: 'stretch',
            boxSizing: 'border-box',
            width: 96,
            minWidth: 96,
            height: '100%',
            minHeight: 0,
            m: 0,
            gap: 0.5,
            px: 0.75,
            py: 0.35,
            position: 'relative',
            isolation: 'isolate',
            overflow: 'visible',
            border: 0,
            borderRadius: 0,
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
            '&::before': {
              position: 'absolute',
              zIndex: 0,
              top: -1,
              right: 0,
              bottom: -1,
              left: 0,
              backgroundColor: 'transparent',
              content: '""',
              pointerEvents: 'none',
              transition: 'background-color 0.2s ease'
            },
            '& > *': { position: 'relative', zIndex: 1 },
            '&:hover::before': { backgroundColor: isDark ? 'rgba(143, 181, 149, 0.15)' : 'rgba(93, 124, 102, 0.12)' },
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 }
          }}
      >
        {sidebarExpanded
          ? <KeyboardDoubleArrowLeftIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          : <KeyboardDoubleArrowRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
        <Typography variant="caption" color="text.secondary" noWrap>
          {t(language, sidebarExpanded ? 'status.collapseSidebar' : 'status.expandSidebar')}
        </Typography>
      </Box>
      {sections.map(section => (
        <Box
          key={section.key}
          component="button"
          type="button"
          aria-label={section.label}
          aria-expanded={open && activeSection === section.key}
          disabled={section.disabled}
          onMouseEnter={event => { if (!section.disabled) showHoverPopover(event, section.key) }}
          onMouseLeave={scheduleClosePopover}
          onFocus={event => { if (!section.disabled) showPopover(event, section.key) }}
          onBlur={scheduleClosePopover}
          onClick={event => { if (!section.disabled) showPopover(event, section.key) }}
          sx={{
            flex: section.flex,
            alignSelf: 'stretch',
            boxSizing: 'border-box',
            minWidth: 0,
            height: '100%',
            minHeight: 0,
            m: 0,
            px: 0.75,
            py: 0.35,
            position: 'relative',
            isolation: 'isolate',
            overflow: 'visible',
            border: 0,
            borderRadius: 0,
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            transition: 'color 0.2s ease',
            '&::before': {
              position: 'absolute',
              zIndex: 0,
              top: -1,
              right: 0,
              bottom: -1,
              left: 0,
              backgroundColor: 'transparent',
              content: '""',
              pointerEvents: 'none',
              transition: 'background-color 0.2s ease'
            },
            '& > *': { position: 'relative', zIndex: 1 },
            '&:hover::before, &[aria-expanded="true"]::before': { backgroundColor: isDark ? 'rgba(143, 181, 149, 0.15)' : 'rgba(93, 124, 102, 0.12)' },
            '&:disabled': { cursor: 'default', opacity: 0.48 },
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 }
          }}
        >
          {section.icon}
          <Typography variant="caption" color="text.secondary" noWrap>{section.label}</Typography>
        </Box>
      ))}
      <Popper
        open={open}
        anchorEl={anchor}
        placement="top"
        transition
        modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
        sx={{ zIndex: theme.zIndex.modal }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={{ enter: 180, exit: 160 }}>
            <Box
              sx={{
                animation: TransitionProps.in
                  ? 'statusPopoverEnter 180ms cubic-bezier(0.2, 0, 0, 1) both'
                  : 'statusPopoverExit 160ms cubic-bezier(0.4, 0, 1, 1) both',
                '@keyframes statusPopoverEnter': {
                  from: { transform: 'translateY(8px)' },
                  to: { transform: 'translateY(0)' }
                },
                '@keyframes statusPopoverExit': {
                  from: { transform: 'translateY(0)' },
                  to: { transform: 'translateY(8px)' }
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
              }}
            >
              <Paper
                onMouseEnter={cancelScheduledClose}
                onMouseLeave={scheduleClosePopover}
                onFocusCapture={cancelScheduledClose}
                onBlurCapture={event => {
                  if (!event.currentTarget.contains(event.relatedTarget)) scheduleClosePopover()
                }}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'var(--ghibli-shadow-hover)'
                }}
              >
                <Box
                  key={displayedSection}
                  data-status-section={displayedSection}
                  sx={{
                    p: 1.25,
                    boxSizing: 'border-box',
                    width: displayedSection === 'mode' && editorMode === 'markdown'
                      ? 'min(520px, calc(100vw - 24px))'
                      : 'auto',
                    minWidth: displayedSection === 'characters'
                      ? 290
                      : displayedSection === 'zoom'
                        ? 190
                        : 230,
                    maxWidth: displayedSection === 'characters'
                      ? 340
                      : displayedSection === 'zoom'
                        ? 240
                        : displayedSection === 'mode' && editorMode === 'markdown'
                          ? 'calc(100vw - 24px)'
                          : 320,
                    animation: switchPhase === 'out'
                      ? `${switchDirection > 0 ? 'statusContentOutRight' : 'statusContentOutLeft'} 90ms ease-in both`
                      : switchPhase === 'in'
                        ? `${switchDirection > 0 ? 'statusContentInRight' : 'statusContentInLeft'} 120ms ease-out both`
                        : 'none',
                    '@keyframes statusContentOutRight': {
                      from: { opacity: 1, transform: 'translateX(0)' },
                      to: { opacity: 0, transform: 'translateX(-8px)' }
                    },
                    '@keyframes statusContentOutLeft': {
                      from: { opacity: 1, transform: 'translateX(0)' },
                      to: { opacity: 0, transform: 'translateX(8px)' }
                    },
                    '@keyframes statusContentInRight': {
                      from: { opacity: 0, transform: 'translateX(-8px)' },
                      to: { opacity: 1, transform: 'translateX(0)' }
                    },
                    '@keyframes statusContentInLeft': {
                      from: { opacity: 0, transform: 'translateX(8px)' },
                      to: { opacity: 1, transform: 'translateX(0)' }
                    },
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
                  }}
                >
          {displayedSection === 'characters' && (
            <Stack spacing={0.75}>
              <StatisticsRow label={t(language, 'status.totalCharacters')} value={stats.totalCharacters} />
              <StatisticsRow label={t(language, 'status.effectiveCharacters')} value={stats.effectiveCharacters} />
              <Box sx={{ borderBottom: '1px dashed', borderColor: 'divider', my: 0.25 }} />
              <StatisticsRow color="#F5A623" label={t(language, 'status.cjkCharacters')} value={stats.basicCjkCharacters} />
              <StatisticsRow color="#66BB6A" label={t(language, 'status.wordsPhrases')} value={stats.wordsAndPhrases} />
              <StatisticsRow color="#4DDDCF" label={t(language, 'status.latinLetters')} value={stats.latinLetters} />
              <StatisticsRow color="#C5A59A" label={t(language, 'status.arabicDigits')} value={stats.arabicDigits} />
              <StatisticsRow color="#BA68C8" label={t(language, 'status.punctuation')} value={stats.punctuationMarks} />
              <Box sx={{ borderBottom: '1px dashed', borderColor: 'divider', my: 0.25 }} />
              <StatisticsRow color="#42A5F5" label={t(language, 'status.nonEmptyLines')} value={stats.nonEmptyLines} />
            </Stack>
          )}
          {displayedSection === 'mode' && (
            <>
              {editorMode === 'markdown' && (
                <Typography variant="caption" sx={{ mb: 0.75, display: 'block', textAlign: 'center', fontWeight: 700 }}>
                  {t(language, 'status.markdownShortcuts')}
                </Typography>
              )}
              <Stack spacing={1}>
                {editorMode === 'markdown' && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 2,
                      maxHeight: 'min(62vh, 390px)',
                      overflowY: 'auto',
                      scrollbarWidth: 'thin',
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(67,52,27,0.055)',
                      '@media (max-width: 390px)': { gridTemplateColumns: '1fr' }
                    }}
                  >
                    {MARKDOWN_SHORTCUT_HINT_GROUPS.map(group => (
                      <Stack key={group.labelKey} spacing={0.35} sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
                          {t(language, group.labelKey)}
                        </Typography>
                        {group.items.map(item => (
                          <ShortcutHintRow
                            key={item.labelKey}
                            label={t(language, item.labelKey)}
                            shortcut={item.shortcut}
                          />
                        ))}
                      </Stack>
                    ))}
                  </Box>
                )}
                <Typography variant="body2" sx={{ textAlign: 'center' }}>{t(language, 'status.editorMode')}</Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={editorMode}
                  disabled={readOnly}
                  onChange={(_, value) => { if (value && !readOnly) onEditorModeChange(value) }}
                >
                  {EDITOR_MODES.map(option => <ToggleButton key={option.value} value={option.value}>{getEditorModeLabel(option.value, language)}</ToggleButton>)}
                </ToggleButtonGroup>
                {editorMode === 'code' && (
                  <>
                    <Select
                      size="small"
                      value={codeLanguage}
                      disabled={readOnly}
                      onChange={event => onCodeLanguageChange?.(event.target.value)}
                      MenuProps={{ disableRestoreFocus: true, PaperProps: { sx: { maxHeight: 360 } } }}
                      fullWidth
                      aria-label={t(language, 'status.codeLanguage')}
                    >
                      <MenuItem value={AUTO_CODE_LANGUAGE}>{t(language, 'status.codeLanguageAuto')}</MenuItem>
                      <MenuItem value={PLAIN_CODE_LANGUAGE}>{t(language, 'status.codeLanguagePlain')}</MenuItem>
                      {!codeLanguages.some(option => option.value === codeLanguage) && ![AUTO_CODE_LANGUAGE, PLAIN_CODE_LANGUAGE].includes(codeLanguage) && (
                        <MenuItem value={codeLanguage}>{codeLanguage}</MenuItem>
                      )}
                      {codeLanguages.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
                    </Select>
                    {codeLanguage === AUTO_CODE_LANGUAGE && (
                      <Stack spacing={0.35}>
                        <Typography variant="caption" color="text.secondary">
                          {codeDetection?.language
                            ? t(language, 'status.codeLanguageDetected', {
                                language: codeDetection.language,
                                confidence: Math.round((codeDetection.confidence || 0) * 100)
                              })
                            : t(language, 'status.codeLanguageUncertain')}
                        </Typography>
                        {!codeDetection?.language && codeDetection?.candidates?.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {t(language, 'status.codeLanguageCandidates', {
                              candidates: codeDetection.candidates.map(item => item.language).join(' / ')
                            })}
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </>
                )}
              </Stack>
            </>
          )}
          {displayedSection === 'zoom' && (
            <Stack spacing={0.75}>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>{t(language, 'status.zoom', { zoom })}</Typography>
              <Stack direction="row" spacing={0.5} justifyContent="center">
                <Tooltip title={t(language, 'status.zoomOut')}><IconButton size="small" aria-label={t(language, 'status.zoomOut')} onClick={() => onZoomChange?.(-1)}><RemoveIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title={t(language, 'status.resetZoom')}><IconButton size="small" aria-label={t(language, 'status.resetZoom')} onClick={() => onZoomChange?.(0)}><RestartAltIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title={t(language, 'status.zoomIn')}><IconButton size="small" aria-label={t(language, 'status.zoomIn')} onClick={() => onZoomChange?.(1)}><AddIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>
            </Stack>
          )}
          {displayedSection === 'lineEnding' && (
            <Stack spacing={0.75}>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>{t(language, 'status.lineEndingSaving')}</Typography>
              <Select
                size="small"
                value={lineEnding}
                disabled={readOnly}
                onChange={event => onLineEndingChange(event.target.value)}
                MenuProps={{ disableRestoreFocus: true }}
                fullWidth
              >
                <MenuItem value="lf">Unix (LF)</MenuItem>
                <MenuItem value="crlf">Windows (CRLF)</MenuItem>
                <MenuItem value="cr">{t(language, 'status.classicMac')}</MenuItem>
                {lineEnding === 'mixed' ? <MenuItem value="mixed">{t(language, 'status.mixedPreserve')}</MenuItem> : null}
              </Select>
            </Stack>
          )}
          {displayedSection === 'encoding' && (
            <Stack spacing={0.75}>
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                {readOnly
                  ? t(language, 'status.historyUnicode')
                  : fileName
                    ? t(language, 'status.fileEncoding', { encoding: getEncodingLabel(encoding) })
                    : t(language, 'status.savingEncoding', { encoding: getEncodingLabel(encoding) })}
              </Typography>
              {fileName ? (
                <Typography variant="caption" color="text.secondary" noWrap title={filePath || fileName}>{fileName}</Typography>
              ) : null}
              {!readOnly && Number.isFinite(encodingConfidence) && encodingConfidence < 0.8 ? (
                <Typography variant="caption" color="warning.main">
                  {t(language, 'status.lowConfidence')}
                </Typography>
              ) : null}
              {!readOnly && Array.isArray(encodingCandidates) && encodingCandidates.length > 1 ? (
                <Typography variant="caption" color="text.secondary">
                  {t(language, 'status.candidates') + ' '}
                  {encodingCandidates.slice(0, 3).map(candidate => getEncodingLabel(candidate.encoding)).join(' / ')}
                </Typography>
              ) : null}
              <Select
                size="small"
                value={encoding}
                disabled={readOnly}
                onChange={event => onEncodingChange(event.target.value)}
                MenuProps={{ disableRestoreFocus: true }}
                fullWidth
              >
                {ENCODING_OPTIONS.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </Select>
              {!readOnly && fileName ? (
                <Button size="small" variant="outlined" onClick={() => runAndClose(onReloadWithEncoding)}>{t(language, 'status.reloadEncoding')}</Button>
              ) : null}
            </Stack>
          )}
                </Box>
              </Paper>
            </Box>
          </Fade>
        )}
      </Popper>
    </Paper>
  )
}

export default memo(StatusBar)
