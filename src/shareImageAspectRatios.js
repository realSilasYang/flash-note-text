export const SHARE_IMAGE_ASPECT_RATIOS = Object.freeze([
  { id: 'auto', width: 0, height: 0 },
  { id: 'phone-19-5-9', label: '19.5:9', width: 9, height: 19.5 },
  { id: 'phone-20-9', label: '20:9', width: 9, height: 20 },
  { id: 'tablet-4-3', label: '4:3', width: 3, height: 4 },
  { id: 'tablet-16-10', label: '16:10', width: 10, height: 16 }
])

export const SHARE_IMAGE_SHEET_WIDTH = 660

export function resolveShareImageAspectRatio (aspectRatio) {
  return SHARE_IMAGE_ASPECT_RATIOS.find(item => item.id === aspectRatio) || SHARE_IMAGE_ASPECT_RATIOS[0]
}

export function getShareImageSheetHeight (aspectRatio) {
  const resolved = typeof aspectRatio === 'string' ? resolveShareImageAspectRatio(aspectRatio) : aspectRatio
  if (!resolved?.width || !resolved?.height) return null
  return SHARE_IMAGE_SHEET_WIDTH * resolved.height / resolved.width
}
