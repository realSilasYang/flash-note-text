import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import { t } from '../locales'
import {
  cacheXiaohongshuCards,
  cacheXiaohongshuCardColorOffset,
  cacheXiaohongshuLongTemplateCards,
  cacheXiaohongshuLongTemplates,
  cacheXiaohongshuSelection,
  clearXiaohongshuCardColorOffsets,
  getXiaohongshuLongVariantKey,
  getXiaohongshuPreviewCache
} from '../imagePreviewCache'
import { generateXiaohongshuCards, getXiaohongshuErrorCode, getXiaohongshuErrorDetails } from '../xiaohongshuAutomation'
import { StudioHeader } from './ShareStudioChrome.jsx'
import BrandIcon from './BrandIcon.jsx'
import PreviewResetButton from './PreviewResetButton.jsx'
import { usePreviewZoom } from './usePreviewFit'
import './xiaohongshuStudio.less'

function sanitizeFilenamePart (value) {
  const forbidden = new Set(Array.from('<>:"/\\|?*'))
  return Array.from(String(value || ''))
    .filter(character => character.codePointAt(0) >= 32 && !forbidden.has(character))
    .join('')
    .trim()
}

function buildFilenameBase (initialData, card, language) {
  const contentLine = String(initialData.content || '').split(/\r?\n/).map(line => line.trim()).find(Boolean) || ''
  const defaultName = t(language, 'fileDialog.defaultName')
  const studioName = t(language, initialData.kind === 'xiaohongshu-long' ? 'share.xhs.longTitle' : 'share.xhs.title')
  const source = initialData.title || contentLine || defaultName
  const title = Array.from(sanitizeFilenamePart(source)).slice(0, 32).join('') || defaultName
  const template = Array.from(sanitizeFilenamePart(card?.name || '')).slice(0, 24).join('') || studioName
  return `${title}-${studioName}-${template}`
}

function getProgressKey (stage, isLongArticle) {
  const value = String(stage || '')
  if (value.includes('result:')) return 'extracting'
  if (value.startsWith('login-') || value.startsWith('plugin-window:restored')) return 'login'
  if (value.startsWith('long-images:') || value.startsWith('generation:') || value.startsWith('generation-')) return isLongArticle ? 'longImages' : 'images'
  if (value.startsWith('long-template')) return 'template'
  if (value.startsWith('long-layout')) return 'layout'
  if (value.startsWith('long-editor') || value.startsWith('editor:') || value.startsWith('text-image:')) return 'editor'
  if (value.startsWith('card-color')) return 'images'
  if (value.includes('navigation:') || value.startsWith('long-article:')) return 'navigating'
  return 'opening'
}

function getColorValue (color) {
  return String(typeof color === 'string' ? color : color?.value || '').trim()
}

function normalizeColorValue (color) {
  return getColorValue(color).replace(/\s+/g, '').toUpperCase()
}

function getDefaultTemplateColor (template) {
  return getColorValue(template?.colors?.find(color => color?.selected) || template?.colors?.[0])
}

