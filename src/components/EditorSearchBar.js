import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Fade from '@mui/material/Fade'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Paper from '@mui/material/Paper'
import Tooltip from './ActionTooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import FindReplaceIcon from '@mui/icons-material/FindReplace'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import SearchIcon from '@mui/icons-material/Search'
import { t } from '../locales'

function EditorSearchBar ({
  currentMatch,
  language,
  matchCount,
  mode,
  onClose,
  onFindNext,
  onFindPrevious,
  onReplaceAll,
  onReplaceCurrent,
  onReplaceTextChange,
  onSearchTextChange,
  open,
  replaceInputRef,
  replaceText,
  searchInputRef,
  searchText
}) {
  const replaceMode = mode === 'replace'
  const resultLabel = searchText
    ? matchCount > 0
      ? currentMatch >= 0
        ? `${currentMatch + 1} / ${matchCount}`
        : t(language, 'search.matches', { count: matchCount })
      : t(language, 'search.noMatches')
    : ''

  const handleEscape = (event) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    onClose()
  }

  return (
    <Fade in={open} timeout={140} mountOnEnter unmountOnExit>
      <Paper
        role="search"
        aria-label={t(language, replaceMode ? 'search.findReplace' : 'search.findDocument')}
        onKeyDownCapture={handleEscape}
        elevation={8}
        sx={{
          position: 'absolute',
          zIndex: 20,
          top: 8,
          right: 12,
          width: replaceMode ? 500 : 390,
          maxWidth: 'calc(100% - 24px)',
          p: 0.75,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
          transition: 'width 140ms ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <SearchIcon sx={{ ml: 0.5, flexShrink: 0, fontSize: 19, color: 'text.secondary' }} />
          <InputBase
            inputRef={searchInputRef}
            inputProps={{ 'aria-label': t(language, 'search.find') }}
            placeholder={t(language, 'search.find')}
            value={searchText}
            onChange={event => onSearchTextChange(event.target.value)}
            onKeyDown={event => {
              if (event.key !== 'Enter') return
              event.preventDefault()
              if (event.shiftKey) onFindPrevious()
              else onFindNext()
            }}
            sx={{
              flex: 1,
              minWidth: 80,
              height: 30,
              px: 0.75,
              borderRadius: 1,
              bgcolor: 'action.hover',
              fontSize: '0.875rem'
            }}
          />
          <Typography
            aria-live="polite"
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ minWidth: 58, maxWidth: 88, textAlign: 'center' }}
          >
            {resultLabel}
          </Typography>
          <Tooltip title={t(language, 'search.previous')}>
            <span>
              <IconButton aria-label={t(language, 'search.previous')} size="small" onClick={onFindPrevious} disabled={!searchText || matchCount === 0}>
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t(language, 'search.next')}>
            <span>
              <IconButton aria-label={t(language, 'search.next')} size="small" onClick={onFindNext} disabled={!searchText || matchCount === 0}>
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t(language, 'search.close')}>
            <IconButton aria-label={t(language, 'search.closeBar')} size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {replaceMode ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, pl: 3.5 }}>
            <FindReplaceIcon sx={{ flexShrink: 0, fontSize: 18, color: 'text.secondary' }} />
            <InputBase
              inputRef={replaceInputRef}
              inputProps={{ 'aria-label': t(language, 'search.replaceWith') }}
              placeholder={t(language, 'search.replaceWith')}
              value={replaceText}
              onChange={event => onReplaceTextChange(event.target.value)}
              onKeyDown={event => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                onReplaceCurrent()
              }}
              sx={{
                flex: 1,
                minWidth: 80,
                height: 30,
                px: 0.75,
                borderRadius: 1,
                bgcolor: 'action.hover',
                fontSize: '0.875rem'
              }}
            />
            <Button size="small" onClick={onReplaceCurrent} disabled={!searchText || matchCount === 0}>
              {t(language, 'search.replace')}
            </Button>
            <Button size="small" onClick={onReplaceAll} disabled={!searchText || matchCount === 0}>
              {t(language, 'search.all')}
            </Button>
          </Box>
        ) : null}
      </Paper>
    </Fade>
  )
}

export default memo(EditorSearchBar)
