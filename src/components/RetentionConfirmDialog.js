import { memo } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import { t } from '../locales'

function RetentionConfirmDialog ({ count, language, onCancel, onConfirm, open }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle>{t(language, 'dialogs.retentionTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t(language, 'dialogs.retentionBody', { count })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t(language, 'common.cancel')}</Button>
        <Button color="error" variant="contained" onClick={onConfirm} autoFocus>
          {t(language, 'common.applyRemove')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default memo(RetentionConfirmDialog)
