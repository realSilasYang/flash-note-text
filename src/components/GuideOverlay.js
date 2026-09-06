import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import { t } from '../locales'

const VIEWPORT_PADDING = 8
const TARGET_PADDING = 4
const TOOLTIP_GAP = 10

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

function GuideOverlay ({ currentStep, language, onComplete, onNext, onPrev, steps }) {
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ top: VIEWPORT_PADDING, left: VIEWPORT_PADDING })
  const tooltipRef = useRef(null)
  const step = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null

  useEffect(() => {
    if (!step) return undefined
    const handleEscape = event => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onComplete(true)
    }
    document.addEventListener('keydown', handleEscape, true)
    return () => document.removeEventListener('keydown', handleEscape, true)
  }, [onComplete, step])

  useLayoutEffect(() => {
    if (!step) {
      setTargetRect(null)
      return undefined
    }

    let frame = 0
    let settleTimer = 0
    let resizeObserver
    const updatePosition = () => {
      const target = document.querySelector(step.selector)
      if (!target) {
        setTargetRect(null)
        return
      }

      const rect = target.getBoundingClientRect()
      const top = Math.max(0, rect.top - TARGET_PADDING)
      const left = Math.max(0, rect.left - TARGET_PADDING)
      const right = Math.min(window.innerWidth, rect.right + TARGET_PADDING)
      const bottom = Math.min(window.innerHeight, rect.bottom + TARGET_PADDING)
      const nextTargetRect = { top, left, right, bottom, width: right - left, height: bottom - top }
      setTargetRect(nextTargetRect)

      const tooltipRect = tooltipRef.current?.getBoundingClientRect()
      const tooltipWidth = tooltipRect?.width || 320
      const tooltipHeight = tooltipRect?.height || 260
      const candidates = {
        right: { top: top + (nextTargetRect.height - tooltipHeight) / 2, left: right + TOOLTIP_GAP },
        left: { top: top + (nextTargetRect.height - tooltipHeight) / 2, left: left - tooltipWidth - TOOLTIP_GAP },
        bottom: { top: bottom + TOOLTIP_GAP, left: left + (nextTargetRect.width - tooltipWidth) / 2 },
        top: { top: top - tooltipHeight - TOOLTIP_GAP, left: left + (nextTargetRect.width - tooltipWidth) / 2 },
        inside: { top: top + 18, left: left + 18 }
      }
      const preferred = candidates[step.placement] || candidates.right
      const ordered = [preferred, candidates.right, candidates.left, candidates.bottom, candidates.top]
      const fits = position => position.top >= VIEWPORT_PADDING && position.left >= VIEWPORT_PADDING &&
        position.top + tooltipHeight <= window.innerHeight - VIEWPORT_PADDING &&
        position.left + tooltipWidth <= window.innerWidth - VIEWPORT_PADDING
      const chosen = ordered.find(fits) || preferred
      setTooltipPos({
        top: clamp(chosen.top, VIEWPORT_PADDING, window.innerHeight - tooltipHeight - VIEWPORT_PADDING),
        left: clamp(chosen.left, VIEWPORT_PADDING, window.innerWidth - tooltipWidth - VIEWPORT_PADDING)
      })
    }

    const scheduleUpdate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updatePosition)
    }
    setTargetRect(null)
    scheduleUpdate()
    settleTimer = window.setTimeout(scheduleUpdate, 180)
    const target = document.querySelector(step.selector)
    if (target && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(target)
    }
    window.addEventListener('resize', scheduleUpdate)
    window.addEventListener('scroll', scheduleUpdate, true)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', scheduleUpdate)
      window.removeEventListener('scroll', scheduleUpdate, true)
    }
  }, [step])

  if (!step || !targetRect) return null

  const renderMessage = message => String(message || '').split('\n').map((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return <Box key={index} sx={{ height: 5 }} />
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-')
    const text = isBullet ? trimmed.slice(1).trim() : trimmed
    const parts = text.split(/(\{key:.*?\}|\{bold:.*?\})/).map((part, partIndex) => {
      if (part.startsWith('{key:') && part.endsWith('}')) {
        return <Box component="span" key={partIndex} sx={{ display: 'inline-block', px: 0.55, py: 0.1, mx: 0.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover', fontFamily: 'Consolas, monospace', fontSize: '0.78em', fontWeight: 700 }}>{part.slice(5, -1)}</Box>
      }
      if (part.startsWith('{bold:') && part.endsWith('}')) {
        return <Box component="span" key={partIndex} sx={{ color: 'primary.main', fontWeight: 700 }}>{part.slice(6, -1)}</Box>
      }
      return part
    })
    return (
      <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: isBullet ? 1 : 0, ml: isBullet ? 0.5 : 0 }}>
        {isBullet ? <Typography variant="caption" sx={{ mt: 0.45, color: 'primary.main' }}>●</Typography> : null}
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{parts}</Typography>
      </Box>
    )
  })

  const masks = [
    { top: 0, left: 0, right: 0, height: targetRect.top },
    { top: targetRect.bottom, left: 0, right: 0, bottom: 0 },
    { top: targetRect.top, left: 0, width: targetRect.left, height: targetRect.height },
    { top: targetRect.top, left: targetRect.right, right: 0, height: targetRect.height }
  ]

  return (
    <>
      <Box sx={{ position: 'fixed', inset: 0, zIndex: 1400, pointerEvents: 'none' }}>
        {masks.map((position, index) => (
          <Box key={index} sx={{ position: 'absolute', bgcolor: 'rgba(0, 0, 0, 0.68)', pointerEvents: 'auto', transition: 'all 220ms ease', ...position }} />
        ))}
        <Box
          sx={{
            position: 'absolute',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            border: '1px solid #E6B450',
            borderRadius: 2,
            pointerEvents: 'none',
            transition: 'all 220ms ease',
            animation: 'guidePulse 1.2s ease-out infinite',
            '@keyframes guidePulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(230, 180, 80, 0.42)' },
              '70%': { boxShadow: '0 0 0 8px rgba(230, 180, 80, 0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(230, 180, 80, 0)' }
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        />
      </Box>

      <Fade in timeout={180}>
        <Paper
          ref={tooltipRef}
          role="dialog"
          aria-modal="true"
          aria-label={step.title}
          sx={{
            position: 'fixed',
            zIndex: 1401,
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: 320,
            maxWidth: 'calc(100vw - 16px)',
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            transition: 'top 220ms ease, left 220ms ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1.5, mb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ flex: 1, minWidth: 0, color: 'primary.main', fontSize: '1.05rem', fontWeight: 700 }}>{step.title}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, px: 1, py: 0.25, borderRadius: 2, bgcolor: 'action.hover', fontWeight: 700 }}>
              {currentStep + 1} / {steps.length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45, mb: 2.25 }}>
            {renderMessage(step.message)}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Button size="small" onClick={() => onComplete(true)} sx={{ minWidth: 0, color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
              {t(language, 'guide.skip')}
            </Button>
            <Box sx={{ display: 'flex', gap: 0.75 }}>
              {currentStep > 0 ? (
                <Button size="small" variant="outlined" startIcon={<ArrowBackIcon />} onClick={onPrev}>
                  {t(language, 'guide.back')}
                </Button>
              ) : null}
              <Button
                size="small"
                variant="contained"
                endIcon={currentStep === steps.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
                onClick={currentStep === steps.length - 1 ? () => onComplete(false) : onNext}
                sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
              >
                {t(language, currentStep === steps.length - 1 ? 'guide.finish' : 'guide.next')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </>
  )
}

export default memo(GuideOverlay)
