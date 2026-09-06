import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import {
  buildSocialImageFilename,
  getDefaultWechatHighlightRange,
  getSocialShareFirstLine,
  normalizeSocialImageKind,
  normalizeSocialShareText,
  ZHIHU_THEMES
} from '../socialShareImage'
import { t } from '../locales'
import { WECHAT_DONATION_QR_LIGHT_SRC } from '../donationAssets'
import { readUtoolsUser } from '../utoolsUser'
import { StudioControl, StudioHeader } from './ShareStudioChrome.jsx'
import SocialImageCanvas from './SocialImageCanvas.jsx'
import BrandIcon, { getBrandColor, XBrandMark } from './BrandIcon.jsx'
import PreviewResetButton from './PreviewResetButton.jsx'
import { usePreviewFit } from './usePreviewFit'
import './shareStudio.less'
import './socialImageStudio.less'

const ZHIHU_THEME_LABEL_KEYS = Object.freeze({
  light: 'themeLight',
  ink: 'themeInk',
  blue: 'themeBlue',
  indigo: 'themeIndigo',
  cyan: 'themeCyan'
})

const LONG_SOCIAL_IMAGE_CONTENT_LENGTH = 8000

function isLongSocialImageContent (content) {
  return String(content || '').length >= LONG_SOCIAL_IMAGE_CONTENT_LENGTH
}

function getXBrandSource (brandVariant) {
  return brandVariant === 'x' ? 'x.com' : 'twitter.com'
}

function imageLoadError (image, reason = '加载失败') {
  const source = image.currentSrc || image.src || '未知来源'
  return new Error(`图片${reason}：${source}`)
}

function readFileAsDataUrl (file) {
  // 备用文件读取路径：当宿主没有提供图片预处理服务时，直接把本地文件编码为
  // 生成 data URL，保证自定义图片仍能在预览和导出流程中使用。
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('无法读取图片'))
    reader.readAsDataURL(file)
  })
}

function waitForImages (node, timeoutMs = 10000) {
  // 导出工具 html-to-image 只会绘制已经完成解码的图片。逐张等待 load、decode 或超时，
  // 可以避免自定义图片尚未准备好就开始导出，产生空白或低清晰度结果。
  return Promise.all(Array.from(node.querySelectorAll('img')).map(image => {
    if (image.complete) {
      if (image.naturalWidth <= 0) return Promise.reject(imageLoadError(image))
      return typeof image.decode === 'function' ? Promise.resolve().then(() => image.decode()) : Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      let timeoutId
      let settled = false
      const cleanup = () => {
        clearTimeout(timeoutId)
        image.removeEventListener('load', handleLoad)
        image.removeEventListener('error', handleError)
      }
      const settle = callback => value => {
        if (settled) return
        settled = true
        cleanup()
        callback(value)
      }
      const resolveLoaded = settle(resolve)
      const rejectFailed = settle(reject)
      const handleLoad = () => {
        if (image.naturalWidth <= 0) {
          rejectFailed(imageLoadError(image))
          return
        }
        if (typeof image.decode !== 'function') {
          resolveLoaded()
          return
        }
        Promise.resolve().then(() => image.decode()).then(resolveLoaded, rejectFailed)
      }
      const handleError = () => rejectFailed(imageLoadError(image))

      image.addEventListener('load', handleLoad)
      image.addEventListener('error', handleError)
      timeoutId = setTimeout(() => rejectFailed(imageLoadError(image, `${timeoutMs} 毫秒内未加载完成`)), timeoutMs)

      // 图片可能在首次就绪检查与监听器注册之间完成加载，因此注册监听器后还要
      // 再检查一次 complete，避免错过 load 事件导致导出流程一直等待。
      if (image.complete) handleLoad()
    })
  }))
}

function CompactTextControl ({ className = 'social-image-control-span-2', label, onChange, value }) {
  return (
    <StudioControl className={className} label={label}>
      <TextField
        className="share-studio-compact-input"
        size="small"
        value={value}
        onChange={event => onChange(event.target.value)}
        inputProps={{ spellCheck: false }}
      />
    </StudioControl>
  )
}

function ZhihuThemeOption ({ theme }) {
  return (
    <span className="social-image-theme-option">
      <span
        className="social-image-theme-preview"
        style={{ background: theme.main, color: theme.text }}
        aria-hidden="true"
      >
        知乎
      </span>
    </span>
  )
}

