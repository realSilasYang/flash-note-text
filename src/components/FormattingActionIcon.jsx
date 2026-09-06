import CloseIcon from '@mui/icons-material/Close'
import SpaceBarIcon from '@mui/icons-material/SpaceBar'
import Box from '@mui/material/Box'
import SvgIcon from '@mui/material/SvgIcon'

const iconBoxSx = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  flex: '0 0 auto',
  color: 'inherit',
  lineHeight: 1
}

function WhitespaceDeleteIcon ({ kind }) {
  if (kind === 'removeHalfwidthSpaces') {
    return (
      <Box component="span" data-formatting-icon={kind} sx={{ ...iconBoxSx, transform: 'translateX(0.5px)' }}>
        <SpaceBarIcon sx={{ fontSize: '20px !important' }} />
        <Box
          component="span"
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left: 1,
            top: 11,
            width: 22,
            borderTop: '2px solid currentColor',
            transform: 'rotate(-42deg)'
          }}
        />
      </Box>
    )
  }

  return (
    <Box component="span" data-formatting-icon={kind} sx={{ ...iconBoxSx, transform: 'translateX(-2.5px)' }}>
      <Box component="span" aria-hidden="true" sx={{ fontSize: 19, fontWeight: 700, letterSpacing: -1 }}>␠</Box>
      <CloseIcon aria-hidden="true" sx={{ position: 'absolute', right: -1, top: 1, fontSize: '12px !important' }} />
    </Box>
  )
}

function BlankLinesDeleteIcon () {
  return (
    <Box component="span" data-formatting-icon="removeBlankLines" sx={{ ...iconBoxSx, transform: 'translateX(1px)' }}>
      <Box component="span" aria-hidden="true" sx={{ position: 'absolute', left: 1, top: 6, width: 14, borderTop: '2px solid currentColor' }} />
      <Box component="span" aria-hidden="true" sx={{ position: 'absolute', left: 1, top: 14, width: 14, borderTop: '2px solid currentColor' }} />
      <CloseIcon aria-hidden="true" sx={{ position: 'absolute', right: -1, top: 4, fontSize: '12px !important' }} />
    </Box>
  )
}

function TextSpacingIcon () {
  return (
    <Box
      component="span"
      data-formatting-icon="spaceCjkLatin"
      aria-hidden="true"
      sx={{ ...iconBoxSx, fontFamily: 'var(--content-font-family)', fontSize: 14, fontWeight: 700, letterSpacing: -0.6, whiteSpace: 'pre' }}
    >
      中 A
    </Box>
  )
}

function EscapedBreakIcon () {
  return (
    <Box component="span" data-formatting-icon="escapedBreaks" sx={{ ...iconBoxSx, transform: 'translateX(-0.5px)' }}>
      <SvgIcon viewBox="0 0 24 24" sx={{ fontSize: '18px !important' }}>
        <path d="M19.5 3.5V10H8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="m10.5 7.5-2.5 2.5 2.5 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4 18h12" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="m13.5 15.5 2.5 2.5-2.5 2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </SvgIcon>
    </Box>
  )
}

function PunctuationIcon ({ kind }) {
  const characters = kind === 'punctuationToCjk' ? '.→。' : '。→.'
  return (
    <Box
      component="span"
      data-formatting-icon={kind}
      aria-hidden="true"
      sx={{
        ...iconBoxSx,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: -1.2,
        whiteSpace: 'nowrap',
        transform: kind === 'punctuationToCjk' ? 'translateX(2.5px)' : 'translateX(-1.5px)'
      }}
    >
      {characters}
    </Box>
  )
}

export default function FormattingActionIcon ({ kind }) {
  if (kind === 'escapedBreaks') return <EscapedBreakIcon />
  if (kind === 'removeWhitespace' || kind === 'removeHalfwidthSpaces') return <WhitespaceDeleteIcon kind={kind} />
  if (kind === 'removeBlankLines') return <BlankLinesDeleteIcon />
  if (kind === 'spaceCjkLatin') return <TextSpacingIcon />
  if (kind === 'punctuationToCjk' || kind === 'punctuationToLatin') return <PunctuationIcon kind={kind} />
  return null
}
