import { memo, useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined'
import {
  buildCodeImageFilename,
  CODE_IMAGE_EXPORT_SCALES,
  CODE_IMAGE_FONTS,
  CODE_IMAGE_FORMAT_LANGUAGES,
  CODE_IMAGE_PADDING_OPTIONS,
  formatCodeImageSource,
  renderCodeImagePng,
  renderCodeImageSvg,
  svgDataUrlToText
} from '../codeImage'
import { CODE_IMAGE_THEME_LIST } from '../codeImageThemes'
import { AUTO_CODE_LANGUAGE, loadCodeLanguageOptions, PLAIN_CODE_LANGUAGE } from '../editorMode'
import { t } from '../locales'
import { useCodeLanguageDetection } from '../useCodeLanguageDetection'
import CodeImageCanvas from './CodeImageCanvas.jsx'
import PreviewResetButton from './PreviewResetButton.jsx'
import { StudioControl, StudioHeader } from './ShareStudioChrome.jsx'
import { usePreviewFit } from './usePreviewFit'

const WIDTH_MIN = 520
const WIDTH_MAX = 1280

function ThemeOption ({ label, theme }) {
  return (
    <span className="ci-theme-option">
      {theme.partner ? (
        <Box component="img" className="ci-theme-option-icon" src={`./code-image/${theme.id}.svg`} alt="" />
      ) : (
        <Box
          component="span"
          className="ci-theme-option-swatch"
          sx={{ background: `linear-gradient(140deg,${theme.background.from},${theme.background.to})` }}
        />
      )}
      <span className="ci-theme-option-label">{label}</span>
    </span>
  )
}

function CodeImageStudio ({ initialData, imageSaveDirectory = '', isDark = true, language: interfaceLanguage, onClose, onExported, onNotify }) {
  const [code, setCode] = useState(initialData.content || '')
  const [fileName, setFileName] = useState(initialData.fileName || 'code')
  const [themeId, setThemeId] = useState('candy')
  const [darkMode, setDarkMode] = useState(true)
  const [showBackground, setShowBackground] = useState(true)
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [padding, setPadding] = useState(64)
  const [font, setFont] = useState('theme')
  const [languagePreference, setLanguagePreference] = useState(initialData.codeLanguage || AUTO_CODE_LANGUAGE)
  const [width, setWidth] = useState(720)
  const [exportScale, setExportScale] = useState(4)
  const [highlightedLines, setHighlightedLines] = useState(() => new Set())
  const [languageOptions, setLanguageOptions] = useState([])
  const [busy, setBusy] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const frameRef = useRef(null)
  const resizeRef = useRef(null)
  const previewFit = usePreviewFit()

  const detection = useCodeLanguageDetection({
    enabled: languagePreference === AUTO_CODE_LANGUAGE,
    filename: fileName,
    preference: languagePreference,
    text: code
  })
  const effectiveLanguage = languagePreference === AUTO_CODE_LANGUAGE
    ? detection.language || PLAIN_CODE_LANGUAGE
    : languagePreference

  useEffect(() => {
    let active = true
    loadCodeLanguageOptions().then(options => {
      if (active) setLanguageOptions(options)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  const selectedTheme = CODE_IMAGE_THEME_LIST.find(item => item.id === themeId)
  const themeFontId = selectedTheme?.font || 'jetbrains-mono'
  const themeFontLabel = `${t(interfaceLanguage, 'share.code.fonts.theme')} (${t(interfaceLanguage, `share.code.fonts.${themeFontId}`)})`
  const effectiveLineNumbers = selectedTheme?.partner ? Boolean(selectedTheme.lineNumbers) : showLineNumbers
  const effectiveShowBackground = padding > 0 && showBackground

  useEffect(() => {
    if (themeId === 'vercel' || themeId === 'rabbit') setPadding(64)
  }, [themeId])

  useEffect(() => {
    const move = event => {
      if (!resizeRef.current) return
      const { scale, startX, startWidth, direction } = resizeRef.current
      const delta = ((event.clientX - startX) / scale) * direction
      setWidth(Math.max(WIDTH_MIN, Math.min(WIDTH_MAX, Math.round(startWidth + delta))))
    }
    const stop = () => {
      resizeRef.current = null
      setIsResizing(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  const startResize = useCallback((event, direction) => {
    event.preventDefault()
    resizeRef.current = { startX: event.clientX, startWidth: width, direction, scale: (previewFit.fit.scale || 1) * previewFit.zoom }
    setIsResizing(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }, [previewFit.fit.scale, previewFit.zoom, width])

  const createPng = useCallback(async () => {
    const blob = await renderCodeImagePng(frameRef.current, exportScale)
    return { blob, bytes: await blob.arrayBuffer() }
  }, [exportScale])

  const savePng = useCallback(async () => {
    const services = window.imageServices
    if (!services?.saveImage) {
      onNotify(t(interfaceLanguage, 'share.unavailable'), 'warning')
      return
    }
    setBusy('png')
    try {
      const { bytes } = await createPng()
      const saved = await services.saveImage(buildCodeImageFilename(fileName, 'png'), 'png', bytes, imageSaveDirectory)
      if (!saved) return
      onNotify(t(interfaceLanguage, 'share.saved'))
      onExported?.()
    } catch (error) {
      console.error('保存代码截图失败', error)
      onNotify(t(interfaceLanguage, 'share.failed'), 'error')
    } finally {
      setBusy('')
    }
  }, [createPng, fileName, imageSaveDirectory, interfaceLanguage, onExported, onNotify])

  const copyPng = useCallback(async () => {
    const services = window.imageServices
    if (!services?.copyPng) {
      onNotify(t(interfaceLanguage, 'share.unavailable'), 'warning')
      return
    }
    setBusy('copy')
    try {
      const { bytes } = await createPng()
      if (!(await services.copyPng(bytes))) throw new Error('复制图片服务返回失败')
      onNotify(t(interfaceLanguage, 'share.copied'))
      onExported?.()
    } catch (error) {
      console.error('复制代码截图失败', error)
      onNotify(t(interfaceLanguage, 'share.copyFailed'), 'error')
    } finally {
      setBusy('')
    }
  }, [createPng, interfaceLanguage, onExported, onNotify])

  const saveSvg = useCallback(async () => {
    const services = window.imageServices
    if (!services?.saveImage) {
      onNotify(t(interfaceLanguage, 'share.unavailable'), 'warning')
      return
    }
    setBusy('svg')
    try {
      const dataUrl = await renderCodeImageSvg(frameRef.current)
      const svg = svgDataUrlToText(dataUrl)
      const saved = await services.saveImage(
        buildCodeImageFilename(fileName, 'svg'),
        'svg',
        new TextEncoder().encode(svg),
        imageSaveDirectory
      )
      if (!saved) return
      onNotify(t(interfaceLanguage, 'share.saved'))
      onExported?.()
    } catch (error) {
      console.error('保存 SVG 代码截图失败', error)
      onNotify(t(interfaceLanguage, 'share.failed'), 'error')
    } finally {
      setBusy('')
    }
  }, [fileName, imageSaveDirectory, interfaceLanguage, onExported, onNotify])

  const formatSource = useCallback(async () => {
    if (!CODE_IMAGE_FORMAT_LANGUAGES.includes(effectiveLanguage)) {
      onNotify(t(interfaceLanguage, 'share.code.formatUnsupported'), 'info')
      return
    }
    setBusy('format')
    try {
      setCode(await formatCodeImageSource(code, effectiveLanguage))
      onNotify(t(interfaceLanguage, 'share.code.formatted'))
    } catch (error) {
      console.error('格式化代码失败', error)
      onNotify(t(interfaceLanguage, 'share.code.formatFailed'), 'error')
    } finally {
      setBusy('')
    }
  }, [code, effectiveLanguage, interfaceLanguage, onNotify])

  useEffect(() => {
    const handleShortcut = event => {
      if (event.key.toLowerCase() !== 'f' || !event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return
      event.preventDefault()
      formatSource()
    }
    document.addEventListener('keydown', handleShortcut, true)
    return () => document.removeEventListener('keydown', handleShortcut, true)
  }, [formatSource])

  return (
    <div className="ci-studio-shell">
      <StudioHeader
        title={t(interfaceLanguage, 'share.code.title')}
        icon={<CodeOutlinedIcon fontSize="small" />}
        closeLabel={t(interfaceLanguage, 'common.close')}
        onClose={onClose}
        actions={(
          <>
            <Button
              className="share-studio-secondary-action"
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighOutlinedIcon />}
              disabled={Boolean(busy) || !CODE_IMAGE_FORMAT_LANGUAGES.includes(effectiveLanguage)}
              onClick={formatSource}
            >
              {t(interfaceLanguage, 'share.code.format')}
            </Button>
            <Button className="share-studio-secondary-action" variant="outlined" size="small" startIcon={<ImageOutlinedIcon />} disabled={Boolean(busy)} onClick={saveSvg}>
              {t(interfaceLanguage, 'share.code.exportSvg')}
            </Button>
            <Button className="share-studio-download-action" variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} disabled={Boolean(busy)} onClick={savePng}>
              {t(interfaceLanguage, 'share.code.exportPng')}
            </Button>
            <IconButton className="share-studio-copy-action" size="small" disabled={Boolean(busy)} onClick={copyPng} aria-label={t(interfaceLanguage, 'share.code.copyPng')}>
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      />
      <div className="ci-studio-preview" ref={previewFit.viewportRef}>
        <div className="ci-studio-preview-scaler" style={previewFit.frameStyle}>
          <div
            className={`ci-studio-canvas-wrap${isResizing ? ' is-resizing' : ''}`}
            data-preview-pan-content=""
            ref={previewFit.contentRef}
            style={previewFit.contentStyle}
          >
            <button type="button" className="ci-resize-handle is-left" data-preview-pan-ignore="" aria-label={t(interfaceLanguage, 'share.code.resize')} onPointerDown={event => startResize(event, -1)} />
            <CodeImageCanvas
              ref={frameRef}
              code={code}
              darkMode={darkMode}
              fileName={fileName}
              font={font}
              highlightedLines={highlightedLines}
              interfaceLanguage={interfaceLanguage}
              language={effectiveLanguage}
              onChange={setCode}
              onFileNameChange={setFileName}
              onHighlightedLinesChange={setHighlightedLines}
              padding={padding}
              showBackground={effectiveShowBackground}
              showLineNumbers={effectiveLineNumbers}
              themeId={themeId}
              width={width}
            />
            <button type="button" className="ci-resize-handle is-right" data-preview-pan-ignore="" aria-label={t(interfaceLanguage, 'share.code.resize')} onPointerDown={event => startResize(event, 1)} />
            {isResizing ? <div className="ci-resize-ruler"><span>{width} px</span></div> : null}
          </div>
        </div>
        <PreviewResetButton
          label={t(interfaceLanguage, 'share.social.reset')}
          onReset={previewFit.reset}
          visible={previewFit.isModified}
        />
      </div>

      <div className="ci-studio-controls-wrap">
        <div className="ci-studio-controls">
          <StudioControl className="ci-control-filename" label={t(interfaceLanguage, 'share.code.filename')}>
          <TextField
            className="share-studio-compact-input"
            size="small"
            value={fileName}
            onChange={event => setFileName(event.target.value)}
            inputProps={{ spellCheck: false }}
          />
          </StudioControl>

          <StudioControl label={t(interfaceLanguage, 'share.code.theme')}>
            <Select
              className="share-studio-compact-select ci-theme-select"
              size="small"
              value={themeId}
              renderValue={value => {
                const theme = CODE_IMAGE_THEME_LIST.find(item => item.id === value) || CODE_IMAGE_THEME_LIST[0]
                return <ThemeOption theme={theme} label={t(interfaceLanguage, `share.code.themes.${theme.id}`)} />
              }}
              onChange={event => setThemeId(event.target.value)}
              MenuProps={{ disableRestoreFocus: true, PaperProps: { className: `share-studio-menu-paper ${isDark ? 'is-dark' : 'is-light'}` } }}
            >
              <MenuItem disabled>{t(interfaceLanguage, 'share.code.presetThemes')}</MenuItem>
              {CODE_IMAGE_THEME_LIST.filter(theme => theme.partner).map(theme => (
                <MenuItem key={theme.id} value={theme.id}>
                  <ThemeOption theme={theme} label={t(interfaceLanguage, `share.code.themes.${theme.id}`)} />
                </MenuItem>
              ))}
              <MenuItem disabled>{t(interfaceLanguage, 'share.code.colorThemes')}</MenuItem>
              {CODE_IMAGE_THEME_LIST.filter(theme => !theme.partner).map(theme => (
                <MenuItem key={theme.id} value={theme.id}>
                  <ThemeOption theme={theme} label={t(interfaceLanguage, `share.code.themes.${theme.id}`)} />
                </MenuItem>
              ))}
            </Select>
          </StudioControl>

          <StudioControl label={t(interfaceLanguage, 'share.code.background')}>
            <FormControlLabel className="share-studio-switch-control" control={<Switch size="small" checked={effectiveShowBackground} disabled={padding === 0} onChange={event => setShowBackground(event.target.checked)} />} label="" />
          </StudioControl>
          <StudioControl label={t(interfaceLanguage, 'share.code.darkMode')}>
            <FormControlLabel className="share-studio-switch-control" control={<Switch size="small" checked={darkMode} onChange={event => setDarkMode(event.target.checked)} />} label="" />
          </StudioControl>
          <StudioControl label={t(interfaceLanguage, 'share.code.lineNumbers')}>
            <FormControlLabel className="share-studio-switch-control" control={<Switch size="small" checked={effectiveLineNumbers} disabled={Boolean(selectedTheme?.partner)} onChange={event => setShowLineNumbers(event.target.checked)} />} label="" />
          </StudioControl>

          <StudioControl className="ci-control-padding" label={t(interfaceLanguage, 'share.code.padding')}>
            <ToggleButtonGroup className="share-studio-toggle-group" exclusive size="small" value={padding} onChange={(_, value) => { if (value !== null) setPadding(value) }}>
              {CODE_IMAGE_PADDING_OPTIONS.map(value => <ToggleButton key={value} value={value}>{value}</ToggleButton>)}
            </ToggleButtonGroup>
          </StudioControl>

          <StudioControl label={t(interfaceLanguage, 'share.code.font')}>
            <Select className="share-studio-compact-select ci-font-select" size="small" value={font} onChange={event => setFont(event.target.value)} MenuProps={{ disableRestoreFocus: true, PaperProps: { className: `share-studio-menu-paper ${isDark ? 'is-dark' : 'is-light'}` } }}>
              {CODE_IMAGE_FONTS.map(option => <MenuItem key={option.id} value={option.id}>{option.id === 'theme' ? themeFontLabel : t(interfaceLanguage, `share.code.fonts.${option.id}`)}</MenuItem>)}
            </Select>
          </StudioControl>

          <StudioControl label={t(interfaceLanguage, 'share.code.language')}>
            <Select className="share-studio-compact-select ci-language-select" size="small" value={languagePreference} onChange={event => setLanguagePreference(event.target.value)} MenuProps={{ disableRestoreFocus: true, PaperProps: { className: `share-studio-menu-paper ${isDark ? 'is-dark' : 'is-light'}`, sx: { maxHeight: 360 } } }}>
              <MenuItem value={AUTO_CODE_LANGUAGE}>{t(interfaceLanguage, 'share.code.autoLanguage')}</MenuItem>
              <MenuItem value={PLAIN_CODE_LANGUAGE}>{t(interfaceLanguage, 'share.code.plainText')}</MenuItem>
              {!languageOptions.some(option => option.value === languagePreference) && ![AUTO_CODE_LANGUAGE, PLAIN_CODE_LANGUAGE].includes(languagePreference) ? <MenuItem value={languagePreference}>{languagePreference}</MenuItem> : null}
              {languageOptions.map(option => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </Select>
          </StudioControl>

          <StudioControl label={t(interfaceLanguage, 'share.code.scale')}>
            <ToggleButtonGroup className="share-studio-toggle-group" exclusive size="small" value={exportScale} onChange={(_, value) => { if (value) setExportScale(value) }}>
              {CODE_IMAGE_EXPORT_SCALES.map(value => <ToggleButton key={value} value={value}>{value}x</ToggleButton>)}
            </ToggleButtonGroup>
          </StudioControl>
        </div>
      </div>
    </div>
  )
}

export default memo(CodeImageStudio)
