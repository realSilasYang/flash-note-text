import { memo } from 'react'
import { WECHAT_DONATION_QR_LIGHT_SRC } from '../donationAssets'
import { t } from '../locales'
import { resolveZhihuTheme } from '../socialShareImage'
import BrandIcon, { XBrandMark } from './BrandIcon.jsx'
import './socialImageStudio.less'

function WechatDonationQr ({ className, imageUrl }) {
  // 未提供自定义图片时使用内置赞赏图，并叠加微信标识；自定义图片则只绘制
  // 用户选择的原图，避免在二维码内容上再覆盖不相关的标识。
  const qrSource = imageUrl || WECHAT_DONATION_QR_LIGHT_SRC
  return (
    <span className={`${className} social-donation-qr${imageUrl ? ' is-custom' : ''}`}>
      <img className="social-donation-qr-image" src={qrSource} alt="" />
      {!imageUrl ? <img className="social-donation-qr-logo" src={qrSource} alt="" aria-hidden="true" /> : null}
    </span>
  )
}

function XCopy ({ content }) {
  const parts = String(content || '').split(/(https?:\/\/\S+|(?:[\w-]+\.)+(?:com|net|org|cn|io|co)\S*)/gi)
  return parts.map((part, index) => (
    /^(?:https?:\/\/|(?:[\w-]+\.)+(?:com|net|org|cn|io|co))/i.test(part)
      ? <span className="social-x-url" key={`${index}-${part}`}>{part}</span>
      : part
  ))
}

function VerifiedBadge ({ language }) {
  return (
    <svg className="social-wechat-verified" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" aria-label={t(language, 'share.social.verified')}>
      <path fill="#1687E8" d="m23 12-2.44-2.79.34-3.69-3.61-.82L15.4 1.54 12 3 8.6 1.54 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.81 1.89 3.16L12 21l3.4 1.47 1.89-3.16 3.61-.82-.34-3.69z" />
      <path fill="#FFFFFF" d="m10.09 16.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48z" />
    </svg>
  )
}

function XImageCanvas ({ avatarUrl, brandVariant = 'twitter', content, displayName, handle, likes, source }) {
  return (
    <article className="social-image-canvas social-x-canvas" data-social-platform="x">
      <header className="social-x-header">
        <img className="social-x-avatar" src={avatarUrl} alt="" />
        <div className="social-x-identity">
          <strong>{displayName}</strong>
          <span>{handle}</span>
        </div>
        {brandVariant === 'x'
          ? <XBrandMark className="social-x-mark social-x-legacy-mark" />
          : <BrandIcon brand="x" className="social-x-mark social-twitter-bird-mark" visualHeight={54} />}
      </header>
      <div className="social-x-copy"><XCopy content={content} /></div>
      <footer className="social-x-footer">
        <span>{likes}</span>
        <span>{source}</span>
      </footer>
    </article>
  )
}

function ZhihuImageCanvas ({ articleTitle, author, avatarUrl, content, language, qrImageUrl, scanSupport, themeId }) {
  const theme = resolveZhihuTheme(themeId)
  const style = {
    '--zhihu-main': theme.main,
    '--zhihu-text': theme.text,
    '--zhihu-quote': theme.quote,
    '--zhihu-author': theme.author,
    '--zhihu-brand': theme.brand,
    '--zhihu-footer': theme.footer,
    '--zhihu-footer-text': theme.footerText,
    '--zhihu-footer-muted': theme.footerMuted
  }
  return (
    <article className="social-image-canvas social-zhihu-canvas" data-social-platform="zhihu" style={style}>
      <section className="social-zhihu-main">
        <div className="social-zhihu-quote" aria-hidden="true">“</div>
        <div className="social-zhihu-copy">{content}</div>
        <div className="social-zhihu-attribution">
          <div className="social-zhihu-author">
            <img src={avatarUrl} alt="" />
            <strong>{author}</strong>
          </div>
          <div className="social-zhihu-brand">知乎</div>
        </div>
      </section>
      <footer className="social-zhihu-footer">
        <div className="social-zhihu-notch" aria-hidden="true" />
        <div className="social-zhihu-footer-copy">
          <strong>{articleTitle}</strong>
          <span>{scanSupport}</span>
        </div>
        <WechatDonationQr className="social-zhihu-qr" imageUrl={qrImageUrl} />
      </footer>
    </article>
  )
}

function WechatImageCanvas ({ author, avatarUrl, content, footerTitle, highlightRange, language, qrImageUrl }) {
  // 将高亮范围限制在正文长度内，防止外部状态越界后 slice 产生错误的视觉范围。
  const start = Math.max(0, Math.min(content.length, Number(highlightRange?.[0]) || 0))
  const end = Math.max(start, Math.min(content.length, Number(highlightRange?.[1]) || 0))
  return (
    <article className="social-image-canvas social-wechat-canvas" data-social-platform="wechat">
      <div className="social-wechat-copy-wrap">
        <div className="social-wechat-copy social-wechat-faded">{content}</div>
        <div className="social-wechat-fade-overlay" aria-hidden="true" />
        <div className="social-wechat-copy social-wechat-emphasis" aria-hidden="true">
          <span>{content.slice(0, start)}</span>
          <strong>{content.slice(start, end)}</strong>
          <span>{content.slice(end)}</span>
        </div>
      </div>
      <footer className="social-wechat-footer">
        <div className="social-wechat-profile">
          <img src={avatarUrl} alt="" />
          <div>
            <div className="social-wechat-author"><strong>{author}</strong><VerifiedBadge language={language} /></div>
            <div className="social-wechat-title">{footerTitle}</div>
          </div>
        </div>
        <WechatDonationQr className="social-wechat-qr" imageUrl={qrImageUrl} />
      </footer>
    </article>
  )
}

function SocialImageCanvas ({ kind, ...props }) {
  if (kind === 'x') return <XImageCanvas {...props} />
  if (kind === 'wechat') return <WechatImageCanvas {...props} />
  return <ZhihuImageCanvas {...props} />
}

export default memo(SocialImageCanvas)
