import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { canStartPreviewPan, getPreviewPanContent, getPreviewPanContentRect, getPreviewPanOffset, getPreviewPanOffsetFromDelta, getPreviewPanSpringStep, hasPreviewPanMoved } from '../previewPan'

const INITIAL_FIT = { height: 0, ready: false, scale: 1, width: 0 }
const PREVIEW_ZOOM_MIN = 0.5
const PREVIEW_ZOOM_MAX = 4
const PREVIEW_ZOOM_STEP = 1.1
const PREVIEW_WHEEL_RESPONSE_MS = 80
const PREVIEW_WHEEL_SETTLE_DISTANCE = 0.15
const PREVIEW_WHEEL_SETTLE_SPEED = 0.01
const PREVIEW_WHEEL_MAX_SPEED = 1.35
const PREVIEW_WHEEL_MAX_FRAME_MS = 32
const PREVIEW_PAN_CONTENT_SELECTOR = '[data-preview-pan-content]'

function contentBoxSize (element) {
  const style = window.getComputedStyle(element)
  return {
    height: Math.max(1, element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)),
    width: Math.max(1, element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight))
  }
}

export function usePreviewZoom ({ maxZoom = PREVIEW_ZOOM_MAX, minZoom = PREVIEW_ZOOM_MIN, zoomStep = PREVIEW_ZOOM_STEP } = {}) {
  const elementRef = useRef(null)
  const panRef = useRef(null)
  const suppressClickRef = useRef(false)
  const suppressClickTimerRef = useRef(null)
  const panOffsetRef = useRef({ x: 0, y: 0 })
  const wheelTargetOffsetRef = useRef(panOffsetRef.current)
  const wheelVelocityRef = useRef({ x: 0, y: 0 })
  const wheelAnimationRef = useRef(null)
  const wheelAnimationTimeRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState(panOffsetRef.current)

  const cancelWheelAnimation = useCallback(() => {
    if (wheelAnimationRef.current !== null) {
      cancelAnimationFrame(wheelAnimationRef.current)
      wheelAnimationRef.current = null
    }
    wheelAnimationTimeRef.current = null
    wheelVelocityRef.current = { x: 0, y: 0 }
    wheelTargetOffsetRef.current = panOffsetRef.current
  }, [])

  const animateWheelToTarget = useCallback(() => {
    if (wheelAnimationRef.current !== null) return
    wheelAnimationTimeRef.current = performance.now()
    const tick = now => {
      const elapsed = Math.min(PREVIEW_WHEEL_MAX_FRAME_MS, Math.max(0, now - wheelAnimationTimeRef.current))
      wheelAnimationTimeRef.current = now
      const targetOffset = wheelTargetOffsetRef.current
      const currentOffset = panOffsetRef.current
      const currentVelocity = wheelVelocityRef.current
      const remainingX = targetOffset.x - currentOffset.x
      const remainingY = targetOffset.y - currentOffset.y
      if (
        Math.hypot(remainingX, remainingY) <= PREVIEW_WHEEL_SETTLE_DISTANCE &&
        Math.hypot(currentVelocity.x, currentVelocity.y) <= PREVIEW_WHEEL_SETTLE_SPEED
      ) {
        const settledOffset = { ...targetOffset }
        panOffsetRef.current = settledOffset
        wheelTargetOffsetRef.current = settledOffset
        wheelVelocityRef.current = { x: 0, y: 0 }
        wheelAnimationRef.current = null
        wheelAnimationTimeRef.current = null
        setPanOffset(settledOffset)
        return
      }
      const next = getPreviewPanSpringStep(
        currentOffset,
        targetOffset,
        currentVelocity,
        elapsed,
        PREVIEW_WHEEL_RESPONSE_MS,
        PREVIEW_WHEEL_MAX_SPEED
      )
      panOffsetRef.current = next.offset
      wheelVelocityRef.current = next.velocity
      setPanOffset(next.offset)
      wheelAnimationRef.current = requestAnimationFrame(tick)
    }
    wheelAnimationRef.current = requestAnimationFrame(tick)
  }, [])

  const stopPan = useCallback((pointerId, releaseCapture = true) => {
    const element = elementRef.current
    const pan = panRef.current
    if (!element || !pan || (pointerId !== undefined && pan.pointerId !== pointerId)) return
    panRef.current = null
    element.removeAttribute('data-preview-pan-pressed')
    element.removeAttribute('data-preview-panning')
    if (releaseCapture && element.hasPointerCapture?.(pan.pointerId)) element.releasePointerCapture(pan.pointerId)
  }, [])

  const reset = useCallback(() => {
    cancelWheelAnimation()
    stopPan()
    const nextOffset = { x: 0, y: 0 }
    panOffsetRef.current = nextOffset
    wheelTargetOffsetRef.current = nextOffset
    setPanOffset(nextOffset)
    setZoom(1)
  }, [cancelWheelAnimation, stopPan])

  const onWheel = useCallback(event => {
    const element = elementRef.current
    if (!element) return
    if (event.ctrlKey) {
      event.preventDefault()
      if (event.deltaY === 0) return
      cancelWheelAnimation()
      const factor = event.deltaY < 0 ? zoomStep : 1 / zoomStep
      setZoom(current => Math.min(maxZoom, Math.max(minZoom, current * factor)))
      return
    }

    const content = element.querySelector(PREVIEW_PAN_CONTENT_SELECTOR)
    const contentRect = content && getPreviewPanContentRect(content)
    if (!contentRect || (event.deltaX === 0 && event.deltaY === 0)) return
    event.preventDefault()
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
    const currentOffset = wheelTargetOffsetRef.current
    const pendingX = currentOffset.x - panOffsetRef.current.x
    const pendingY = currentOffset.y - panOffsetRef.current.y
    const targetContentRect = {
      bottom: contentRect.bottom + pendingY,
      height: contentRect.height,
      left: contentRect.left + pendingX,
      right: contentRect.right + pendingX,
      top: contentRect.top + pendingY,
      width: contentRect.width
    }
    const nextOffset = getPreviewPanOffsetFromDelta({
      contentRect: targetContentRect,
      offsetX: currentOffset.x,
      offsetY: currentOffset.y,
      viewportHeight: element.clientHeight,
      viewportRect: element.getBoundingClientRect(),
      viewportWidth: element.clientWidth
    }, -event.deltaX * multiplier, -event.deltaY * multiplier)
    if (nextOffset.x === currentOffset.x && nextOffset.y === currentOffset.y) return
    wheelTargetOffsetRef.current = nextOffset
    animateWheelToTarget()
  }, [animateWheelToTarget, cancelWheelAnimation, maxZoom, minZoom, zoomStep])

  const onPointerDown = useCallback(event => {
    const element = elementRef.current
    if (!canStartPreviewPan(event, element)) return
    const content = getPreviewPanContent(event, element)
    const contentRect = content && getPreviewPanContentRect(content)
    if (!contentRect) return
    event.preventDefault()
    cancelWheelAnimation()
    const viewportRect = element.getBoundingClientRect()
    panRef.current = {
      active: false,
      clientX: event.clientX,
      clientY: event.clientY,
      contentRect,
      offsetX: panOffsetRef.current.x,
      offsetY: panOffsetRef.current.y,
      pointerId: event.pointerId,
      viewportHeight: element.clientHeight,
      viewportRect,
      viewportWidth: element.clientWidth
    }
    element.setAttribute('data-preview-pan-pressed', '')
  }, [cancelWheelAnimation])

  const onPointerMove = useCallback(event => {
    const element = elementRef.current
    const pan = panRef.current
    if (!element || !pan || pan.pointerId !== event.pointerId) return
    if (!pan.active) {
      if (!hasPreviewPanMoved(pan, event)) return
      pan.active = true
      element.setAttribute('data-preview-panning', '')
      element.setPointerCapture?.(event.pointerId)
    }
    event.preventDefault()
    const nextOffset = getPreviewPanOffset(pan, event)
    panOffsetRef.current = nextOffset
    wheelTargetOffsetRef.current = nextOffset
    setPanOffset(nextOffset)
  }, [])

  const onPointerUp = useCallback(event => {
    const active = panRef.current?.pointerId === event.pointerId && panRef.current.active
    stopPan(event.pointerId)
    if (!active) return
    suppressClickRef.current = true
    if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current)
    suppressClickTimerRef.current = setTimeout(() => {
      suppressClickRef.current = false
      suppressClickTimerRef.current = null
    }, 0)
  }, [stopPan])
  const onLostPointerCapture = useCallback(event => stopPan(event.pointerId, false), [stopPan])
  const onClickCapture = useCallback(event => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }, [])

  const viewportRef = useCallback(element => {
    if (elementRef.current === element) return
    const previousElement = elementRef.current
    if (previousElement) {
      cancelWheelAnimation()
      stopPan(undefined, false)
      previousElement.removeAttribute('data-preview-pan-viewport')
      previousElement.removeEventListener('wheel', onWheel)
      previousElement.removeEventListener('pointerdown', onPointerDown)
      previousElement.removeEventListener('pointermove', onPointerMove)
      previousElement.removeEventListener('lostpointercapture', onLostPointerCapture)
      previousElement.removeEventListener('click', onClickCapture, true)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
    elementRef.current = element
    if (!element) return
    element.setAttribute('data-preview-pan-viewport', '')
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('pointerdown', onPointerDown)
    element.addEventListener('pointermove', onPointerMove)
    element.addEventListener('lostpointercapture', onLostPointerCapture)
    element.addEventListener('click', onClickCapture, true)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }, [cancelWheelAnimation, onClickCapture, onLostPointerCapture, onPointerDown, onPointerMove, onPointerUp, onWheel, stopPan])

  useEffect(() => () => {
    const element = elementRef.current
    if (!element) return
    cancelWheelAnimation()
    stopPan(undefined, false)
    element.removeAttribute('data-preview-pan-viewport')
    element.removeEventListener('wheel', onWheel)
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('lostpointercapture', onLostPointerCapture)
    element.removeEventListener('click', onClickCapture, true)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    if (suppressClickTimerRef.current) clearTimeout(suppressClickTimerRef.current)
    elementRef.current = null
  }, [cancelWheelAnimation, onClickCapture, onLostPointerCapture, onPointerDown, onPointerMove, onPointerUp, onWheel, stopPan])

  const isModified = zoom !== 1 || panOffset.x !== 0 || panOffset.y !== 0
  return { isModified, panOffset, reset, viewportRef, zoom }
}

