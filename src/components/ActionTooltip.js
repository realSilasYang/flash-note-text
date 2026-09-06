import { cloneElement, memo, useCallback, useEffect, useRef, useState } from 'react'
import Tooltip from '@mui/material/Tooltip'

function ActionTooltip ({ children, ...props }) {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const dismissedTargetRef = useRef(null)

  const handleOpen = useCallback(() => {
    if (!dismissed) setOpen(true)
  }, [dismissed])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!dismissed) return undefined
    const handlePointerMove = event => {
      const target = dismissedTargetRef.current
      if (!target?.isConnected) {
        dismissedTargetRef.current = null
        setDismissed(false)
        return
      }
      const rect = target.getBoundingClientRect()
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
      if (outside) {
        dismissedTargetRef.current = null
        setDismissed(false)
      }
    }
    document.addEventListener('pointermove', handlePointerMove, true)
    return () => document.removeEventListener('pointermove', handlePointerMove, true)
  }, [dismissed])

  const child = cloneElement(children, {
    onPointerEnter: event => {
      children.props.onPointerEnter?.(event)
      if (!dismissed) setOpen(true)
    },
    onPointerLeave: event => {
      children.props.onPointerLeave?.(event)
      setOpen(false)
    },
    onClickCapture: event => {
      children.props.onClickCapture?.(event)
      dismissedTargetRef.current = event.currentTarget
      handleDismiss()
    }
  })

  return (
    <Tooltip
      {...props}
      disableFocusListener
      disableHoverListener
      open={open && !dismissed}
      onClose={() => setOpen(false)}
      onOpen={handleOpen}
    >
      {child}
    </Tooltip>
  )
}

export default memo(ActionTooltip)
