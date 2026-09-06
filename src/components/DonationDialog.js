import { memo, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { t } from '../locales'
import { WECHAT_DONATION_QR_LIGHT_SRC, WECHAT_DONATION_QR_SRC } from '../donationAssets'

function DonationQrCode ({ isDark, label, language, lightSrc, src }) {
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setMissing(false)
  }, [isDark, lightSrc, src])

  return (
    <Box sx={{ minWidth: 0, textAlign: 'center' }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      {missing ? (
        <Box
          sx={{
            width: 180,
            maxWidth: '100%',
            aspectRatio: '1',
            mx: 'auto',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            color: 'text.secondary'
          }}
        >
          <Typography variant="body2">{t(language, 'donation.qrMissing')}</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            width: 180,
            maxWidth: '100%',
            aspectRatio: '1',
            mx: 'auto',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: isDark ? 'transparent' : '#f2f2f0'
          }}
        >
          <Box
            component="img"
            src={isDark ? src : lightSrc}
            alt={label}
            onError={() => setMissing(true)}
            sx={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: isDark ? 'none' : 'invert(1) hue-rotate(180deg) contrast(1.35)'
            }}
          />
          {!isDark ? (
            <Box
              component="img"
              src={lightSrc}
              alt=""
              aria-hidden="true"
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                clipPath: 'inset(39% 39% 39% 39%)'
              }}
            />
          ) : null}
        </Box>
      )}
    </Box>
  )
}

function DonationDialog ({ isDark, language, onClose, onEntered, onExited, open }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableRestoreFocus
      aria-labelledby="donation-dialog-title"
      slotProps={{ transition: { onEntered, onExited } }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundImage: 'none',
          bgcolor: isDark ? '#2b2b2b' : '#FDFBF7'
        }
      }}
    >
      <DialogTitle
        id="donation-dialog-title"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 1.5 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteIcon sx={{ color: 'error.main' }} />
          {t(language, 'donation.title')}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label={t(language, 'common.close')}
          sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, pt: 1, pb: 3 }}>
        <Typography variant="body2" sx={{ textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.75 }}>
          {t(language, 'donation.message')}
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: { xs: 2, sm: 4.5 },
            alignItems: 'start'
          }}
        >
          <DonationQrCode
            isDark={isDark}
            label={t(language, 'donation.wechatPay')}
            language={language}
            src={WECHAT_DONATION_QR_SRC}
            lightSrc={WECHAT_DONATION_QR_LIGHT_SRC}
          />
          <DonationQrCode
            isDark={isDark}
            label={t(language, 'donation.alipay')}
            language={language}
            src="./donate/alipay.png"
            lightSrc="./donate/alipay-light.png"
          />
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default memo(DonationDialog)
