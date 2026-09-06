import TwitterIcon from '@mui/icons-material/Twitter'
import { siWechat, siXiaohongshu, siZhihu } from 'simple-icons'

const BRAND_ICONS = Object.freeze({
  wechat: siWechat,
  xiaohongshu: siXiaohongshu,
  zhihu: siZhihu
})

// 按图标实际可见内容裁剪源 viewBox，使不同品牌图标设置为 1em 时具有一致的视觉高度。
const BRAND_GEOMETRY = Object.freeze({
  wechat: { viewBox: '0 2.188 24 19.624', width: 24 / 19.624 },
  xiaohongshu: { viewBox: '0 7.714 24 8.571', width: 24 / 8.571 },
  zhihu: { viewBox: '0 0 24 24', width: 1 }
})

const TWITTER_BLUE = '#1D9BF0'

export function getBrandColor (brand) {
  if (brand === 'x') return TWITTER_BLUE
  const icon = BRAND_ICONS[brand]
  return icon ? `#${icon.hex}` : 'currentColor'
}

export function XBrandMark ({ className = '', color = 'currentColor', title }) {
  return (
    <svg
      className={`brand-icon brand-icon-x-mark${className ? ` ${className}` : ''}`}
      viewBox="0 0 24 24"
      style={{ color, display: 'block', flex: '0 0 auto' }}
      focusable="false"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function getDimensions (widthRatio, visualHeight) {
  if (visualHeight == null) return { width: `${widthRatio}em`, height: '1em' }
  return { width: widthRatio * visualHeight, height: visualHeight }
}

export default function BrandIcon ({ brand, className = '', color, title, visualHeight }) {
  const resolvedColor = color || getBrandColor(brand)
  const sharedProps = {
    className: `brand-icon brand-icon-${brand}${className ? ` ${className}` : ''}`,
    'data-brand-logo': brand,
    focusable: 'false',
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : undefined
  }
  if (brand === 'x') {
    const dimensions = getDimensions(20.92 / 17, visualHeight)
    return (
      <TwitterIcon
        {...sharedProps}
        titleAccess={title}
        viewBox="1.54 4 20.92 17"
        style={{ color: resolvedColor, display: 'block', flex: '0 0 auto', ...dimensions }}
      />
    )
  }
  const icon = BRAND_ICONS[brand]
  if (!icon) return null
  const geometry = BRAND_GEOMETRY[brand]
  const dimensions = getDimensions(geometry.width, visualHeight)
  return (
    <svg
      {...sharedProps}
      viewBox={geometry.viewBox}
      width={dimensions.width}
      height={dimensions.height}
      style={{ color: resolvedColor, display: 'block', flex: '0 0 auto' }}
    >
      {title ? <title>{title}</title> : null}
      <path fill="currentColor" d={icon.path} />
    </svg>
  )
}
