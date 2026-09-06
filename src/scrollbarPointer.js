const DEFAULT_SCROLLBAR_SIZE = 12

function allowsScrollbar (element, axis) {
  const view = element?.ownerDocument?.defaultView
  const overflow = view?.getComputedStyle?.(element)?.[axis === 'vertical' ? 'overflowY' : 'overflowX']
  return !overflow || overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay'
}

export function isPointerWithinScrollbar (element, clientX, clientY, fallbackSize = DEFAULT_SCROLLBAR_SIZE) {
  if (!element?.getBoundingClientRect) return false
  const rect = element.getBoundingClientRect()
  const insideX = clientX >= rect.left && clientX <= rect.right
  const insideY = clientY >= rect.top && clientY <= rect.bottom
  if (!insideX || !insideY) return false

  const hasVerticalScrollbar = allowsScrollbar(element, 'vertical') && element.scrollHeight > element.clientHeight + 1
  const hasHorizontalScrollbar = allowsScrollbar(element, 'horizontal') && element.scrollWidth > element.clientWidth + 1
  const verticalSize = Math.max(element.offsetWidth - element.clientWidth, fallbackSize)
  const horizontalSize = Math.max(element.offsetHeight - element.clientHeight, fallbackSize)

  return (hasVerticalScrollbar && clientX >= rect.right - verticalSize) ||
    (hasHorizontalScrollbar && clientY >= rect.bottom - horizontalSize)
}

export function findScrollbarUnderPointer (root, target, clientX, clientY) {
  let element = target
  while (element && root?.contains?.(element)) {
    if (isPointerWithinScrollbar(element, clientX, clientY)) return element
    if (element === root) break
    element = element.parentElement
  }
  return null
}
