import { memo, useCallback, useEffect, useRef, useState } from 'react'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import PreviewResetButton from './PreviewResetButton.jsx'
import { StudioControl, StudioHeader } from './ShareStudioChrome.jsx'
import { usePreviewFit } from './usePreviewFit'
import { readGeneratedImage, readGeneratedImageDataUrl } from '../services/imageIO'
import { normalizeAiModelSelection } from '../services/aiService'
import { analyzeReferenceImage, shouldUseCurrentImageReference, startImageGeneration } from '../services/aiWorkflows'
import { explainHostAiError } from '../services/host'
import { t } from '../locales'

function GeneratedImageStudio ({ aiImageGenerationPrompt = '', aiModel = '', content = '', directAi = null, imageSaveDirectory = '', initialData, language, onClose, onExported, onNotify }) {
  const initialPrompt = String(initialData?.generationPrompt || '')
  const [currentImage, setCurrentImage] = useState(initialData?.image || null)
  const [imageTask, setImageTask] = useState('refine')
  const [prompts, setPrompts] = useState({ refine: '', regenerate: initialPrompt })
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const previewFit = usePreviewFit()
  const resetPreview = previewFit.reset
  const activeRequestRef = useRef(null)
  const prompt = prompts[imageTask] || ''
  // 当对象同时包含多个地址时，优先使用已规范化的内嵌数据。这样旧的远程 `src`
  // 不会遮蔽模型刚返回的有效 data URL。
  const source = currentImage?.dataUrl || currentImage?.src || currentImage?.url || ''
  const title = String(initialData?.title || '').trim() || t(language, 'ai.generateImage')

  useEffect(() => {
    setCurrentImage(initialData?.image || null)
    setImageTask('refine')
    setPrompts({ refine: '', regenerate: initialPrompt })
    setBusy('')
    setError('')
    resetPreview()
  }, [initialData?.image, initialPrompt, resetPreview])

  useEffect(() => () => {
    activeRequestRef.current?.abort?.()
    activeRequestRef.current = null
  }, [])

  const refineImage = useCallback(async () => {
    if (busy) return
    if (!prompt.trim()) {
      setError(t(language, 'ai.inputRequired'))
      return
    }
    if (!currentImage) {
      setError(t(language, 'ai.imageOutputUnavailable'))
      return
    }
    const requestId = Symbol('generated-image-request')
    setBusy('generation')
    setError('')
    activeRequestRef.current = { requestId }
    try {
      // “重新生成”从原始条目和提示词重新开始；只有“继续生成”才会把当前图片
      // 作为参考图传入服务商的图片编辑接口。
      const referenceDataUrl = shouldUseCurrentImageReference(imageTask)
        ? await readGeneratedImageDataUrl(currentImage)
        : ''
      if (activeRequestRef.current?.requestId !== requestId) return
      const referenceAnalysis = referenceDataUrl
        ? await analyzeReferenceImage(referenceDataUrl)
        : ''
      if (activeRequestRef.current?.requestId !== requestId) return
      const operation = startImageGeneration({
        model: normalizeAiModelSelection(aiModel),
        prompt,
        content,
        systemPrompt: String(aiImageGenerationPrompt || '').trim() || t(language, 'ai.imageGenerationSystem'),
        referenceDataUrl,
        referenceAnalysis,
        imageTask,
        direct: directAi
      })
      activeRequestRef.current.abort = operation.abort
      const response = await operation
      if (activeRequestRef.current?.requestId !== requestId) return
      const image = response?.images?.[0]
      if (!image) throw new Error(t(language, directAi?.enabled ? 'ai.imageOutputUnavailableDirect' : 'ai.imageOutputUnavailable'))
      setCurrentImage(image)
      if (imageTask === 'refine') setPrompts(current => ({ ...current, refine: '' }))
      resetPreview()
    } catch (requestError) {
      if (activeRequestRef.current?.requestId !== requestId || requestError?.code === 'AI_ABORTED') return
      console.error('AI 图片继续生成失败', requestError)
      setError(explainHostAiError(requestError, t, language, normalizeAiModelSelection(aiModel)))
    } finally {
      if (activeRequestRef.current?.requestId === requestId) {
        activeRequestRef.current = null
        setBusy('')
      }
    }
  }, [aiImageGenerationPrompt, aiModel, busy, content, currentImage, directAi, imageTask, language, prompt, resetPreview])

  const cancelRefine = () => {
    activeRequestRef.current?.abort?.()
    activeRequestRef.current = null
    setBusy('')
  }

  const updatePrompt = event => {
    const value = event.target.value
    setPrompts(current => ({ ...current, [imageTask]: value }))
  }

  const changeImageTask = (_, value) => {
    if (!value || busy) return
    setImageTask(value)
    setError('')
  }

  const exportImage = useCallback(async mode => {
    if (!currentImage || busy) return
    const services = window.imageServices
    if (mode === 'save' && !services?.saveImage) {
      onNotify?.(t(language, 'share.unavailable'), 'warning')
      return
    }
    if (mode === 'copy' && !services?.copyImage) {
      onNotify?.(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy(mode)
    setError('')
    try {
      const image = await readGeneratedImage(currentImage)
      if (mode === 'save') {
        const saved = await services.saveImage(title, image.format, image.bytes, imageSaveDirectory)
        if (!saved) return
        onNotify?.(t(language, 'share.saved'))
      } else {
        if (!(await services.copyImage(image.bytes))) throw new Error('复制图片失败')
        onNotify?.(t(language, 'share.copied'))
      }
      onExported?.()
    } catch (exportError) {
      console.error('导出 AI 生成图片失败', exportError)
      onNotify?.(t(language, 'share.failed'), 'error')
    } finally {
      setBusy('')
    }
  }, [busy, currentImage, imageSaveDirectory, language, onExported, onNotify, title])

  return (
    <div className="share-note-studio">
      <StudioHeader
        title={t(language, 'ai.generatedImageWorkbench')}
        icon={<ImageOutlinedIcon fontSize="small" />}
        closeLabel={t(language, 'common.close')}
        onClose={onClose}
        actions={(
          <>
            <Button className="share-studio-download-action" variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} disabled={Boolean(busy) || !source} onClick={() => exportImage('save')}>
              {t(language, 'share.saveButton')}
            </Button>
            <IconButton className="share-studio-copy-action" size="small" disabled={Boolean(busy) || !source} onClick={() => exportImage('copy')} aria-label={t(language, 'share.note.copy')}>
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      />
      <div className="share-note-workspace">
        <div className="share-note-controls-wrap">
          <div className="share-note-controls">
            <StudioControl label={t(language, 'ai.imageEditMode')}>
              <ToggleButtonGroup className="share-studio-toggle-group generated-image-mode-toggle" exclusive value={imageTask} onChange={changeImageTask} aria-label={t(language, 'ai.imageEditMode')}>
                <ToggleButton value="refine">{t(language, 'ai.refineImage')}</ToggleButton>
                <ToggleButton value="regenerate">{t(language, 'ai.retry')}</ToggleButton>
              </ToggleButtonGroup>
            </StudioControl>
            <StudioControl label={t(language, imageTask === 'refine' ? 'ai.refineImage' : 'ai.generateImage')}>
              <TextField
                className="generated-image-prompt"
                fullWidth
                multiline
                minRows={5}
                maxRows={12}
                value={prompt}
                onChange={updatePrompt}
                onKeyDown={event => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && prompt.trim() && !busy) refineImage()
                }}
                disabled={Boolean(busy)}
                placeholder={t(language, imageTask === 'refine' ? 'ai.refineImagePlaceholder' : 'ai.imageGenerationPlaceholder')}
                inputProps={{ 'aria-label': t(language, imageTask === 'refine' ? 'ai.refineImagePlaceholder' : 'ai.imageGenerationPlaceholder') }}
              />
            </StudioControl>
            {error ? <div className="generated-image-error" role="alert">{error}</div> : null}
            <Button
              fullWidth
              variant="contained"
              startIcon={busy === 'generation' ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeOutlinedIcon />}
              disabled={(!prompt.trim() && busy !== 'generation') || (Boolean(busy) && busy !== 'generation')}
              onClick={busy === 'generation' ? cancelRefine : refineImage}
            >
              {busy === 'generation' ? t(language, 'ai.cancel') : t(language, imageTask === 'refine' ? 'ai.refineImage' : 'ai.retry')}
            </Button>
          </div>
        </div>
        <div className="share-note-preview" ref={previewFit.viewportRef}>
          <div className="share-note-preview-scaler" style={previewFit.frameStyle}>
            <div className="share-note-preview-content generated-image-preview-content" data-preview-pan-content="" ref={previewFit.contentRef} style={previewFit.contentStyle}>
              {source ? <Box component="img" src={source} alt={title} draggable={false} /> : null}
            </div>
          </div>
          <PreviewResetButton label={t(language, 'share.social.reset')} onReset={previewFit.reset} visible={previewFit.isModified} />
        </div>
      </div>
    </div>
  )
}

export default memo(GeneratedImageStudio)
