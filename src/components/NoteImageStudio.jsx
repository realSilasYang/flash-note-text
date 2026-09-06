import { memo, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter'
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft'
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight'
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined'
import { buildShareImageFilename, prepareShareImage, renderShareImagePage, SHARE_IMAGE_ASPECT_RATIOS, SHARE_IMAGE_TEMPLATES } from '../shareImage'
import { formatNoteTemplateFontLabel, resolveNoteTemplateFonts } from '../shareImageFonts'
import { t } from '../locales'
import ShareImageSheet from './ShareImageSheet.jsx'
import PreviewResetButton from './PreviewResetButton.jsx'
import { StudioControl, StudioHeader } from './ShareStudioChrome.jsx'
import { usePreviewFit } from './usePreviewFit'
import './shareStudio.less'

const FONT_SCALE_OPTIONS = Object.freeze([0.8, 0.9, 1, 1.1, 1.2])
const LINE_SPACING_OPTIONS = Object.freeze([0.5, 0.75, 1, 1.25, 1.5])
const CONTENT_PADDING_OPTIONS = Object.freeze([0.6, 0.8, 1, 1.2, 1.4])
const NOTE_FONT_OPTIONS = Object.freeze(['theme', 'sans', 'serif', 'mono'])

function formatPercent (value) {
  return `${Number((value * 100).toFixed(1))}%`
}

function NoteTemplateOption ({ compact = false, label, template }) {
  const isDark = template.id === 'smartisan-dark' || template.id === 'apple-notes'
  return (
    <span className={`share-note-template-option${compact ? ' is-compact' : ''}`}>
      <Box
        component="span"
        className="share-note-template-preview"
        sx={{
          bgcolor: template.paper,
          backgroundImage: `${isDark ? 'linear-gradient(rgba(0,0,0,.52),rgba(0,0,0,.52)),' : ''}url("${template.preview}")`
        }}
      />
      <span className="share-note-template-label">{label}</span>
    </span>
  )
}

function NoteImageStudio ({ initialData, imageSaveDirectory = '', isDark = true, language, onClose, onExported, onNotify }) {
  const title = initialData.title || ''
  const content = initialData.content || ''
  const [templateId, setTemplateId] = useState('default')
  const [aspectRatio, setAspectRatio] = useState('auto')
  const [pageIndex, setPageIndex] = useState(0)
  const [fontScale, setFontScale] = useState(1)
  const [lineSpacing, setLineSpacing] = useState(1)
  const [contentPadding, setContentPadding] = useState(1)
  const [fontFamily, setFontFamily] = useState('theme')
  const [localFonts, setLocalFonts] = useState([])
  const [textAlign, setTextAlign] = useState('left')
  const [titleAlign, setTitleAlign] = useState('left')
  const [showTitle, setShowTitle] = useState(true)
  const [showFooter, setShowFooter] = useState(true)
  const [showPageNumber, setShowPageNumber] = useState(true)
  const [busy, setBusy] = useState('')
  const previewFit = usePreviewFit()
  const appearance = useMemo(() => ({
    aspectRatio,
    contentPadding,
    fontFamily,
    fontScale,
    lineSpacing,
    showFooter,
    showPageNumber,
    showTitle,
    textAlign,
    titleAlign
  }), [aspectRatio, contentPadding, fontFamily, fontScale, lineSpacing, showFooter, showPageNumber, showTitle, textAlign, titleAlign])

  const copy = useMemo(() => ({
    appleNotes: t(language, 'share.image.appleNotes'),
    footerBrand: t(language, 'share.image.footerBrand'),
    footerVia: t(language, 'share.image.footerVia')
  }), [language])
  const prepared = useMemo(() => prepareShareImage({
    text: content,
    title,
    editorMode: initialData.editorMode,
    templateId,
    appearance,
    copy
  }), [appearance, content, copy, initialData.editorMode, templateId, title])
  const page = prepared.pages[Math.min(pageIndex, prepared.pages.length - 1)]
  const template = SHARE_IMAGE_TEMPLATES.find(item => item.id === templateId) || SHARE_IMAGE_TEMPLATES[0]

  useEffect(() => {
    setPageIndex(index => Math.min(index, prepared.pages.length - 1))
  }, [prepared.pages.length])

  useEffect(() => {
    let active = true
    Promise.resolve(window.fontServices?.listLocalFonts?.()).then(fonts => {
      if (active && Array.isArray(fonts)) setLocalFonts(fonts)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const themeFontLabel = useMemo(() => formatNoteTemplateFontLabel(
    t(language, 'share.note.fonts.theme'),
    resolveNoteTemplateFonts(templateId, localFonts)
  ), [language, localFonts, templateId])

  const copyCurrentPage = async () => {
    const services = window.imageServices
    if (!services?.copyPng) {
      onNotify(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy('copy')
    try {
      const blob = await renderShareImagePage(prepared, pageIndex)
      if (!(await services.copyPng(await blob.arrayBuffer()))) throw new Error('复制图片服务返回失败')
      onNotify(t(language, 'share.copied'))
      onExported?.()
    } catch (error) {
      console.error('复制便签图片失败', error)
      onNotify(t(language, 'share.copyFailed'), 'error')
    } finally {
      setBusy('')
    }
  }

  const exportCurrentTemplate = async () => {
    const services = window.imageServices
    if (!services?.savePngPages) {
      onNotify(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy('save')
    try {
      const pages = []
      for (let index = 0; index < prepared.pages.length; index += 1) {
        const blob = await renderShareImagePage(prepared, index)
        pages.push(await blob.arrayBuffer())
      }
      const defaultName = buildShareImageFilename(
        title,
        content,
        initialData.editorMode,
        t(language, `share.template.${templateId}`),
        t(language, 'fileDialog.defaultName')
      )
      const saved = await services.savePngPages(defaultName, pages, imageSaveDirectory)
      if (!saved) return
      onNotify(pages.length > 1
        ? t(language, 'share.savedMany', { count: pages.length })
        : t(language, 'share.saved'))
      onExported?.()
    } catch (error) {
      console.error('生成便签图片失败', error)
      onNotify(t(language, 'share.failed'), 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="share-note-studio">
      <StudioHeader
        title={t(language, 'share.note.windowTitle')}
        icon={<StickyNote2OutlinedIcon fontSize="small" />}
        closeLabel={t(language, 'common.close')}
        onClose={onClose}
        actions={(
          <>
            <Button
              className="share-studio-download-action"
              variant="outlined"
              size="small"
              startIcon={<DownloadOutlinedIcon />}
              disabled={Boolean(busy) || (!content.trim() && !title.trim())}
              onClick={exportCurrentTemplate}
            >
              {t(language, 'share.note.export')}
            </Button>
            <IconButton
              className="share-studio-copy-action"
              size="small"
              disabled={Boolean(busy) || (!content.trim() && !title.trim())}
              onClick={copyCurrentPage}
              aria-label={t(language, 'share.note.copy')}
            >
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      />
      <div className="share-note-workspace">
        <div className="share-note-controls-wrap">
          <div className="share-note-controls">
            <StudioControl className="share-note-template-control" label={t(language, 'share.note.template')}>
              <Select
                className="share-studio-compact-select"
                size="small"
                value={templateId}
                renderValue={value => {
                  const selectedTemplate = SHARE_IMAGE_TEMPLATES.find(item => item.id === value) || SHARE_IMAGE_TEMPLATES[0]
                  return <NoteTemplateOption compact template={selectedTemplate} label={t(language, `share.template.${selectedTemplate.id}`)} />
                }}
                onChange={event => setTemplateId(event.target.value)}
                MenuProps={{ disableRestoreFocus: true, PaperProps: { className: `share-studio-menu-paper ${isDark ? 'is-dark' : 'is-light'}` } }}
              >
                {SHARE_IMAGE_TEMPLATES.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    <NoteTemplateOption template={option} label={t(language, `share.template.${option.id}`)} />
                  </MenuItem>
                ))}
              </Select>
            </StudioControl>
            <StudioControl className="share-note-font-control" label={t(language, 'share.note.font')}>
              <Select className="share-studio-compact-select" size="small" value={fontFamily} onChange={event => setFontFamily(event.target.value)} MenuProps={{ disableRestoreFocus: true, PaperProps: { className: `share-studio-menu-paper ${isDark ? 'is-dark' : 'is-light'}` } }}>
                {NOTE_FONT_OPTIONS.map(value => <MenuItem key={value} value={value}>{value === 'theme' ? themeFontLabel : t(language, `share.note.fonts.${value}`)}</MenuItem>)}
              </Select>
            </StudioControl>
            <StudioControl className="share-note-aspect-control" label={t(language, 'share.note.aspectRatio')}>
              <Select className="share-studio-compact-select" size="small" value={aspectRatio} onChange={event => setAspectRatio(event.target.value)} MenuProps={{ disableRestoreFocus: true, PaperProps: { className: `share-studio-menu-paper ${isDark ? 'is-dark' : 'is-light'}` } }}>
                {SHARE_IMAGE_ASPECT_RATIOS.map(option => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.id === 'auto' ? t(language, 'share.note.aspectAuto') : option.label}
                  </MenuItem>
                ))}
              </Select>
            </StudioControl>
            <StudioControl label={t(language, 'share.note.textAlign')}>
              <ToggleButtonGroup className="share-studio-toggle-group" exclusive size="small" value={textAlign} onChange={(_, value) => { if (value !== null) setTextAlign(value) }}>
                <ToggleButton value="left" aria-label={t(language, 'share.note.alignments.left')}><FormatAlignLeftIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="center" aria-label={t(language, 'share.note.alignments.center')}><FormatAlignCenterIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="right" aria-label={t(language, 'share.note.alignments.right')}><FormatAlignRightIcon fontSize="small" /></ToggleButton>
              </ToggleButtonGroup>
            </StudioControl>
            <StudioControl label={t(language, 'share.note.fontSize')}>
              <ToggleButtonGroup className="share-studio-toggle-group" exclusive size="small" value={fontScale} onChange={(_, value) => { if (value !== null) setFontScale(value) }}>
                {FONT_SCALE_OPTIONS.map(value => <ToggleButton key={value} value={value}>{formatPercent(value)}</ToggleButton>)}
              </ToggleButtonGroup>
            </StudioControl>
            <StudioControl label={t(language, 'share.note.showTitle')}>
              <FormControlLabel className="share-studio-switch-control" control={<Switch size="small" checked={showTitle && Boolean(title.trim())} disabled={!title.trim()} onChange={event => setShowTitle(event.target.checked)} />} label="" />
            </StudioControl>
            <StudioControl label={t(language, 'share.note.titleAlign')}>
              <ToggleButtonGroup className="share-studio-toggle-group" disabled={!showTitle || !title.trim()} exclusive size="small" value={titleAlign} onChange={(_, value) => { if (value !== null) setTitleAlign(value) }}>
                <ToggleButton value="left" aria-label={t(language, 'share.note.alignments.left')}><FormatAlignLeftIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="center" aria-label={t(language, 'share.note.alignments.center')}><FormatAlignCenterIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="right" aria-label={t(language, 'share.note.alignments.right')}><FormatAlignRightIcon fontSize="small" /></ToggleButton>
              </ToggleButtonGroup>
            </StudioControl>
            <StudioControl label={t(language, 'share.note.lineSpacing')}>
              <ToggleButtonGroup className="share-studio-toggle-group" exclusive size="small" value={lineSpacing} onChange={(_, value) => { if (value !== null) setLineSpacing(value) }}>
                {LINE_SPACING_OPTIONS.map(value => <ToggleButton key={value} value={value}>{formatPercent(value)}</ToggleButton>)}
              </ToggleButtonGroup>
            </StudioControl>
            <StudioControl label={t(language, 'share.note.contentPadding')}>
              <ToggleButtonGroup className="share-studio-toggle-group" exclusive size="small" value={contentPadding} onChange={(_, value) => { if (value !== null) setContentPadding(value) }}>
                {CONTENT_PADDING_OPTIONS.map(value => <ToggleButton key={value} value={value}>{formatPercent(value)}</ToggleButton>)}
              </ToggleButtonGroup>
            </StudioControl>
            <div className="share-note-meta-controls">
              <StudioControl label={t(language, 'share.note.footer')}>
                <FormControlLabel className="share-studio-switch-control" control={<Switch size="small" checked={showFooter} onChange={event => setShowFooter(event.target.checked)} />} label="" />
              </StudioControl>
              <StudioControl label={t(language, 'share.note.pageNumber')}>
                <FormControlLabel className="share-studio-switch-control" control={<Switch size="small" checked={showPageNumber && prepared.pages.length > 1} disabled={prepared.pages.length <= 1} onChange={event => setShowPageNumber(event.target.checked)} />} label="" />
              </StudioControl>
            </div>
            {prepared.pages.length > 1 ? (
              <StudioControl className="share-note-page-control" label={t(language, 'share.note.pageHint', { count: prepared.pages.length, template: t(language, `share.template.${template.id}`) })}>
                <div className="share-note-page-switcher">
                  <IconButton size="small" aria-label={t(language, 'share.note.previousPage')} disabled={pageIndex === 0} onClick={() => setPageIndex(index => Math.max(0, index - 1))}><NavigateBeforeIcon fontSize="small" /></IconButton>
                  <span>{pageIndex + 1} / {prepared.pages.length}</span>
                  <IconButton size="small" aria-label={t(language, 'share.note.nextPage')} disabled={pageIndex >= prepared.pages.length - 1} onClick={() => setPageIndex(index => Math.min(prepared.pages.length - 1, index + 1))}><NavigateNextIcon fontSize="small" /></IconButton>
                </div>
              </StudioControl>
            ) : null}
          </div>
        </div>
        <div className="share-note-preview" ref={previewFit.viewportRef}>
          <div className="share-note-preview-scaler" style={previewFit.frameStyle}>
            <div className="share-note-preview-content" data-preview-pan-content="" ref={previewFit.contentRef} style={previewFit.contentStyle}>
              <ShareImageSheet
                copy={prepared.copy}
                editorMode={prepared.editorMode}
                footerLogoUrl={new URL('./logo.png', window.location.href).href}
                hasDocumentTitle={page.hasDocumentTitle}
                notes={page.notes}
                pageLabel={showPageNumber && prepared.pages.length > 1 ? `${pageIndex + 1} / ${prepared.pages.length}` : ''}
                appearance={appearance}
                templateId={templateId}
              />
            </div>
          </div>
          <PreviewResetButton
            label={t(language, 'share.social.reset')}
            onReset={previewFit.reset}
            visible={previewFit.isModified}
          />
        </div>
      </div>
    </div>
  )
}

export default memo(NoteImageStudio)
