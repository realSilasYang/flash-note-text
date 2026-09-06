import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing'
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined'
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import WrapTextIcon from '@mui/icons-material/WrapText'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Popper from '@mui/material/Popper'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { t } from '../locales'
import { TEXT_FORMATTING_ACTIONS } from '../textFormatting'
import { getBrandColor } from './BrandIcon.jsx'
import FormattingActionIcon from './FormattingActionIcon.jsx'
import ShareTypeIcon from './ShareTypeIcon.jsx'

const FORMATTING_ACTION_META = {
  reflowLines: { icon: <WrapTextIcon fontSize="small" />, light: '#2563A6', dark: '#78B7F0' },
  escapedBreaks: { icon: <FormattingActionIcon kind="escapedBreaks" />, light: '#157C7A', dark: '#62C7C1' },
  removeWhitespace: { icon: <FormattingActionIcon kind="removeWhitespace" />, light: '#A5650B', dark: '#E7B45A' },
  ghostCharactersToSpaces: { icon: <VisibilityOffOutlinedIcon fontSize="small" />, light: '#3D7B8F', dark: '#79C4D8' },
  removeHalfwidthSpaces: { icon: <FormattingActionIcon kind="removeHalfwidthSpaces" />, light: '#7356A8', dark: '#B9A0E6' },
  removeBlankLines: { icon: <FormattingActionIcon kind="removeBlankLines" />, light: '#B44F3B', dark: '#ED8B76' },
  removeCitationNumbers: { icon: <FormatListNumberedOutlinedIcon fontSize="small" sx={{ transform: 'translateX(1px)' }} />, light: '#A44270', dark: '#E487B1' },
  removeLinks: { icon: <LinkOffOutlinedIcon fontSize="small" sx={{ transform: 'translateX(1px)' }} />, light: '#B15C24', dark: '#EDA06C' },
  spaceCjkLatin: { icon: <FormattingActionIcon kind="spaceCjkLatin" />, light: '#287A54', dark: '#75C99B' },
  punctuationToCjk: { icon: <FormattingActionIcon kind="punctuationToCjk" />, light: '#2E69A3', dark: '#79AFE2' },
  punctuationToLatin: { icon: <FormattingActionIcon kind="punctuationToLatin" />, light: '#7650A6', dark: '#B99ADB' }
}

const SHARE_OPTION_KEYS = [
  'noteImage',
  'codeImage',
  'xiaohongshuImage',
  'xiaohongshuLongImage',
  'zhihuImage',
  'wechatImage',
  'xImage'
]

function getShareTypeOptionSx (iconColor, isDark, optionWidth) {
  return {
    boxSizing: 'border-box',
    position: 'relative',
    width: optionWidth,
    minWidth: optionWidth,
    height: 68,
    minHeight: 68,
    m: 0,
    p: '4px 5px',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    justifySelf: 'center',
    alignContent: 'center',
    gap: '3px',
    color: 'text.primary',
    border: 'none',
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.2,
    textAlign: 'center',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    '&::before': {
      display: 'none'
    },
    '&::after': {
      display: 'none',
      position: 'absolute',
      zIndex: 2,
      top: 0,
      bottom: 0,
      left: 0,
      width: 4,
      content: '""',
      pointerEvents: 'none',
      bgcolor: 'background.paper'
    },
    '& .MuiButton-startIcon': {
      display: 'inline-flex',
      width: 'auto',
      minWidth: 0,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      flexShrink: 0,
      margin: '0 0 1px !important',
      lineHeight: 0,
      color: iconColor,
      transition: 'filter 0.18s ease, transform 0.18s ease'
    },
    '& > .share-type-option-label': {
      display: 'block',
      lineHeight: 1.2,
      whiteSpace: 'nowrap'
    },
    '&:hover, &:focus-visible': {
      color: 'text.primary',
      bgcolor: isDark ? 'rgba(143, 181, 149, 0.12)' : 'rgba(143, 181, 149, 0.11)'
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: -2
    },
    '&:hover .MuiButton-startIcon, &:focus-visible .MuiButton-startIcon': {
      color: iconColor,
      filter: 'brightness(1.08)',
      transform: 'scale(1.06)'
    }
  }
}

