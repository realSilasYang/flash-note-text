import { memo, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import FavoriteIcon from '@mui/icons-material/Favorite'
import SchoolIcon from '@mui/icons-material/School'
import ActionTooltip from './ActionTooltip'
import DonationDialog from './DonationDialog'
import { triggerConfetti } from '../confettiEffect'
import { t } from '../locales'

function KeyTag ({ children, isDark }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.65,
        py: 0.15,
        mx: 0.2,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(67,52,27,0.22)',
        borderRadius: 1,
        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(67,52,27,0.06)',
        fontFamily: 'Consolas, monospace',
        fontSize: '0.78em',
        fontWeight: 700,
        lineHeight: 1.35
      }}
    >
      {children}
    </Box>
  )
}

function HelpDialog ({ isDark, language, onClose, onDonationThanks, onStartGuide, open, sidebarShortcut }) {
  const [donationOpen, setDonationOpen] = useState(false)
  const donationThanksPendingRef = useRef(false)

  useEffect(() => {
    if (open) return
    donationThanksPendingRef.current = false
    setDonationOpen(false)
  }, [open])

  const handleDonationOpen = () => {
    donationThanksPendingRef.current = false
    setDonationOpen(true)
  }

  const handleDonationClose = () => {
    donationThanksPendingRef.current = true
    setDonationOpen(false)
  }

  const handleDonationEntered = () => {
    if (open && donationOpen) triggerConfetti({ zIndex: 1350 })
  }

  const handleDonationExited = () => {
    const shouldThank = donationThanksPendingRef.current && open
    donationThanksPendingRef.current = false
    if (!shouldThank) return
    triggerConfetti({ zIndex: 1350 })
    onDonationThanks?.()
  }

  const workflow = [
    { emoji: '🗂️', title: t(language, 'help.history'), desc: t(language, 'help.historyDesc') },
    { emoji: '✍️', title: t(language, 'help.editor'), desc: t(language, 'help.editorDesc') },
    { emoji: '💾', title: t(language, 'help.autosave'), desc: t(language, 'autoSave.workflowDescription') }
  ]
  const features = [
    { emoji: '📋', title: t(language, 'help.featureEntryTitle'), desc: t(language, 'help.featureEntryDesc') },
    { emoji: '🔍', title: t(language, 'help.featureSearchTitle'), desc: t(language, 'help.featureSearchDesc') },
    { emoji: '👀', title: t(language, 'help.featurePreviewTitle'), desc: t(language, 'help.featurePreviewDesc') },
    { emoji: '🖋️', title: t(language, 'help.formattingTitle'), desc: t(language, 'help.formattingDesc') },
    { emoji: '🎨', title: t(language, 'help.imageShareTitle'), desc: t(language, 'help.imageShareDesc') },
    { emoji: '📂', title: t(language, 'help.featureEncodingTitle'), desc: t(language, 'help.featureEncodingDesc') },
    { emoji: '✨', title: t(language, 'help.aiTitle'), desc: t(language, 'help.aiDesc') }
  ]

  const noteFontChains = [
    { templates: ['default', 'smartisan-dark'], body: 'OPPOSans → Noto Sans SC → PingFang SC → Microsoft YaHei' },
    { templates: ['apple-notes-light', 'apple-notes'], body: 'System UI → SF Pro Text → SF Pro SC → PingFang SC → Microsoft YaHei' },
    { templates: ['bear'], body: 'Avenir Next → Avenir → System UI → PingFang SC → Microsoft YaHei' },
    { templates: ['telegraph'], body: 'Georgia → Cambria → Times New Roman → Noto Serif SC → Songti SC', heading: 'Lucida Grande → System UI → PingFang SC → Microsoft YaHei' }
  ]
  const codeFontChains = [
    { themes: ['vercel', 'rabbit', 'clerk'], font: 'Geist Mono' },
    { themes: ['supabase'], font: 'IBM Plex Mono' },
    { themes: ['tailwind'], font: 'Fira Code' },
    { themes: ['openai'], font: 'Söhne Mono' },
    { label: t(language, 'help.otherCodeThemes'), font: 'JetBrains Mono' }
  ]
  const socialFontChains = [
    { label: t(language, 'share.zhihuImage'), font: 'Microsoft YaHei → PingFang SC → Noto Sans CJK SC → sans-serif' },
    { label: t(language, 'share.wechatImage'), font: 'Songti SC → STSong → SimSun → Noto Serif CJK SC → serif' },
    { label: t(language, 'share.xImage'), font: 'Arial → Helvetica Neue → Microsoft YaHei → sans-serif' }
  ]

  const shortcuts = [
    { keys: ['Ctrl', 'N'], desc: t(language, 'help.shortcutNew') },
    { keys: ['Ctrl', 'F'], desc: t(language, 'help.shortcutFind') },
    { keys: ['Ctrl', 'H'], desc: t(language, 'help.shortcutReplace') },
    { keys: ['Ctrl', '/'], desc: t(language, 'help.shortcutMode') },
    { keys: ['Ctrl', 'B'], desc: t(language, 'help.shortcutBold') },
    { keys: ['Ctrl', 'I'], desc: t(language, 'help.shortcutItalic') },
    { keys: ['Ctrl', 'O'], desc: t(language, 'help.shortcutOpen') },
    { keys: ['Ctrl', 'S'], desc: t(language, 'help.shortcutSave') },
    { keys: ['Ctrl', 'Z'], desc: t(language, 'help.shortcutUndo') },
    { keys: ['Ctrl', 'Y'], desc: t(language, 'help.shortcutDeleteLine') },
    { keys: ['Ctrl', 'Shift', 'Z'], desc: t(language, 'help.shortcutRedo') },
    { keys: ['Ctrl', 'G'], desc: t(language, 'help.shortcutGoLine') },
    { keys: ['Ctrl', '+ / - / 0'], desc: t(language, 'help.shortcutZoom') },
    { keys: String(sidebarShortcut || 'Alt+Z').split('+'), desc: t(language, 'help.shortcutSidebar') },
    { keys: ['F2'], desc: t(language, 'help.shortcutRename') },
    { keys: ['Delete'], desc: t(language, 'help.shortcutDelete') },
    { keys: ['Esc'], desc: t(language, 'help.shortcutEscape') }
  ]

  return (
    <>
      <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      disableRestoreFocus
      PaperProps={{
        sx: {
          maxHeight: '85vh',
          bgcolor: isDark ? '#2b2b2b' : '#FDFBF7',
          backgroundImage: 'none',
          border: 'none'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<SchoolIcon />}
            onClick={onStartGuide}
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: '#93a7e9',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: '#93a7e9',
                boxShadow: 'none'
              }
            }}
          >
            {t(language, 'help.startGuide')}
          </Button>
          <ActionTooltip title={t(language, 'donation.tooltip')} describeChild>
            <Button
              variant="contained"
              size="small"
              startIcon={<FavoriteIcon />}
              onClick={handleDonationOpen}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                color: 'error.main',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                  color: 'error.main',
                  boxShadow: 'none'
                }
              }}
            >
              {t(language, 'donation.button')}
            </Button>
          </ActionTooltip>
        </Box>
        <IconButton aria-label={t(language, 'help.close')} size="small" onClick={onClose} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          {t(language, 'help.workflow')}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
          {workflow.map(({ emoji, title, desc }, index) => (
            <Box key={title} sx={{ display: 'contents' }}>
              <Box sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ mb: 0.5, fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", sans-serif' }}>{emoji}</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.5 }}>{desc}</Typography>
              </Box>
              {index < workflow.length - 1 ? <Typography variant="h5" color="text.secondary">→</Typography> : null}
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          {t(language, 'help.features')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {features.map(({ emoji, title, desc }) => (
            <Box key={title}>
              <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', fontWeight: 700 }}>
                <Box component="span" sx={{ fontFamily: '"Segoe UI Emoji", "Apple Color Emoji", sans-serif' }}>{emoji}</Box>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5, lineHeight: 1.6 }}>
                {desc}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 2 }}>
          {t(language, 'help.shortcuts')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, p: 2, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
          {shortcuts.map(({ keys, desc }) => (
            <Box key={`${keys.join('-')}-${desc}`} sx={{ minWidth: 0, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 0.75, py: 0.4, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: 0.4 }}>
                {keys.map((key, index) => (
                  <Box component="span" key={`${key}-${index}`} sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    <KeyTag isDark={isDark}>{key}</KeyTag>
                    {index < keys.length - 1 ? <Typography component="span" variant="caption" color="text.disabled">+</Typography> : null}
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0, textAlign: 'right', overflowWrap: 'anywhere' }}>{desc}</Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
          {t(language, 'help.shareFontsTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          {t(language, 'help.shareFontsIntro')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 2 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{t(language, 'help.noteFonts')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {noteFontChains.map(({ templates, body, heading }) => (
                <Typography key={templates.join('-')} variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                  <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{templates.map(id => t(language, `share.template.${id}`)).join(' / ')}</Box>
                  {`: ${t(language, 'help.bodyFont')} ${body}`}
                  {heading ? `; ${t(language, 'help.headingFont')} ${heading}` : ''}
                </Typography>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{t(language, 'help.codeFonts')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {codeFontChains.map(({ themes, label, font }) => (
                <Typography key={label || themes.join('-')} variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                  <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{label || themes.map(id => t(language, `share.code.themes.${id}`)).join(' / ')}</Box>
                  {`: ${font}`}
                </Typography>
              ))}
            </Box>
          </Box>
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>{t(language, 'help.imageShareTitle')}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {socialFontChains.map(({ label, font }) => (
                <Typography key={label} variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, overflowWrap: 'anywhere' }}>
                  <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{label}</Box>
                  {`: ${font}`}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.6 }}>
          {t(language, 'help.fontResolutionNote')}
        </Typography>
      </DialogContent>
      </Dialog>
      <DonationDialog
        isDark={isDark}
        language={language}
        onClose={handleDonationClose}
        onEntered={handleDonationEntered}
        onExited={handleDonationExited}
        open={open && donationOpen}
      />
    </>
  )
}

export default memo(HelpDialog)