export function usePreviewFit (zoomOptions) {
  const viewportElementRef = useRef(null)
  const contentRef = useRef(null)
  const [fit, setFit] = useState(INITIAL_FIT)
  const { isModified, panOffset, reset, viewportRef: zoomViewportRef, zoom } = usePreviewZoom(zoomOptions)
  const viewportRef = useCallback(element => {
    viewportElementRef.current = element
    zoomViewportRef(element)
  }, [zoomViewportRef])

  const measure = useCallback(() => {
    const viewport = viewportElementRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const available = contentBoxSize(viewport)
    const width = Math.max(1, content.offsetWidth)
    const height = Math.max(1, content.offsetHeight)
    const scale = Math.min(1, available.width / width, available.height / height)

    setFit(current => {
      if (
        current.ready &&
        current.width === width &&
        current.height === height &&
        Math.abs(current.scale - scale) < 0.001
      ) return current
      return { height, ready: true, scale, width }
    })
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportElementRef.current
    const content = contentRef.current
    if (!viewport || !content) return undefined

    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)
    measure()

    let cancelled = false
    document.fonts?.ready?.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [measure])

  return {
    contentRef,
    contentStyle: {
      transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${fit.scale * zoom})`,
      visibility: fit.ready ? 'visible' : 'hidden'
    },
    fit,
    isLargeContent: fit.width * fit.height >= 8_000_000 || fit.height >= 8192,
    frameStyle: {
      height: fit.ready ? fit.height * fit.scale * zoom : 0,
      width: fit.ready ? fit.width * fit.scale * zoom : 0
    },
    isModified,
    reset,
    zoom,
    viewportRef
  }
}