function EditorActionBar ({ language, onFormatText, onOpenAiFormatting, onOpenShareStudio, readOnly }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const actionBarRef = useRef(null)
  const popoverRef = useRef(null)
  const closeTimerRef = useRef(null)
  const [anchor, setAnchor] = useState(null)
  const [activeSection, setActiveSection] = useState('')
  const open = Boolean(anchor)
  const actionJoinBackground = isDark ? 'rgba(143, 181, 149, 0.15)' : 'rgba(93, 124, 102, 0.12)'
  const optionWidth = useMemo(() => {
    if (typeof document === 'undefined') return '112px'
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return '112px'
    const bodyStyle = getComputedStyle(document.body)
    context.font = `600 11px ${bodyStyle.fontFamily}`
    const labels = [
      ...TEXT_FORMATTING_ACTIONS.map(action => t(language, `formatting.actions.${action}`)),
      t(language, 'ai.formatting'),
      ...SHARE_OPTION_KEYS.map(key => t(language, `share.${key}`)),
      `AI ${t(language, 'ai.generateImage')}`
    ]
    const widestLabel = Math.max(...labels.map(label => context.measureText(label).width), 0)
    return `${Math.ceil(widestLabel + 10)}px`
  }, [language])

  const cancelScheduledClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current)
  }, [])

  const closePopover = useCallback(() => {
    cancelScheduledClose()
    setAnchor(null)
    setActiveSection('')
  }, [cancelScheduledClose])

  const showPopover = (event, section) => {
    cancelScheduledClose()
    setAnchor(event.currentTarget)
    setActiveSection(section)
  }

  const scheduleClosePopover = () => {
    cancelScheduledClose()
    closeTimerRef.current = window.setTimeout(closePopover, 140)
  }

  const runAndClose = (action) => {
    action?.()
    closePopover()
  }

  useEffect(() => () => cancelScheduledClose(), [cancelScheduledClose])

  useEffect(() => {
    if (!open) return undefined
    const handlePointerDown = event => {
      if (actionBarRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return
      closePopover()
    }
    const handleKeyDown = event => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      closePopover()
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [closePopover, open])

  useEffect(() => {
    if (readOnly && activeSection === 'formatting') closePopover()
  }, [activeSection, closePopover, readOnly])

  const getActionButtonSx = color => ({
    boxSizing: 'border-box',
    alignSelf: 'stretch',
    flex: '0 0 36px',
    width: '100%',
    minWidth: 36,
    height: 36,
    minHeight: 36,
    m: 0,
    p: 0,
    position: 'relative',
    isolation: 'isolate',
    overflow: 'visible',
    borderRadius: '8px',
    color,
    transform: 'none',
    transformOrigin: 'center',
    '&::before': {
      position: 'absolute',
      zIndex: 0,
      left: 1,
      right: 1,
      top: 2,
      bottom: 2,
      borderRadius: '8px',
      backgroundColor: 'transparent',
      content: '""',
      pointerEvents: 'none',
      transition: 'background-color 0.2s ease'
    },
    '& > *': { position: 'relative', zIndex: 1 },
    '&:hover': {
      color,
      transform: 'scale(1.08)',
      backgroundColor: 'transparent',
      boxShadow: 'none'
    },
    '&:active': {
      transform: 'scale(1.04)',
      backgroundColor: 'transparent'
    },
    '&:hover::before, &[aria-expanded="true"]::before': {
      backgroundColor: actionJoinBackground
    },
    '&[aria-expanded="true"]': {
      color,
      zIndex: theme.zIndex.modal + 1,
      backgroundColor: 'transparent',
      boxShadow: 'none'
    },
    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 }
  })

  return (
    <Box
      ref={actionBarRef}
      component="nav"
      aria-label={`${t(language, 'formatting.label')} / ${t(language, 'share.label')}`}
      sx={{
        position: 'absolute',
        bottom: 38,
        left: 12,
        zIndex: open ? theme.zIndex.modal + 1 : 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        bgcolor: 'transparent'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'inline-flex',
          width: 36,
          flexDirection: 'column',
          alignItems: 'stretch',
          overflow: 'visible',
          borderRadius: 0,
          bgcolor: 'transparent',
          border: '0 !important',
          boxShadow: 'none',
          opacity: 0.98
        }}
      >
        <IconButton
          data-editor-action="formatting"
          aria-label={t(language, 'formatting.label')}
          size="small"
          disabled={readOnly}
          aria-expanded={open && activeSection === 'formatting'}
          onMouseEnter={event => showPopover(event, 'formatting')}
          onMouseLeave={scheduleClosePopover}
          onFocus={event => showPopover(event, 'formatting')}
          onBlur={scheduleClosePopover}
          onClick={event => showPopover(event, 'formatting')}
          sx={getActionButtonSx(isDark ? '#78B7F0' : '#2563A6')}
        >
          <FormatLineSpacingIcon fontSize="small" />
        </IconButton>
        <IconButton
          data-editor-action="share"
          aria-label={t(language, 'share.label')}
          size="small"
          aria-expanded={open && activeSection === 'share'}
          onMouseEnter={event => showPopover(event, 'share')}
          onMouseLeave={scheduleClosePopover}
          onFocus={event => showPopover(event, 'share')}
          onBlur={scheduleClosePopover}
          onClick={event => showPopover(event, 'share')}
          sx={getActionButtonSx(isDark ? '#79C99B' : '#287A54')}
        >
          <ShareOutlinedIcon fontSize="small" />
        </IconButton>
      </Paper>

      <Popper
        open={open}
        anchorEl={anchor}
        placement="right-start"
        transition
        modifiers={[
          { name: 'offset', options: { offset: [0, -8] } },
          { name: 'preventOverflow', options: { altAxis: true, padding: 8 } },
          { name: 'flip', options: { padding: 8 } }
        ]}
        sx={{ zIndex: theme.zIndex.modal }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={{ enter: 180, exit: 140 }}>
            <Paper
              ref={popoverRef}
              onMouseEnter={cancelScheduledClose}
              onMouseLeave={scheduleClosePopover}
              onFocusCapture={cancelScheduledClose}
              onBlurCapture={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) scheduleClosePopover()
              }}
              elevation={0}
              sx={{
                ml: 0,
                position: 'relative',
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'var(--ghibli-shadow-hover)',
                '&::before': {
                  position: 'absolute',
                  zIndex: 2,
                  content: '""',
                  pointerEvents: 'none',
                  boxSizing: 'border-box',
                  width: 4,
                  height: 'var(--editor-action-join-size, 36px)',
                  bgcolor: 'background.paper',
                  top: -1,
                  left: -2,
                  borderRadius: 4
                },
                '.MuiPopper-root[data-popper-placement^="right"] & .editor-action-menu-grid > .MuiButton-root:nth-child(4n + 1)::after': { display: 'block' },
                '.MuiPopper-root[data-popper-placement^="left"] & .editor-action-menu-grid > .MuiButton-root:nth-child(4n + 1)::after': {
                  left: 'auto',
                  right: 0
                },
                '.MuiPopper-root[data-popper-placement^="left"] & .editor-action-menu-grid > .MuiButton-root:nth-child(4n)::after': {
                  display: 'block',
                  left: 0,
                  right: 'auto'
                },
                '.MuiPopper-root[data-popper-placement="right-start"] &::before': { left: -2, top: -1 },
                '.MuiPopper-root[data-popper-placement="right-end"] &::before': { left: -2, top: 'auto', bottom: -1 },
                '.MuiPopper-root[data-popper-placement="left-start"] &::before': { right: -2, left: 'auto', top: -1 },
                '.MuiPopper-root[data-popper-placement="left-end"] &::before': { right: -2, left: 'auto', top: 'auto', bottom: -1 },
                '.MuiPopper-root[data-popper-placement="top-start"] &::before': { left: 0, top: 'auto', bottom: -2, width: 'var(--editor-action-join-size, 36px)', height: 4 },
                '.MuiPopper-root[data-popper-placement="top-end"] &::before': { right: 0, left: 'auto', top: 'auto', bottom: -2, width: 'var(--editor-action-join-size, 36px)', height: 4 },
                '.MuiPopper-root[data-popper-placement="bottom-start"] &::before': { left: 0, top: -2, width: 'var(--editor-action-join-size, 36px)', height: 4 },
                '.MuiPopper-root[data-popper-placement="bottom-end"] &::before': { right: 0, left: 'auto', top: -2, width: 'var(--editor-action-join-size, 36px)', height: 4 },
                '@media (max-width: 460px)': {
                  '.MuiPopper-root[data-popper-placement^="right"] & .editor-action-menu-grid > .MuiButton-root:nth-child(4n + 1)::after': { display: 'none' },
                  '.MuiPopper-root[data-popper-placement^="right"] & .editor-action-menu-grid > .MuiButton-root:nth-child(3n + 1)::after': { display: 'block' },
                  '.MuiPopper-root[data-popper-placement^="left"] & .editor-action-menu-grid > .MuiButton-root:nth-child(4n)::after': { display: 'none' },
                  '.MuiPopper-root[data-popper-placement^="left"] & .editor-action-menu-grid > .MuiButton-root:nth-child(3n)::after': { display: 'block', left: 0, right: 'auto' }
                },
                '@media (max-width: 340px)': {
                  '.MuiPopper-root[data-popper-placement^="right"] & .editor-action-menu-grid > .MuiButton-root:nth-child(3n + 1)::after': { display: 'none' },
                  '.MuiPopper-root[data-popper-placement^="right"] & .editor-action-menu-grid > .MuiButton-root:nth-child(2n + 1)::after': { display: 'block' },
                  '.MuiPopper-root[data-popper-placement^="left"] & .editor-action-menu-grid > .MuiButton-root:nth-child(3n)::after': { display: 'none' },
                  '.MuiPopper-root[data-popper-placement^="left"] & .editor-action-menu-grid > .MuiButton-root:nth-child(2n)::after': { display: 'block', left: 0, right: 'auto' }
                },
                animation: TransitionProps.in ? 'editorActionsEnter 180ms cubic-bezier(0.2, 0, 0, 1) both' : 'none',
                '@keyframes editorActionsEnter': {
                  from: { transform: 'translateX(-6px)' },
                  to: { transform: 'translateX(0)' }
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
              }}
            >
              {activeSection === 'formatting' ? (
                <Box
                  sx={{
                    boxSizing: 'border-box',
                    width: 'max-content',
                    maxWidth: 'calc(100vw - 48px)',
                    p: 0.75,
                    overflowX: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: 13, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {t(language, 'formatting.menuLabel')}
                  </Typography>
                  <Box
                    component="div"
                    className="editor-action-menu-grid"
                    role="menu"
                    aria-label={t(language, 'formatting.menuLabel')}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, max-content)',
                      justifyContent: 'center',
                      gap: 0.5,
                      '@media (max-width: 460px)': { gridTemplateColumns: 'repeat(3, max-content)' },
                      '@media (max-width: 340px)': { gridTemplateColumns: 'repeat(2, max-content)' }
                    }}
                  >
                    {TEXT_FORMATTING_ACTIONS.map(action => {
                      const meta = FORMATTING_ACTION_META[action]
                      const iconColor = meta[isDark ? 'dark' : 'light']
                      return (
                        <Button
                          key={action}
                          data-formatting-action={action}
                          role="menuitem"
                          size="small"
                          variant="outlined"
                          startIcon={meta.icon}
                          onClick={() => runAndClose(() => onFormatText?.(action))}
                          sx={getShareTypeOptionSx(iconColor, isDark, optionWidth)}
                        >
                          <span className="share-type-option-label">{t(language, `formatting.actions.${action}`)}</span>
                        </Button>
                      )
                    })}
                    <Button
                      data-formatting-action="ai"
                      role="menuitem"
                      size="small"
                      variant="outlined"
                      startIcon={<AutoAwesomeOutlinedIcon fontSize="small" />}
                      onClick={() => runAndClose(() => onOpenAiFormatting?.())}
                      sx={getShareTypeOptionSx(isDark ? '#D6A6FF' : '#7A43A8', isDark, optionWidth)}
                    >
                      <span className="share-type-option-label">{t(language, 'ai.formatting')}</span>
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box
                  sx={{
                    boxSizing: 'border-box',
                    width: 'max-content',
                    maxWidth: 'calc(100vw - 48px)',
                    p: 0.75,
                    overflowX: 'auto'
                  }}
                >
                  <Typography variant="body2" sx={{ mb: 0.5, fontSize: 13, fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {t(language, 'share.chooseType')}
                  </Typography>
                  <Box
                    className="editor-action-menu-grid"
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, max-content)',
                      justifyContent: 'center',
                      gap: 0.5,
                      '@media (max-width: 460px)': { gridTemplateColumns: 'repeat(3, max-content)' },
                      '@media (max-width: 340px)': { gridTemplateColumns: 'repeat(2, max-content)' }
                    }}
                  >
                    <Button data-share-kind="note" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="note" />} onClick={() => runAndClose(() => onOpenShareStudio?.('note'))} sx={getShareTypeOptionSx(isDark ? '#F2C66D' : '#B56A00', isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.noteImage')}</span>
                    </Button>
                    <Button data-share-kind="code" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="code" />} onClick={() => runAndClose(() => onOpenShareStudio?.('code'))} sx={getShareTypeOptionSx(isDark ? '#68B5E8' : '#1976A8', isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.codeImage')}</span>
                    </Button>
                    <Button data-share-kind="xiaohongshu" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="xiaohongshu" />} onClick={() => runAndClose(() => onOpenShareStudio?.('xiaohongshu'))} sx={getShareTypeOptionSx(getBrandColor('xiaohongshu'), isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.xiaohongshuImage')}</span>
                    </Button>
                    <Button data-share-kind="xiaohongshu-long" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="xiaohongshu-long" />} onClick={() => runAndClose(() => onOpenShareStudio?.('xiaohongshu-long'))} sx={getShareTypeOptionSx(getBrandColor('xiaohongshu'), isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.xiaohongshuLongImage')}</span>
                    </Button>
                    <Button data-share-kind="zhihu" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="zhihu" />} onClick={() => runAndClose(() => onOpenShareStudio?.('zhihu'))} sx={getShareTypeOptionSx(getBrandColor('zhihu'), isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.zhihuImage')}</span>
                    </Button>
                    <Button data-share-kind="wechat" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="wechat" />} onClick={() => runAndClose(() => onOpenShareStudio?.('wechat'))} sx={getShareTypeOptionSx(getBrandColor('wechat'), isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.wechatImage')}</span>
                    </Button>
                    <Button data-share-kind="x" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="x" />} onClick={() => runAndClose(() => onOpenShareStudio?.('x'))} sx={getShareTypeOptionSx(getBrandColor('x'), isDark, optionWidth)}>
                      <span className="share-type-option-label">{t(language, 'share.xImage')}</span>
                    </Button>
                    <Button data-share-kind="ai-image" size="small" variant="outlined" startIcon={<ShareTypeIcon kind="ai-image" />} onClick={() => runAndClose(() => onOpenShareStudio?.('ai-image'))} sx={getShareTypeOptionSx(isDark ? '#8ED1B2' : '#2D7A55', isDark, optionWidth)}>
                      <span className="share-type-option-label">AI {t(language, 'ai.generateImage')}</span>
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  )
}

export default memo(EditorActionBar)
