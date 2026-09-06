import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined'
import BrandIcon from './BrandIcon.jsx'

// 知乎外框按 18px 绘制，源 24 单位 viewBox 中的“知”字实际可见高度约为 14.97。
// 用这个比例计算其他品牌的缩放值，才能让所有图标的可见部分高度一致。
const SHARE_TYPE_ICON_VISUAL_HEIGHT = 11.23
const ZHIHU_FRAME_ICON_HEIGHT = 18
const EMPHASIZED_SHARE_TYPE_ICON_SCALE = 1.1

const MUI_ICON_GEOMETRY = Object.freeze({
  note: { viewBox: '3 3 18 18', width: 1 },
  aiImage: { viewBox: '3 3 18 18', width: 1 },
  code: { viewBox: '2 6 20 12', width: 20 / 12 }
})

function MuiShareTypeIcon ({ kind, Icon, visualHeight = SHARE_TYPE_ICON_VISUAL_HEIGHT }) {
  const geometry = MUI_ICON_GEOMETRY[kind]
  return (
    <Icon
      data-share-type-icon={kind}
      viewBox={geometry.viewBox}
      style={{
        display: 'block',
        flex: '0 0 auto',
        width: geometry.width * visualHeight,
        height: visualHeight
      }}
    />
  )
}

export default function ShareTypeIcon ({ kind }) {
  if (kind === 'note') return <MuiShareTypeIcon kind="note" Icon={StickyNote2OutlinedIcon} visualHeight={ZHIHU_FRAME_ICON_HEIGHT} />
  if (kind === 'ai-image') return <MuiShareTypeIcon kind="aiImage" Icon={ImageOutlinedIcon} visualHeight={ZHIHU_FRAME_ICON_HEIGHT} />
  if (kind === 'code') return <MuiShareTypeIcon kind="code" Icon={CodeOutlinedIcon} visualHeight={SHARE_TYPE_ICON_VISUAL_HEIGHT * EMPHASIZED_SHARE_TYPE_ICON_SCALE} />

  const brand = kind === 'xiaohongshu-long' ? 'xiaohongshu' : kind
  const visualHeight = brand === 'zhihu'
    ? ZHIHU_FRAME_ICON_HEIGHT * EMPHASIZED_SHARE_TYPE_ICON_SCALE
    : brand === 'xiaohongshu'
      ? SHARE_TYPE_ICON_VISUAL_HEIGHT * EMPHASIZED_SHARE_TYPE_ICON_SCALE
      : ['wechat', 'x'].includes(brand)
        ? ZHIHU_FRAME_ICON_HEIGHT
        : SHARE_TYPE_ICON_VISUAL_HEIGHT
  return <BrandIcon brand={brand} visualHeight={visualHeight} />
}