function XiaohongshuImageStudio ({ initialData, imageSaveDirectory = '', language, onClose, onExported, onNotify }) {
  const isLongArticle = initialData.kind === 'xiaohongshu-long'
  const previewZoom = usePreviewZoom()
  const [runId, setRunId] = useState(0)
  const [status, setStatus] = useState('working')
  const [cards, setCards] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [errorDetails, setErrorDetails] = useState('')
  const [busy, setBusy] = useState('')
  const [progress, setProgress] = useState({ stage: 'validation:pending', detail: '' })
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [longTemplates, setLongTemplates] = useState([])
  const [selectedLongTemplateId, setSelectedLongTemplateId] = useState('')
  const [selectedLongTemplateColors, setSelectedLongTemplateColors] = useState({})
  const [showLongTemplatePicker, setShowLongTemplatePicker] = useState(false)
  const templateRequestRef = useRef(null)
  const autoTemplateChoiceRef = useRef(null)
  const templateGridRef = useRef(null)
  const templateOptionRefs = useRef(new Map())
  const templateScrollTopRef = useRef(0)
  const cardGridRef = useRef(null)
  const cardOptionRefs = useRef(new Map())
  const generatingLongTemplateChoiceRef = useRef(null)
  const cardColorOffsetsRef = useRef(new Map())
  const colorChangeControllerRef = useRef(null)
  const cardsRef = useRef([])
  const preferredReadyCardIdRef = useRef('')
  const [failedImages, setFailedImages] = useState(() => new Set())
  const [failedPreviews, setFailedPreviews] = useState(() => new Set())

  useEffect(() => {
    let active = true
    generatingLongTemplateChoiceRef.current = null
    setStatus('working')
    setErrorCode('')
    setErrorDetails('')
    setCards([])
    setSelectedId('')
    setFailedImages(new Set())
    setFailedPreviews(new Set())
    setLongTemplates([])
    setSelectedLongTemplateId('')
    setSelectedLongTemplateColors({})
    setShowLongTemplatePicker(false)
    setProgress({ stage: 'validation:pending', detail: '' })
    setElapsedSeconds(0)
    const runtimeCache = runId === 0 ? getXiaohongshuPreviewCache(initialData) : null
    if (runtimeCache) {
      if (!isLongArticle && runtimeCache.cards.length > 0) {
        cardColorOffsetsRef.current = new Map(runtimeCache.cardColorOffsets || [])
        const cachedCards = runtimeCache.cards
        const cachedSelectedId = cachedCards.some(card => card.id === runtimeCache.selectedCardId)
          ? runtimeCache.selectedCardId
          : (cachedCards.find(card => card.active) || cachedCards[0])?.id || ''
        setCards(cachedCards)
        setSelectedId(cachedSelectedId)
        setProgress({ stage: 'result:cached', detail: '' })
        setStatus('ready')
        return undefined
      }
      if (isLongArticle && runtimeCache.longTemplates.length > 0 && runtimeCache.longTemplateCards.size > 0) {
        const cachedTemplate = runtimeCache.longTemplates.find(template => template.name === runtimeCache.selectedLongTemplateName) || runtimeCache.longTemplates[0]
        const cachedColor = runtimeCache.selectedLongTemplateColor || getDefaultTemplateColor(cachedTemplate)
        const selectedKey = cachedTemplate ? getXiaohongshuLongVariantKey(cachedTemplate.name, cachedColor) : ''
        let cachedCards = selectedKey ? runtimeCache.longTemplateCards.get(selectedKey) : null
        let resolvedTemplate = cachedTemplate
        let resolvedColor = cachedColor
        if (!cachedCards?.length) {
          for (const template of runtimeCache.longTemplates) {
            for (const color of template.colors || []) {
              const colorValue = getColorValue(color)
              const candidate = runtimeCache.longTemplateCards.get(getXiaohongshuLongVariantKey(template.name, colorValue))
              if (candidate?.length) {
                resolvedTemplate = template
                resolvedColor = colorValue
                cachedCards = candidate
                break
              }
            }
            if (cachedCards?.length) break
          }
        }
        if (resolvedTemplate && cachedCards?.length) {
          const cachedSelectedId = cachedCards.some(card => card.id === runtimeCache.selectedCardId)
            ? runtimeCache.selectedCardId
            : (cachedCards.find(card => card.active) || cachedCards[0])?.id || ''
          setLongTemplates(runtimeCache.longTemplates)
          setSelectedLongTemplateId(resolvedTemplate.id)
          setSelectedLongTemplateColors(Object.fromEntries(runtimeCache.longTemplates.map(template => [
            template.id,
            template.id === resolvedTemplate.id ? resolvedColor : getDefaultTemplateColor(template)
          ])))
          setCards(cachedCards)
          setSelectedId(cachedSelectedId)
          setProgress({ stage: 'result:cached', detail: '' })
          setStatus('ready')
          return undefined
        }
      }
    }
    const controller = new AbortController()
    const startedAt = Date.now()
    let excludedElapsed = 0
    let selectionStartedAt = 0
    const updateElapsed = () => {
      if (!active) return
      const now = Date.now()
      const activeSelectionElapsed = selectionStartedAt ? now - selectionStartedAt : 0
      setElapsedSeconds(Math.floor(Math.max(0, now - startedAt - excludedElapsed - activeSelectionElapsed) / 1000))
    }
    const elapsedTimer = window.setInterval(() => {
      updateElapsed()
    }, 1000)
    generateXiaohongshuCards({
      title: initialData.title,
      content: initialData.content,
      editorMode: initialData.editorMode,
      generationType: isLongArticle ? 'long-article' : 'cards',
      windowTitle: t(language, isLongArticle ? 'share.xhs.longTitle' : 'share.xhs.title'),
      onProgress: nextProgress => {
        if (active) setProgress(nextProgress)
      },
      onTemplatesReady: templates => {
        if (!active || controller.signal.aborted) {
          return Promise.reject(new Error('FLASH_NOTE_XHS:CANCELLED'))
        }
        const displayTemplates = [...templates].reverse()
        cacheXiaohongshuLongTemplates(initialData, displayTemplates)
        const defaultTemplate = displayTemplates[0] || templates.find(template => template.selected) || templates[0]
        setLongTemplates(displayTemplates)
        setSelectedLongTemplateColors(Object.fromEntries(displayTemplates.map(template => [template.id, getDefaultTemplateColor(template)])))
        const requestedChoice = autoTemplateChoiceRef.current
        if (requestedChoice?.templateName) {
          autoTemplateChoiceRef.current = null
          const requestedTemplate = templates.find(template => template.name === requestedChoice.templateName) || defaultTemplate
          const requestedColor = requestedTemplate?.colors?.find(color => normalizeColorValue(color) === normalizeColorValue(requestedChoice.color))
          const color = getColorValue(requestedColor) || getDefaultTemplateColor(requestedTemplate)
          const colorIndex = Math.max(0, requestedTemplate?.colors?.findIndex(item => normalizeColorValue(item) === normalizeColorValue(color)) ?? 0)
          generatingLongTemplateChoiceRef.current = { name: requestedTemplate?.name || '', color }
          setSelectedLongTemplateId(requestedTemplate?.id || '')
          setSelectedLongTemplateColors(current => ({ ...current, [requestedTemplate?.id]: color }))
          return Promise.resolve({ templateId: requestedTemplate?.id || '', colorIndex, color })
        }
        setSelectedLongTemplateId(defaultTemplate?.id || '')
        templateScrollTopRef.current = 0
        setShowLongTemplatePicker(true)
        selectionStartedAt = Date.now()
        updateElapsed()
        return new Promise((resolve, reject) => {
          templateRequestRef.current = {
            owner: controller,
            resolve: templateChoice => {
              if (selectionStartedAt) {
                excludedElapsed += Date.now() - selectionStartedAt
                selectionStartedAt = 0
              }
              updateElapsed()
              resolve(templateChoice)
            },
            reject
          }
        })
      },
      signal: controller.signal
    })
      .then(nextCards => {
        if (!active) return
        window.clearInterval(elapsedTimer)
        const generatedTemplate = generatingLongTemplateChoiceRef.current
        let resolvedCards = nextCards
        let selectedCardId = (nextCards.find(card => card.active) || nextCards[0])?.id || ''
        if (isLongArticle && generatedTemplate?.name && nextCards.length > 0) {
          cacheXiaohongshuLongTemplateCards(initialData, generatedTemplate.name, generatedTemplate.color, nextCards)
        } else if (!isLongArticle && nextCards.length > 0) {
          cacheXiaohongshuCards(initialData, resolvedCards)
        }
        setCards(resolvedCards)
        setSelectedId(selectedCardId)
        setStatus('ready')
      })
      .catch(error => {
        if (!active) return
        window.clearInterval(elapsedTimer)
        console.error(isLongArticle ? '生成小红书长文图片失败' : '生成小红书卡片失败', error)
        setErrorCode(getXiaohongshuErrorCode(error))
        setErrorDetails(getXiaohongshuErrorDetails(error))
        setStatus('error')
      })
    return () => {
      active = false
      window.clearInterval(elapsedTimer)
      controller.abort()
      const pendingTemplate = templateRequestRef.current
      if (pendingTemplate?.owner === controller) {
        templateRequestRef.current = null
        pendingTemplate.reject(new Error('FLASH_NOTE_XHS:CANCELLED'))
      }
    }
  }, [initialData, isLongArticle, language, runId])

  const selectedCard = useMemo(
    () => cards.find(card => card.id === selectedId) || cards[0] || null,
    [cards, selectedId]
  )

  const selectedLongTemplate = useMemo(
    () => longTemplates.find(template => template.id === selectedLongTemplateId) || null,
    [longTemplates, selectedLongTemplateId]
  )

  const selectedLongTemplateColor = selectedLongTemplateColors[selectedLongTemplateId] || getDefaultTemplateColor(selectedLongTemplate)

  useEffect(() => {
    if (cards.length > 0) cardsRef.current = cards
  }, [cards])

  useEffect(() => () => {
    const controller = colorChangeControllerRef.current
    colorChangeControllerRef.current = null
    controller?.abort()
  }, [])

  useEffect(() => {
    if (status !== 'ready' || showLongTemplatePicker || cards.length === 0) return undefined
    const preferredCardId = preferredReadyCardIdRef.current
    preferredReadyCardIdRef.current = ''
    const focusCard = cards.find(card => card.id === preferredCardId) || cards[0]
    setSelectedId(focusCard.id)
    const frame = window.requestAnimationFrame(() => {
      const focusOption = cardOptionRefs.current.get(focusCard.id)
      focusOption?.focus({ preventScroll: true })
      focusOption?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [cards, showLongTemplatePicker, status])

  useEffect(() => {
    if (status !== 'ready' || showLongTemplatePicker || !selectedId) return undefined
    const frame = window.requestAnimationFrame(() => {
      cardOptionRefs.current.get(selectedId)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedId, showLongTemplatePicker, status])

  useEffect(() => {
    if (!showLongTemplatePicker || !selectedLongTemplateId) return undefined
    const frame = window.requestAnimationFrame(() => {
      if (templateGridRef.current) templateGridRef.current.scrollTop = templateScrollTopRef.current
      templateOptionRefs.current.get(selectedLongTemplateId)?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [selectedLongTemplateId, showLongTemplatePicker])

  const confirmLongTemplate = useCallback(() => {
    const pendingTemplate = templateRequestRef.current
    if (!selectedLongTemplate) return
    if (templateGridRef.current) templateScrollTopRef.current = templateGridRef.current.scrollTop
    setShowLongTemplatePicker(false)
    if (pendingTemplate) {
      templateRequestRef.current = null
      const colorIndex = Math.max(0, selectedLongTemplate.colors?.findIndex(color => normalizeColorValue(color) === normalizeColorValue(selectedLongTemplateColor)) ?? 0)
      generatingLongTemplateChoiceRef.current = { name: selectedLongTemplate.name, color: selectedLongTemplateColor }
      cacheXiaohongshuSelection(initialData, { templateName: selectedLongTemplate.name, templateColor: selectedLongTemplateColor })
      pendingTemplate.resolve({ templateId: selectedLongTemplate.id, colorIndex, color: selectedLongTemplateColor })
      return
    }
    if (status !== 'ready') return
    const cachedCards = getXiaohongshuPreviewCache(initialData)?.longTemplateCards.get(
      getXiaohongshuLongVariantKey(selectedLongTemplate.name, selectedLongTemplateColor)
    )
    if (cachedCards?.length) {
      setCards(cachedCards)
      setSelectedId((cachedCards.find(card => card.active) || cachedCards[0])?.id || '')
      setFailedImages(new Set())
      setFailedPreviews(new Set())
      cacheXiaohongshuSelection(initialData, { templateName: selectedLongTemplate.name, templateColor: selectedLongTemplateColor })
      return
    }
    autoTemplateChoiceRef.current = { templateName: selectedLongTemplate.name, color: selectedLongTemplateColor }
    setStatus('working')
    setRunId(value => value + 1)
  }, [initialData, selectedLongTemplate, selectedLongTemplateColor, status])

  useEffect(() => {
    if (status === 'ready' && selectedId) cacheXiaohongshuSelection(initialData, { cardId: selectedId })
  }, [initialData, selectedId, status])

  const returnToLongTemplates = useCallback(() => {
    if (!isLongArticle || longTemplates.length === 0) return
    setShowLongTemplatePicker(true)
  }, [isLongArticle, longTemplates.length])

  const selectLongTemplateByKeyboard = useCallback((event, currentIndex) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      confirmLongTemplate()
      return
    }
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    const grid = templateGridRef.current
    if (!grid) return
    const columnCount = Math.max(1, String(window.getComputedStyle(grid).gridTemplateColumns || '').trim().split(/\s+/).filter(Boolean).length)
    const offset = event.key === 'ArrowLeft'
      ? -1
      : event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' ? -columnCount : columnCount
    const nextIndex = Math.max(0, Math.min(longTemplates.length - 1, currentIndex + offset))
    event.preventDefault()
    const nextTemplate = longTemplates[nextIndex]
    if (!nextTemplate) return
    setSelectedLongTemplateId(nextTemplate.id)
    const nextOption = templateOptionRefs.current.get(nextTemplate.id)
    nextOption?.focus()
    nextOption?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [confirmLongTemplate, longTemplates])

  const selectLongTemplateColor = useCallback((event, template, color) => {
    event.stopPropagation()
    const colorValue = getColorValue(color)
    setSelectedLongTemplateId(template.id)
    setSelectedLongTemplateColors(current => ({ ...current, [template.id]: colorValue }))
  }, [])

  const selectCardByKeyboard = useCallback((event, focusThumbnail) => {
    if (busy) return
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    const currentIndex = Math.max(0, cards.findIndex(card => card.id === selectedCard?.id))
    let offset
    if (focusThumbnail) {
      const grid = cardGridRef.current
      const columnCount = grid
        ? Math.max(1, String(window.getComputedStyle(grid).gridTemplateColumns || '').trim().split(/\s+/).filter(Boolean).length)
        : 1
      offset = event.key === 'ArrowLeft'
        ? -1
        : event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp' ? -columnCount : columnCount
    } else {
      offset = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
    }
    event.preventDefault()
    const nextIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + offset))
    const nextCard = cards[nextIndex]
    if (!nextCard) return
    setSelectedId(nextCard.id)
    const nextOption = cardOptionRefs.current.get(nextCard.id)
    if (focusThumbnail) nextOption?.focus()
    nextOption?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [busy, cards, selectedCard])

  const changeCardColor = useCallback(async () => {
    if (isLongArticle || status !== 'ready' || busy || !selectedCard) return
    const changes = (cardColorOffsetsRef.current.get(selectedCard.name) || 0) + 1
    const request = {
      cardName: selectedCard.name,
      cardIndex: selectedCard.index,
      changes
    }
    const controller = new AbortController()
    colorChangeControllerRef.current = controller
    setBusy('color')
    try {
      const nextCards = await generateXiaohongshuCards({
        title: initialData.title,
        content: initialData.content,
        editorMode: initialData.editorMode,
        generationType: 'cards',
        windowTitle: t(language, 'share.xhs.title'),
        cardColorRequest: request,
        onProgress: nextProgress => {
          if (colorChangeControllerRef.current === controller) setProgress(nextProgress)
        },
        signal: controller.signal
      })
      if (controller.signal.aborted || colorChangeControllerRef.current !== controller) return
      const replacement = nextCards.find(card => card.name === request.cardName)
      if (!replacement) throw new Error('FLASH_NOTE_XHS:NO_IMAGES|color-card-result')
      const currentCards = cardsRef.current
      const mergedCards = currentCards.map(card => card.name === request.cardName ? replacement : card)
      if (!mergedCards.some(card => card.id === replacement.id)) throw new Error('FLASH_NOTE_XHS:NO_IMAGES|color-card-merge')
      preferredReadyCardIdRef.current = replacement.id
      cardColorOffsetsRef.current.set(request.cardName, changes)
      cacheXiaohongshuCardColorOffset(initialData, request.cardName, changes)
      cacheXiaohongshuCards(initialData, mergedCards)
      setFailedImages(current => {
        const next = new Set(current)
        next.delete(selectedCard.id)
        next.delete(replacement.id)
        return next
      })
      setFailedPreviews(current => {
        const next = new Set(current)
        next.delete(selectedCard.id)
        next.delete(replacement.id)
        return next
      })
      setCards(mergedCards)
      setSelectedId(replacement.id)
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('切换小红书卡片配色失败', error)
      const messageKey = getXiaohongshuErrorCode(error) === 'CARD_COLOR_UNAVAILABLE'
        ? 'share.xhs.changeColorUnavailable'
        : 'share.xhs.changeColorFailed'
      onNotify(t(language, messageKey), 'error')
    } finally {
      if (colorChangeControllerRef.current === controller) {
        colorChangeControllerRef.current = null
        setBusy('')
      }
    }
  }, [busy, initialData, isLongArticle, language, onNotify, selectedCard, status])

  const saveSelected = useCallback(async () => {
    const services = window.imageServices
    const saveAllPages = isLongArticle && cards.length > 1
    const saveServiceAvailable = saveAllPages ? services?.savePngPages : services?.saveImage
    if (!selectedCard || !services?.fetchXhsImage || !saveServiceAvailable) {
      onNotify(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy('save')
    try {
      let saved
      if (saveAllPages) {
        const images = await Promise.all(cards.map(card => services.fetchXhsImage(card.url)))
        if (images.some(image => image.format !== 'png')) throw new Error('小红书长文页面必须是 PNG 图片')
        const defaultName = buildFilenameBase(initialData, {
          name: selectedLongTemplate?.name || cards[0]?.name
        }, language)
        saved = await services.savePngPages(defaultName, images.map(image => image.bytes), imageSaveDirectory)
      } else {
        const image = await services.fetchXhsImage(selectedCard.url)
        const defaultName = `${buildFilenameBase(initialData, selectedCard, language)}.${image.format}`
        saved = await services.saveImage(defaultName, image.format, image.bytes, imageSaveDirectory)
      }
      if (!saved) return
      onNotify(saveAllPages
        ? t(language, 'share.savedMany', { count: cards.length })
        : t(language, 'share.saved'))
      onExported?.()
    } catch (error) {
      console.error(isLongArticle ? '保存小红书长文图片失败' : '保存小红书卡片失败', error)
      onNotify(t(language, isLongArticle ? 'share.xhs.longDownloadFailed' : 'share.xhs.downloadFailed'), 'error')
    } finally {
      setBusy('')
    }
  }, [cards, imageSaveDirectory, initialData, isLongArticle, language, onExported, onNotify, selectedCard, selectedLongTemplate])

  const copySelected = useCallback(async () => {
    const services = window.imageServices
    if (!selectedCard || !services?.fetchXhsImage || !services?.copyImage) {
      onNotify(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy('copy')
    try {
      const image = await services.fetchXhsImage(selectedCard.url)
      if (!(await services.copyImage(image.bytes))) throw new Error('复制图片服务返回失败')
      onNotify(t(language, 'share.copied'))
      onExported?.()
    } catch (error) {
      console.error(isLongArticle ? '复制小红书长文图片失败' : '复制小红书卡片失败', error)
      onNotify(t(language, 'share.copyFailed'), 'error')
    } finally {
      setBusy('')
    }
  }, [isLongArticle, language, onExported, onNotify, selectedCard])

  const retry = () => setRunId(value => value + 1)
  const regenerate = () => {
    autoTemplateChoiceRef.current = null
    if (!isLongArticle) {
      cardColorOffsetsRef.current = new Map()
      clearXiaohongshuCardColorOffsets(initialData)
    }
    setRunId(value => value + 1)
  }
  const errorKey = `share.xhs.${isLongArticle ? 'longErrors' : 'errors'}.${errorCode || 'UNKNOWN'}`
  const copyErrorDetails = useCallback(async () => {
    if (!errorDetails) return
    try {
      if (window.utools?.copyText) {
        if (!window.utools.copyText(errorDetails)) throw new Error('uTools 复制文本失败')
      } else {
        await navigator.clipboard.writeText(errorDetails)
      }
      onNotify(t(language, 'notice.copied'))
    } catch (error) {
      console.error('复制小红书诊断日志失败', error)
      onNotify(t(language, 'notice.copyFailed'), 'error')
    }
  }, [errorDetails, language, onNotify])

  const progressKey = getProgressKey(progress.stage, isLongArticle)
  const isLoginStage = progressKey === 'login'

  return (
    <div className="xhs-studio">
      <StudioHeader
        title={t(language, isLongArticle ? 'share.xhs.longTitle' : 'share.xhs.title')}
        icon={<BrandIcon brand="xiaohongshu" />}
        closeLabel={t(language, 'common.close')}
        onClose={onClose}
        actions={status === 'ready' && !showLongTemplatePicker ? (
          <>
            {isLongArticle && longTemplates.length > 0 ? (
              <Button className="xhs-long-template-back-action" variant="outlined" size="small" startIcon={<ArrowBackOutlinedIcon />} disabled={Boolean(busy)} onClick={returnToLongTemplates}>
                {t(language, 'guide.back')}
              </Button>
            ) : null}
            {!isLongArticle ? (
              <Button
                className="xhs-card-color-action"
                variant="outlined"
                size="small"
                startIcon={busy === 'color' ? <CircularProgress size={14} /> : <PaletteOutlinedIcon />}
                disabled={Boolean(busy) || !selectedCard}
                onClick={changeCardColor}
              >
                {t(language, busy === 'color' ? 'share.xhs.changingColor' : 'share.xhs.changeColor')}
              </Button>
            ) : null}
            <Button className="share-studio-secondary-action" variant="outlined" size="small" startIcon={<RefreshOutlinedIcon />} disabled={Boolean(busy)} onClick={regenerate}>
              {t(language, 'share.xhs.regenerate')}
            </Button>
            <Button className="share-studio-download-action" variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} disabled={Boolean(busy) || !selectedCard} onClick={saveSelected}>
              {busy === 'save' ? t(language, 'share.xhs.saving') : t(language, 'share.xhs.save')}
            </Button>
            <IconButton
              className="share-studio-copy-action"
              size="small"
              disabled={Boolean(busy) || !selectedCard}
              onClick={copySelected}
              aria-label={t(language, 'share.note.copy')}
            >
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        ) : null}
      />

      {status === 'working' && !showLongTemplatePicker ? (
        <main className="xhs-studio-state" aria-live="polite">
          <div className="xhs-studio-state-core">
            <span className="xhs-studio-spinner-slot"><CircularProgress size={30} /></span>
            <strong className="xhs-studio-state-title">
              {t(language, `share.xhs.progress.${progressKey}`)}
            </strong>
          </div>
          <div className="xhs-studio-state-details">
            <code className="xhs-studio-progress-meta" title={progress.detail || progress.stage}>
              {progress.stage} · {elapsedSeconds}s
            </code>
            <code className="xhs-studio-progress-detail" title={progress.detail || undefined}>
              {progress.detail || '\u00a0'}
            </code>
            <span className="xhs-studio-login-hint" aria-hidden={!isLoginStage}>
              {isLoginStage ? t(language, 'share.xhs.loginHint') : '\u00a0'}
            </span>
          </div>
        </main>
      ) : null}

      {showLongTemplatePicker && longTemplates.length > 0 ? (
        <main className="xhs-long-template-picker" aria-live="polite">
          <header className="xhs-long-template-heading">
            <strong>{t(language, 'share.xhs.chooseLongTemplate')}</strong>
            <span>{t(language, 'share.xhs.chooseLongTemplateHint')}</span>
          </header>
          <div
            className="xhs-long-template-grid"
            ref={templateGridRef}
            onScroll={event => { templateScrollTopRef.current = event.currentTarget.scrollTop }}
          >
            {longTemplates.map((template, index) => (
              <div
                className={`xhs-long-template-option${template.id === selectedLongTemplateId ? ' is-selected' : ''}`}
                key={template.id}
                onClick={() => setSelectedLongTemplateId(template.id)}
                onKeyDown={event => selectLongTemplateByKeyboard(event, index)}
                ref={element => {
                  if (element) templateOptionRefs.current.set(template.id, element)
                  else templateOptionRefs.current.delete(template.id)
                }}
                tabIndex={template.id === selectedLongTemplateId ? 0 : -1}
                role="button"
                aria-pressed={template.id === selectedLongTemplateId}
              >
                <span className="xhs-long-template-covers">
                  {template.covers.map((cover, index) => (
                    <img key={`${template.id}-${index}`} src={cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ))}
                </span>
                <span className="xhs-long-template-meta">
                  <strong>{template.name}</strong>
                  <span className="xhs-long-template-colors">
                    {(template.colors || []).slice(0, 8).map((color, index) => (
                      <button
                        type="button"
                        className={normalizeColorValue(color) === normalizeColorValue(selectedLongTemplateColors[template.id] || getDefaultTemplateColor(template)) ? 'is-selected' : ''}
                        key={`${template.id}-color-${index}`}
                        style={{ backgroundColor: getColorValue(color) }}
                        title={getColorValue(color)}
                        aria-label={getColorValue(color)}
                        aria-pressed={normalizeColorValue(color) === normalizeColorValue(selectedLongTemplateColors[template.id] || getDefaultTemplateColor(template))}
                        onClick={event => selectLongTemplateColor(event, template, color)}
                        onKeyDown={event => event.stopPropagation()}
                      />
                    ))}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <footer className="xhs-long-template-actions">
            <code className="xhs-studio-progress-meta">{progress.stage} · {elapsedSeconds}s</code>
            <span className="xhs-long-template-selected-summary">
              {selectedLongTemplateColor ? <i style={{ backgroundColor: selectedLongTemplateColor }} aria-hidden="true" /> : null}
              <strong className="xhs-long-template-selected-name" aria-live="polite" title={selectedLongTemplate?.name || ''}>
                {selectedLongTemplate?.name || ''}
              </strong>
            </span>
            <Button
              className="share-studio-download-action"
              variant="outlined"
              size="small"
              startIcon={<CheckOutlinedIcon />}
              disabled={!selectedLongTemplate}
              onClick={confirmLongTemplate}
            >
              {t(language, 'share.xhs.useLongTemplate')}
            </Button>
          </footer>
        </main>
      ) : null}

      {status === 'error' ? (
        <main className="xhs-studio-state is-error" aria-live="polite">
          <div className="xhs-studio-state-core">
            <span className="xhs-studio-state-icon-slot"><AutoAwesomeOutlinedIcon className="xhs-studio-state-icon" /></span>
            <strong className="xhs-studio-state-title">
              {t(language, isLongArticle ? 'share.xhs.longFailed' : 'share.xhs.failed')}
            </strong>
          </div>
          <div className="xhs-studio-state-details is-error-details">
            <span className="xhs-studio-state-message">{t(language, errorKey)}</span>
            <div className="xhs-studio-error-actions">
              <Button variant="outlined" size="small" startIcon={<RefreshOutlinedIcon />} onClick={retry}>
                {t(language, 'share.xhs.retry')}
              </Button>
              <Button variant="outlined" size="small" startIcon={<ContentCopyOutlinedIcon />} onClick={copyErrorDetails}>
                {t(language, 'error.copyDetails')}
              </Button>
            </div>
            <div className="xhs-studio-diagnostics-slot">
              {errorDetails ? (
                <section className="xhs-studio-diagnostics" aria-label={t(language, 'error.details')}>
                  <strong>{t(language, 'error.details')}</strong>
                  <pre>{errorDetails}</pre>
                </section>
              ) : null}
            </div>
          </div>
        </main>
      ) : null}

      {status === 'ready' && !showLongTemplatePicker && selectedCard ? (
        <main className="xhs-studio-content">
          <aside className="xhs-card-browser" aria-label={t(language, isLongArticle ? 'share.xhs.longTemplates' : 'share.xhs.templates')}>
            <div className="xhs-card-browser-heading">
              <strong>{t(language, isLongArticle ? 'share.xhs.longTemplates' : 'share.xhs.templates')}</strong>
              <span>{t(language, 'share.xhs.count', { count: cards.length })}</span>
            </div>
            <div
              className="xhs-card-grid"
              ref={cardGridRef}
              onKeyDown={event => selectCardByKeyboard(event, true)}
            >
              {cards.map(card => (
                <button
                  type="button"
                  className={`xhs-card-option${card.id === selectedCard.id ? ' is-selected' : ''}`}
                  key={card.id}
                  onClick={() => { if (!busy) setSelectedId(card.id) }}
                  ref={element => {
                    if (element) cardOptionRefs.current.set(card.id, element)
                    else cardOptionRefs.current.delete(card.id)
                  }}
                  tabIndex={card.id === selectedCard.id ? 0 : -1}
                  aria-pressed={card.id === selectedCard.id}
                  aria-disabled={busy === 'color'}
                >
                  <span className="xhs-card-option-image">
                    {!failedImages.has(card.id) ? (
                      <img
                        src={card.url}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => setFailedImages(current => new Set(current).add(card.id))}
                      />
                    ) : <AutoAwesomeOutlinedIcon />}
                  </span>
                  <span>{card.name}</span>
                </button>
              ))}
            </div>
          </aside>
          <section
            className="xhs-card-preview"
            tabIndex={0}
            aria-label={selectedCard.name}
            onKeyDown={event => selectCardByKeyboard(event, false)}
          >
            <div className={`xhs-card-preview-stage${busy === 'color' ? ' is-color-waiting' : ''}`} ref={previewZoom.viewportRef}>
              {!failedPreviews.has(selectedCard.id) ? (
                <img
                  key={selectedCard.id}
                  src={selectedCard.url}
                  alt={selectedCard.name}
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  data-preview-pan-content=""
                  data-preview-pan-contained-image=""
                  referrerPolicy="no-referrer"
                  style={{
                    height: `${previewZoom.zoom * 100}%`,
                    transform: `translate3d(${previewZoom.panOffset.x}px, ${previewZoom.panOffset.y}px, 0) translate(-50%, -50%)`,
                    width: `${previewZoom.zoom * 100}%`
                  }}
                  onError={() => setFailedPreviews(current => new Set(current).add(selectedCard.id))}
                />
              ) : (
                <div className="xhs-card-preview-error">
                  <AutoAwesomeOutlinedIcon />
                  <span>{t(language, isLongArticle ? 'share.xhs.longPreviewFailed' : 'share.xhs.previewFailed')}</span>
                </div>
              )}
              <PreviewResetButton
                label={t(language, 'share.social.reset')}
                onReset={previewZoom.reset}
                visible={previewZoom.isModified}
              />
            </div>
            <div className="xhs-card-preview-caption">{selectedCard.name}</div>
          </section>
        </main>
      ) : null}
    </div>
  )
}

export default memo(XiaohongshuImageStudio)
