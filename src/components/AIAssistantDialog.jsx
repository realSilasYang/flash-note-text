import { memo, useEffect, useRef, useState } from 'react'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Tooltip from './ActionTooltip'
import { t } from '../locales'
import { explainHostAiError } from '../services/host'
import { readGeneratedImage } from '../services/imageIO'
import { isAiAbortError, normalizeAiModelSelection } from '../services/aiService'
import { analyzeReferenceImage, startFormatting, startImageGeneration, validateFormattingResult } from '../services/aiWorkflows'

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/tiff', 'image/svg+xml'])

function readFileAsDataUrl (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('无法读取图片'))
    reader.readAsDataURL(file)
  })
}

function AIAssistantDialog ({ aiFormattingPrompt, aiImageGenerationPrompt, aiModel, content, directAi = null, imageSaveDirectory = '', isDark = false, language, mode = 'formatting', onApply, onClose, onNotify, onOpenImageWorkbench, onOpenPluginAiSettings, open, title }) {
  const isImageGeneration = mode === 'image-generation'
  const [prompt, setPrompt] = useState('')
  const [reference, setReference] = useState(null)
  const [result, setResult] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [generatedImage, setGeneratedImage] = useState(null)
  const requestIdRef = useRef(0)
  const activeRequestRef = useRef(null)
  const referenceInputRef = useRef(null)
  const hasReference = Boolean(reference?.dataUrl)

  useEffect(() => {
    if (!open) {
      activeRequestRef.current?.abort?.()
      activeRequestRef.current = null
      requestIdRef.current += 1
      return undefined
    }
    setPrompt('')
    setReference(null)
    setResult('')
    setReasoning('')
    setError('')
    setBusy(false)
    setGeneratedImage(null)
    return () => {
      activeRequestRef.current?.abort?.()
      activeRequestRef.current = null
      requestIdRef.current += 1
    }
  }, [mode, open])

  const chooseReference = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const prepareReferenceImage = window.imageServices?.prepareReferenceImage
      let selected
      if (typeof prepareReferenceImage === 'function') {
        const prepared = await prepareReferenceImage(await file.arrayBuffer())
        selected = { name: file.name, dataUrl: prepared.dataUrl }
      } else {
        if (!IMAGE_TYPES.has(file.type)) throw new Error('IMAGE_INVALID')
        selected = { name: file.name, dataUrl: await readFileAsDataUrl(file) }
      }
      setReference(selected)
      setResult('')
      setReasoning('')
      setGeneratedImage(null)
      setError('')
    } catch {
      setError(t(language, 'ai.imageInvalid'))
    }
  }

  const openReferencePicker = async () => {
    if (busy) return
    const chooseImageFile = window.fileServices?.chooseImageFile
    const detachMessage = t(language, 'ai.fileDialogDetachFailed')
    const prepareFileDialog = window.fileServices?.prepareFileDialog
    if (typeof prepareFileDialog === 'function' && !(await prepareFileDialog(detachMessage))) {
      onNotify?.(detachMessage, 'warning')
      return
    }
    if (typeof chooseImageFile === 'function') {
      try {
        const selected = await chooseImageFile({
          detachRequired: detachMessage,
          title: t(language, 'ai.chooseReference'),
          imageFiles: t(language, 'share.imageFiles')
        })
        if (!selected) return
        setReference({ name: selected.name, dataUrl: selected.dataUrl })
        setResult('')
        setReasoning('')
        setGeneratedImage(null)
        setError('')
      } catch {
        setError(t(language, 'ai.imageInvalid'))
      }
      return
    }
    referenceInputRef.current?.click()
  }

  const run = async () => {
    if (busy) return
    if (!String(content || '').trim()) {
      setError(t(language, isImageGeneration ? 'ai.shareTextRequired' : 'ai.textRequired'))
      return
    }
    if (!prompt.trim()) {
      setError(t(language, 'ai.inputRequired'))
      return
    }
    const requestId = ++requestIdRef.current
    setBusy(true)
    setError('')
    setResult('')
    setReasoning('')
    setGeneratedImage(null)
    const system = isImageGeneration
      ? (String(aiImageGenerationPrompt || '').trim() || t(language, 'ai.imageGenerationSystem'))
      : (String(aiFormattingPrompt || '').trim() || t(language, 'ai.formattingSystem'))
    const model = normalizeAiModelSelection(aiModel)
    let operation = null
    try {
      const referenceAnalysis = reference && isImageGeneration ? await analyzeReferenceImage(reference.dataUrl) : ''
      if (requestId !== requestIdRef.current) return
      operation = isImageGeneration
        ? startImageGeneration({ model, prompt, content, systemPrompt: system, referenceDataUrl: reference?.dataUrl, referenceAnalysis, direct: directAi, onChunk: (_, stream) => {
            if (requestId === requestIdRef.current) {
              setResult(stream.content)
              setReasoning(stream.reasoning_content)
              if (stream.images?.length) setGeneratedImage(stream.images[0])
            }
          } })
        : startFormatting({ model, systemPrompt: system, prompt, content, onChunk: (_, stream) => {
              if (requestId === requestIdRef.current) {
                setResult(stream.content)
                setReasoning(stream.reasoning_content)
              }
            } })
      activeRequestRef.current = operation
      const response = await operation
      if (requestId !== requestIdRef.current) return
      const text = String(response?.content ?? '')
      if (response?.reasoning_content && requestId === requestIdRef.current) setReasoning(response.reasoning_content)
      if (isImageGeneration) {
        const image = response?.images?.[0]
        if (!image) throw new Error(t(language, directAi?.enabled ? 'ai.imageOutputUnavailableDirect' : 'ai.imageOutputUnavailable'))
        setGeneratedImage(image)
        if (text && text !== '[参考图已附加]') setResult(text)
        onOpenImageWorkbench?.(image, { prompt })
        return
      }
      if (!text) throw new Error(t(language, 'ai.invalidFormat'))
      const formatted = validateFormattingResult(text)
      if (!formatted) throw new Error(t(language, 'ai.invalidFormat'))
      setResult(formatted)
    } catch (requestError) {
      if (requestId === requestIdRef.current && !isAiAbortError(requestError)) setError(explainHostAiError(requestError, t, language, model))
    } finally {
      if (activeRequestRef.current === operation) activeRequestRef.current = null
      if (requestId === requestIdRef.current) setBusy(false)
    }
  }

  const cancel = () => {
    requestIdRef.current += 1
    activeRequestRef.current?.abort?.()
    activeRequestRef.current = null
    setResult('')
    setReasoning('')
    setGeneratedImage(null)
    setBusy(false)
  }

  const handleDialogClose = (_, reason) => {
    if (reason === 'escapeKeyDown') {
      if (busy) cancel()
      onClose?.()
      return
    }
    if (!busy) onClose?.()
  }

  const saveGeneratedImage = async () => {
    if (!generatedImage) return
    try {
      const services = window.imageServices
      if (!services?.saveImage) throw new Error('图片保存服务不可用')
      const image = await readGeneratedImage(generatedImage)
      const saved = await services.saveImage(t(language, 'ai.generateImage'), image.format, image.bytes, imageSaveDirectory)
      if (!saved) return
      onNotify?.(t(language, 'share.saved'))
    } catch (saveError) {
      console.error('保存 AI 生成图片失败', saveError)
      onNotify?.(t(language, 'share.failed'), 'error')
    }
  }

  const copyGeneratedImage = async () => {
    if (!generatedImage) return
    try {
      const services = window.imageServices
      if (!services?.copyImage) throw new Error('图片复制服务不可用')
      const image = await readGeneratedImage(generatedImage)
      if (!(await services.copyImage(image.bytes))) throw new Error('复制图片服务返回失败')
      onNotify?.(t(language, 'share.copied'))
    } catch (copyError) {
      console.error('复制 AI 生成图片失败', copyError)
      onNotify?.(t(language, 'share.copyFailed'), 'error')
    }
  }

  const promptLabel = isImageGeneration ? 'ai.generateImage' : 'ai.formatting'
  const promptPlaceholder = isImageGeneration ? 'ai.imageGenerationPlaceholder' : 'ai.inputPlaceholder'

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 400,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 32px)',
          m: 2,
          borderRadius: 3,
          bgcolor: isDark ? '#292929' : '#fff'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeOutlinedIcon color="primary" />
        <Box component="span" sx={{ minWidth: 0, flex: 1 }}>
          {title || t(language, isImageGeneration ? 'ai.generateImage' : 'ai.formatting')}
        </Box>
        {typeof onOpenPluginAiSettings === 'function' ? (
          <Tooltip title={t(language, 'ai.openPluginModelsSettings')}>
            <IconButton
              size="small"
              aria-label={t(language, 'ai.openPluginModelsSettings')}
              onClick={onOpenPluginAiSettings}
              sx={{
                width: 34,
                height: 34,
                color: 'text.secondary',
                opacity: 0.72,
                '&:hover': { opacity: 0.9 },
                '& .MuiSvgIcon-root': { width: 22, height: 22, fontSize: 22 }
              }}
            >
              <ChecklistOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : null}
      </DialogTitle>
      <DialogContent sx={{ flex: '0 0 auto', minHeight: 0, overflowY: 'visible', pb: hasReference ? undefined : 0.5 }}>
        <Stack spacing={1.5}>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={4}
            maxRows={8}
            label={t(language, promptLabel)}
            placeholder={t(language, promptPlaceholder)}
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            disabled={busy}
          />
          {isImageGeneration ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button variant="outlined" size="small" startIcon={<ImageOutlinedIcon />} onClick={openReferencePicker} disabled={busy}>
                {t(language, 'ai.chooseReference')}
              </Button>
              <input ref={referenceInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/tiff,image/svg+xml" onChange={chooseReference} />
              {hasReference ? <Typography variant="caption" color="text.secondary" noWrap sx={{ minWidth: 0, flex: 1 }}>{reference.name}</Typography> : null}
              {hasReference ? <IconButton size="small" aria-label={t(language, 'ai.removeReference')} onClick={() => { setReference(null); setResult(''); setReasoning(''); setGeneratedImage(null) }} disabled={busy}><CancelOutlinedIcon fontSize="small" /></IconButton> : null}
            </Stack>
          ) : null}
          {isImageGeneration && hasReference ? (
            <Box
              sx={{
                width: '100%',
                height: 128,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'action.hover'
              }}
            >
              <Box
                component="img"
                src={reference.dataUrl}
                alt={reference.name}
                draggable={false}
                sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
          ) : null}
          {error ? <Typography color="error" variant="body2">{error}</Typography> : null}
          {reasoning ? <details><summary>{t(language, 'ai.reasoning')}</summary><Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto', mt: 0.75 }}>{reasoning}</Typography></details> : null}
          {isImageGeneration && generatedImage ? (
            <Box sx={{ width: '100%', minHeight: 180, maxHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'action.hover' }}>
              <Box component="img" src={generatedImage.src} alt={t(language, 'ai.generateImage')} draggable={false} sx={{ display: 'block', maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }} />
            </Box>
          ) : null}
          {result ? <TextField fullWidth multiline minRows={5} maxRows={12} label={t(language, 'ai.result')} value={result} InputProps={{ readOnly: true }} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        <Button onClick={busy ? cancel : onClose} startIcon={busy ? <CancelOutlinedIcon /> : undefined}>{busy ? t(language, 'ai.cancel') : t(language, 'ai.close')}</Button>
        {generatedImage ? <Button variant="contained" startIcon={<DownloadOutlinedIcon />} onClick={saveGeneratedImage}>{t(language, 'share.saveButton')}</Button> : null}
        {generatedImage ? <Button variant="outlined" startIcon={<ContentCopyOutlinedIcon />} onClick={copyGeneratedImage}>{t(language, 'share.note.copy')}</Button> : null}
        {result && !isImageGeneration ? <Button variant="contained" startIcon={<CheckOutlinedIcon />} onClick={() => { onApply?.(result); onClose?.() }}>{t(language, 'ai.apply')}</Button> : null}
        <Button
          variant="outlined"
          startIcon={busy ? <CircularProgress size={16} /> : result || generatedImage ? <RefreshOutlinedIcon /> : undefined}
          onClick={run}
          disabled={busy}
          sx={{
            borderColor: '#4b4c4d',
            '&:hover, &:focus-visible': { borderColor: '#535956' }
          }}
        >
          {busy ? t(language, 'ai.processing') : result || generatedImage ? t(language, 'ai.retry') : t(language, isImageGeneration ? 'ai.generateImage' : 'ai.label')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(AIAssistantDialog)