function SocialImageStudio ({ initialData, imageSaveDirectory = '', language, onClose, onExported, onNotify }) {
  const kind = normalizeSocialImageKind(initialData.kind)
  const titleKey = kind === 'x' ? 'xTitle' : kind === 'wechat' ? 'wechatTitle' : 'zhihuTitle'
  const content = useMemo(() => normalizeSocialShareText(initialData.content, initialData.editorMode), [initialData.content, initialData.editorMode])
  const defaultAppName = t(language, 'app.name')
  const initialFooterTitle = useMemo(() => initialData.title || getSocialShareFirstLine(content, 54, defaultAppName), [content, defaultAppName, initialData.title])
  const defaultAvatarUrl = useMemo(() => new URL('./logo.png', window.location.href).href, [])
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl)
  const [profileReady, setProfileReady] = useState(false)
  const [busy, setBusy] = useState('')
  const [displayName, setDisplayName] = useState(defaultAppName)
  const [handle, setHandle] = useState('@FlashNote')
  const [likes, setLikes] = useState(() => t(language, 'share.social.defaultLikes'))
  const [brandVariant, setBrandVariant] = useState('twitter')
  const [source, setSource] = useState(() => getXBrandSource('twitter'))
  const [author, setAuthor] = useState(defaultAppName)
  const [articleTitle, setArticleTitle] = useState(initialFooterTitle)
  const [scanSupport, setScanSupport] = useState(() => t(language, 'share.social.scanSupport'))
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [themeId, setThemeId] = useState('light')
  // 微信卡片的正文在工作室内可直接编辑，不能只依赖打开工作室时传入的快照。
  // 其他平台仍使用原始 content，避免改变已有的分享编辑行为。
  const [wechatContent, setWechatContent] = useState(content)
  const [highlightRange, setHighlightRange] = useState(() => getDefaultWechatHighlightRange(content))
  const selectionRef = useRef(null)
  const qrInputRef = useRef(null)
  const canvasRef = useRef(null)
  const previewFit = usePreviewFit({ maxZoom: 256, zoomStep: 1.4 })
  const exportReady = profileReady
  const previewContent = kind === 'wechat' ? wechatContent : content

  useEffect(() => {
    let active = true
    Promise.resolve(readUtoolsUser()).then(profile => {
      if (!active || !profile) return
      const profileName = profile.name || defaultAppName
      const profileHandle = profile.handle ? `@${profile.handle.replace(/^@+/, '')}` : '@FlashNote'
      if (profile.avatar) setAvatarUrl(current => current === defaultAvatarUrl ? profile.avatar : current)
      setDisplayName(current => current === defaultAppName ? profileName : current)
      setAuthor(current => current === defaultAppName ? profileName : current)
      setHandle(current => current === '@FlashNote' ? profileHandle : current)
    }).catch(() => {}).finally(() => {
      if (active) setProfileReady(true)
    })
    return () => { active = false }
  }, [defaultAppName, defaultAvatarUrl])

  useEffect(() => {
    const editor = selectionRef.current
    if (!editor || kind !== 'wechat') return
    const max = wechatContent.length
    const start = Math.max(0, Math.min(max, Number(highlightRange[0]) || 0))
    const end = Math.max(start, Math.min(max, Number(highlightRange[1]) || 0))
    try { editor.setSelectionRange(start, end) } catch {}
  }, [highlightRange, kind, wechatContent.length])

  const createPng = useCallback(async () => {
    if (!exportReady) throw new Error('社交图片素材尚未准备好')
    const canvas = canvasRef.current?.querySelector('.social-image-canvas')
    if (!canvas) throw new Error('社交图片画布不可用')
    const host = document.createElement('div')
    const exportNode = canvas.cloneNode(true)
    host.style.position = 'fixed'
    host.style.top = '0'
    host.style.left = '-20000px'
    host.style.pointerEvents = 'none'
    exportNode.style.transform = 'none'
    exportNode.style.transformOrigin = 'top left'
    exportNode.style.margin = '0'
    host.appendChild(exportNode)
    document.body.appendChild(host)
    await document.fonts?.ready
    try {
      await waitForImages(exportNode)
      const width = Math.max(1, exportNode.offsetWidth)
      const height = Math.max(1, exportNode.offsetHeight)
      host.style.width = `${width}px`
      host.style.height = `${height}px`
      exportNode.style.width = `${width}px`
      exportNode.style.height = `${height}px`
      const blob = await toBlob(exportNode, {
        cacheBust: false,
        pixelRatio: 1,
        skipAutoScale: true,
        width,
        height,
        backgroundColor: kind === 'wechat' ? '#F7F7F7' : undefined
      })
      if (!blob) throw new Error('PNG 图片生成失败')
      return blob
    } finally {
      host.remove()
    }
  }, [exportReady, kind])

  const copyImage = useCallback(async () => {
    const services = window.imageServices
    if (!services?.copyPng) {
      onNotify(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy('copy')
    try {
      const blob = await createPng()
      if (!(await services.copyPng(await blob.arrayBuffer()))) throw new Error('复制图片服务返回失败')
      onNotify(t(language, 'share.copied'))
      onExported?.()
    } catch (error) {
      console.error('复制社交分享图片失败', error)
      onNotify(t(language, 'share.copyFailed'), 'error')
    } finally {
      setBusy('')
    }
  }, [createPng, language, onExported, onNotify])

  const saveImage = useCallback(async () => {
    const services = window.imageServices
    if (!services?.saveImage) {
      onNotify(t(language, 'share.unavailable'), 'warning')
      return
    }
    setBusy('save')
    try {
      const blob = await createPng()
      const saved = await services.saveImage(
        buildSocialImageFilename(kind, initialData.title, previewContent, {
          defaultName: defaultAppName,
          platformName: t(language, `share.social.${titleKey}`)
        }),
        'png',
        await blob.arrayBuffer(),
        imageSaveDirectory
      )
      if (!saved) return
      onNotify(t(language, 'share.saved'))
      onExported?.()
    } catch (error) {
      console.error('保存社交分享图片失败', error)
      onNotify(t(language, 'share.failed'), 'error')
    } finally {
      setBusy('')
    }
  }, [createPng, defaultAppName, imageSaveDirectory, initialData.title, kind, language, onExported, onNotify, previewContent, titleKey])

  const updateHighlightFromSelection = event => {
    const start = event.currentTarget.selectionStart
    const end = event.currentTarget.selectionEnd
    if (Number.isFinite(start) && Number.isFinite(end)) setHighlightRange([Math.min(start, end), Math.max(start, end)])
  }

  const updateWechatContent = event => {
    const nextContent = event.currentTarget.value
    setWechatContent(nextContent)
    // 输入事件发生后，selectionStart/selectionEnd 已经反映浏览器的新光标位置。
    // 同步记录它们，保证新增、删除或粘贴后预览中的清晰范围立即跟随变化。
    const start = event.currentTarget.selectionStart
    const end = event.currentTarget.selectionEnd
    if (Number.isFinite(start) && Number.isFinite(end)) setHighlightRange([Math.min(start, end), Math.max(start, end)])
  }

  const setQrFromFile = async file => {
    if (!file) return
    // 优先使用 preload 提供的图片规范化服务（含格式检查和尺寸处理）；没有该服务
    // 时再走浏览器 FileReader，兼容普通网页环境和旧版 uTools。
    const prepareReferenceImage = window.imageServices?.prepareReferenceImage
    const prepared = typeof prepareReferenceImage === 'function'
      ? await prepareReferenceImage(await file.arrayBuffer())
      : { dataUrl: await readFileAsDataUrl(file) }
    if (!prepared?.dataUrl) throw new Error('图片数据不可用')
    setQrImageUrl(prepared.dataUrl)
  }

  const handleQrInputChange = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await setQrFromFile(file)
    } catch (error) {
      console.error('读取自定义图片失败', error)
      onNotify(t(language, 'share.failed'), 'error')
    }
  }

  const chooseQrImage = async () => {
    const chooseImageFile = window.fileServices?.chooseImageFile
    if (typeof chooseImageFile === 'function') {
      try {
        const selected = await chooseImageFile({
          detachRequired: t(language, 'fileDialog.detachRequired'),
          title: t(language, 'share.social.qrImage'),
          imageFiles: t(language, 'share.imageFiles')
        })
        if (selected?.dataUrl) setQrImageUrl(selected.dataUrl)
      } catch (error) {
        console.error('选择自定义图片失败', error)
        onNotify(t(language, 'share.failed'), 'error')
      }
      return
    }
    qrInputRef.current?.click()
  }

  const changeBrandVariant = (_, value) => {
    if (!value) return
    setBrandVariant(value)
    setSource(getXBrandSource(value))
  }

  const canvasProps = {
    articleTitle,
    author,
    avatarUrl,
    brandVariant,
    content: previewContent,
    displayName,
    footerTitle: articleTitle,
    handle,
    highlightRange,
    kind,
    language,
    likes,
    qrImageUrl,
    scanSupport,
    source,
    themeId
  }

  return (
    <div className="social-image-studio">
      <StudioHeader
        title={t(language, `share.social.${titleKey}`)}
        icon={<BrandIcon brand={kind} color={getBrandColor(kind)} />}
        closeLabel={t(language, 'common.close')}
        onClose={onClose}
        actions={(
          <>
            <Button className="share-studio-download-action" variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />} disabled={Boolean(busy) || !previewContent || !exportReady} onClick={saveImage}>
              {t(language, 'share.social.export')}
            </Button>
            <IconButton className="share-studio-copy-action" size="small" disabled={Boolean(busy) || !previewContent || !exportReady} onClick={copyImage} aria-label={t(language, 'share.social.copy')}>
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}
      />

      <div className="social-image-workspace">
        <div className="social-image-controls-wrap">
            <div className={`social-image-controls${kind === 'wechat' ? ' is-wechat' : ''}`}>
            {kind === 'x' ? (
              <>
                <StudioControl className="social-image-control-span-12" label={t(language, 'share.social.brandMark')}>
                  <ToggleButtonGroup className="social-image-brand-options" exclusive size="small" value={brandVariant} onChange={changeBrandVariant}>
                    <ToggleButton value="twitter" aria-label={t(language, 'share.social.twitterBird')}>
                      <BrandIcon brand="x" visualHeight={18} />
                    </ToggleButton>
                    <ToggleButton value="x" aria-label={t(language, 'share.xImage')}>
                      <XBrandMark className="social-image-brand-x-mark" />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </StudioControl>
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.displayName')} value={displayName} onChange={setDisplayName} />
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.handle')} value={handle} onChange={setHandle} />
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.likes')} value={likes} onChange={setLikes} />
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.source')} value={source} onChange={setSource} />
              </>
            ) : kind === 'zhihu' ? (
              <>
                <StudioControl className="social-image-control-span-12" label={t(language, 'share.social.theme')}>
                  <ToggleButtonGroup className="social-image-theme-options" exclusive size="small" value={themeId} onChange={(_, value) => { if (value) setThemeId(value) }}>
                    {ZHIHU_THEMES.map(option => (
                      <ToggleButton key={option.id} value={option.id} aria-label={t(language, `share.social.${ZHIHU_THEME_LABEL_KEYS[option.id]}`)}>
                        <ZhihuThemeOption
                          theme={option}
                        />
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </StudioControl>
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.author')} value={author} onChange={setAuthor} />
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.articleTitle')} value={articleTitle} onChange={setArticleTitle} />
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.grayText')} value={scanSupport} onChange={setScanSupport} />
                <StudioControl className="social-image-control-span-12" label={t(language, 'share.social.qrImage')}>
                  <div className="social-image-qr-picker">
                    <Button variant="outlined" size="small" startIcon={<ImageOutlinedIcon />} onClick={chooseQrImage}>
                      {t(language, 'share.social.qrImage')}
                    </Button>
                    {qrImageUrl ? (
                      <Button size="small" onClick={() => setQrImageUrl('')}>
                        {t(language, 'share.social.reset')}
                      </Button>
                    ) : null}
                    <img src={qrImageUrl || WECHAT_DONATION_QR_LIGHT_SRC} alt="" />
                  </div>
                </StudioControl>
              </>
            ) : (
              <>
                <StudioControl className="social-image-control-span-12 social-wechat-selection-control" label={t(language, 'share.social.blackText')}>
                  <textarea
                    ref={selectionRef}
                    className="social-wechat-selection"
                    value={wechatContent}
                    onChange={updateWechatContent}
                    onSelect={updateHighlightFromSelection}
                    onPointerUp={updateHighlightFromSelection}
                    onKeyUp={updateHighlightFromSelection}
                  />
                </StudioControl>
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.author')} value={author} onChange={setAuthor} />
                <CompactTextControl className="social-image-control-span-12" label={t(language, 'share.social.articleTitle')} value={articleTitle} onChange={setArticleTitle} />
                <StudioControl className="social-image-control-span-12" label={t(language, 'share.social.qrImage')}>
                  <div className="social-image-qr-picker">
                    <Button variant="outlined" size="small" startIcon={<ImageOutlinedIcon />} onClick={chooseQrImage}>
                      {t(language, 'share.social.qrImage')}
                    </Button>
                    {qrImageUrl ? (
                      <Button size="small" onClick={() => setQrImageUrl('')}>
                        {t(language, 'share.social.reset')}
                      </Button>
                    ) : null}
                    <img src={qrImageUrl || WECHAT_DONATION_QR_LIGHT_SRC} alt="" />
                  </div>
                </StudioControl>
              </>
            )}

            <input ref={qrInputRef} className="social-image-hidden-file-input" type="file" accept="image/*" onChange={handleQrInputChange} />

          </div>
        </div>
        <div className="social-image-preview" data-preview-heavy={isLongSocialImageContent(previewContent) || previewFit.isLargeContent ? '' : undefined} ref={previewFit.viewportRef}>
          <div className="social-image-preview-scaler" style={previewFit.frameStyle}>
            <div className="social-image-preview-content" data-preview-pan-content="" ref={previewFit.contentRef} style={previewFit.contentStyle}>
              <div ref={canvasRef}><SocialImageCanvas {...canvasProps} /></div>
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

export default memo(SocialImageStudio)
