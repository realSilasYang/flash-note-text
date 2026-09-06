import { memo } from 'react'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

export const StudioHeader = memo(function StudioHeader ({ actions, closeLabel, icon, onClose, title }) {
  return (
    <header className="share-studio-header">
      <div className="share-studio-heading">
        {icon}
        <span>{title}</span>
      </div>
      <div className="share-studio-header-actions">
        {actions}
        <IconButton className="share-studio-close" size="small" onClick={onClose} aria-label={closeLabel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    </header>
  )
})

export const StudioControl = memo(function StudioControl ({ children, className = '', label }) {
  return (
    <div className={`share-studio-control ${className}`.trim()}>
      <strong className="share-studio-control-label">{label}</strong>
      <div className="share-studio-control-body">{children}</div>
    </div>
  )
})
