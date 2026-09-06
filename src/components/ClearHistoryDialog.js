import { memo } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { t } from '../locales'

function ClearHistoryDialog ({ count, language, onCancel, onConfirm, open }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle>{t(language, 'dialogs.clearTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(language, 'dialogs.clearBody', { count })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t(language, 'common.cancel')}</Button>
        <Button onClick={onConfirm} color="error">{t(language, 'common.clear')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(ClearHistoryDialog)
