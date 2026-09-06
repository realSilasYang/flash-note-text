import { memo } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import { t } from '../locales'

function GoToLineDialog ({ inputRef, language, lineCount, onChange, onClose, onConfirm, open, value }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle>{t(language, 'dialogs.goToLine')}</DialogTitle>
      <DialogContent>
        <TextField
          inputRef={inputRef}
          autoFocus
          fullWidth
          label={t(language, 'dialogs.lineNumber', { count: lineCount })}
          margin="dense"
          size="small"
          type="number"
          value={value}
          slotProps={{ htmlInput: { min: 1, max: lineCount, step: 1 } }}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              onConfirm()
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t(language, 'common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained">{t(language, 'common.go')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(GoToLineDialog)
