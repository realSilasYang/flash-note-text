import { memo } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

function PreviewResetButton ({ label, onReset, visible }) {
  if (!visible) return null
  return (
    <Tooltip title={label}>
      <IconButton
        className="preview-reset-button"
        data-preview-pan-ignore=""
        size="small"
        aria-label={label}
        onClick={onReset}
      >
        <RestartAltIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

export default memo(PreviewResetButton)
