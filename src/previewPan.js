const PREVIEW_PAN_CONTENT_SELECTOR = '[data-preview-pan-content]'
const PREVIEW_PAN_IGNORE_SELECTOR = '[data-preview-pan-ignore]'

export function getPreviewPanContentRect (target) {
  const rect = target.getBoundingClientRect()
  if (!target?.hasAttribute?.('data-preview-pan-contained-image')) return rect
  const naturalWidth = Number(target.naturalWidth)
  const naturalHeight = Number(target.naturalHeight)
  if (!(naturalWidth > 0) || !(naturalHeight > 0)) return null

  const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight)
  const renderedWidth = naturalWidth * scale
  const renderedHeight = naturalHeight * scale
  const renderedLeft = rect.left + (rect.width - renderedWidth) / 2
  const renderedTop = rect.top + (rect.height - renderedHeight) / 2
  return {
    bottom: renderedTop + renderedHeight,
    height: renderedHeight,
    left: renderedLeft,
    right: renderedLeft + renderedWidth,
    top: renderedTop,
    width: renderedWidth
  }
}

export function getPreviewPanContent (event, viewport) {
  const target = event?.target?.nodeType === 3 ? event.target.parentElement : event?.target
  if (!target?.closest || target.closest(PREVIEW_PAN_IGNORE_SELECTOR)) return null
  const content = target.closest(PREVIEW_PAN_CONTENT_SELECTOR)
  return content && viewport?.contains?.(content) ? content : null
}

export function canStartPreviewPan (event, viewport) {
  if (!event || !viewport || event.button !== 0 || event.isPrimary === false) return false
  const content = getPreviewPanContent(event, viewport)
  const contentRect = content && getPreviewPanContentRect(content)
  if (!contentRect) return false

  const rect = viewport.getBoundingClientRect()
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  const insideViewport = offsetX >= 0 && offsetY >= 0 && offsetX < viewport.clientWidth && offsetY < viewport.clientHeight
  const insideContent = event.clientX >= contentRect.left && event.clientX < contentRect.right &&
    event.clientY >= contentRect.top && event.clientY < contentRect.bottom
  return insideViewport && insideContent
}

export function hasPreviewPanMoved (start, event, threshold = 4) {
  const deltaX = event.clientX - start.clientX
  const deltaY = event.clientY - start.clientY
  return deltaX * deltaX + deltaY * deltaY >= threshold * threshold
}

export function getPreviewPanSpringStep (current, target, velocity, elapsedMs, responseMs, maxSpeed = Infinity) {
  const elapsed = Math.max(0, Number(elapsedMs) || 0)
  if (elapsed === 0) return { offset: { ...current }, velocity: { ...velocity } }

  const response = Math.max(1, Number(responseMs) || 1)
  const speedLimit = Math.max(0, Number(maxSpeed) || 0)
  const omega = 2 / response
  const decayInput = omega * elapsed
  const decay = 1 / (1 + decayInput + 0.48 * decayInput ** 2 + 0.235 * decayInput ** 3)
  let changeX = current.x - target.x
  let changeY = current.y - target.y
  const changeDistance = Math.hypot(changeX, changeY)
  const maximumChange = speedLimit * response

  if (Number.isFinite(maximumChange) && changeDistance > maximumChange && changeDistance > 0) {
    const scale = maximumChange / changeDistance
    changeX *= scale
    changeY *= scale
  }

  const effectiveTarget = {
    x: current.x - changeX,
    y: current.y - changeY
  }
  const temporaryX = (velocity.x + omega * changeX) * elapsed
  const temporaryY = (velocity.y + omega * changeY) * elapsed
  const nextVelocity = {
    x: (velocity.x - omega * temporaryX) * decay,
    y: (velocity.y - omega * temporaryY) * decay
  }
  const nextOffset = {
    x: effectiveTarget.x + (changeX + temporaryX) * decay,
    y: effectiveTarget.y + (changeY + temporaryY) * decay
  }
  const passedTarget = (target.x - current.x) * (nextOffset.x - target.x) +
    (target.y - current.y) * (nextOffset.y - target.y) > 0

  if (passedTarget) return { offset: { ...target }, velocity: { x: 0, y: 0 } }
  return { offset: nextOffset, velocity: nextVelocity }
}

function clamp (value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function getAxisPanOffset ({ contentSize, contentStart, offset, pointerDelta, viewportSize, viewportStart }) {
  const contentCenter = contentStart + contentSize / 2
  const viewportEnd = viewportStart + viewportSize
  const halfContent = contentSize / 2
  const minimumCenter = contentSize <= viewportSize
    ? viewportStart + halfContent
    : viewportEnd - halfContent
  const maximumCenter = contentSize <= viewportSize
    ? viewportEnd - halfContent
    : viewportStart + halfContent
  return offset + clamp(contentCenter + pointerDelta, minimumCenter, maximumCenter) - contentCenter
}

export function getPreviewPanOffsetFromDelta (start, deltaX, deltaY) {
  return {
    x: getAxisPanOffset({
      contentSize: start.contentRect.width,
      contentStart: start.contentRect.left,
      offset: start.offsetX,
      pointerDelta: deltaX,
      viewportSize: start.viewportWidth,
      viewportStart: start.viewportRect.left
    }),
    y: getAxisPanOffset({
      contentSize: start.contentRect.height,
      contentStart: start.contentRect.top,
      offset: start.offsetY,
      pointerDelta: deltaY,
      viewportSize: start.viewportHeight,
      viewportStart: start.viewportRect.top
    })
  }
}

export function getPreviewPanOffset (start, event) {
  return getPreviewPanOffsetFromDelta(
    start,
    event.clientX - start.clientX,
    event.clientY - start.clientY
  )
}
