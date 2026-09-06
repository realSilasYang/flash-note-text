import { createTheme } from '@mui/material/styles'

export const GHIBLI_COLORS = {
  PRIMARY_LIGHT: '#5D7C66',
  PRIMARY_DARK: '#8FB595',
  BG_LIGHT: '#FDFBF7',
  BG_DARK: '#2b2b2b',
  TEXT_LIGHT: '#43341B',
  TEXT_DARK: '#E2E2E2'
}

export function createGhibliTheme (isDark, fontFamily = 'system-ui, "PingFang SC", "Microsoft YaHei", "Yu Gothic UI", Meiryo, "Malgun Gothic", "Segoe UI", Arial, sans-serif') {
  const {
    PRIMARY_LIGHT,
    PRIMARY_DARK,
    BG_LIGHT,
    BG_DARK,
    TEXT_LIGHT,
    TEXT_DARK
  } = GHIBLI_COLORS

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: { main: isDark ? PRIMARY_DARK : PRIMARY_LIGHT },
      secondary: { main: '#A89F91' },
      background: {
        default: 'transparent',
        paper: isDark ? BG_DARK : BG_LIGHT
      },
      text: {
        primary: isDark ? TEXT_DARK : TEXT_LIGHT,
        secondary: isDark ? 'rgba(235, 230, 220, 0.7)' : 'rgba(67, 52, 27, 0.7)'
      },
      error: { main: isDark ? '#E57373' : '#CC7A6F' },
      divider: isDark ? 'rgba(235, 230, 220, 0.12)' : 'rgba(67, 52, 27, 0.12)'
    },
    typography: {
      fontFamily,
      fontSize: 15,
      button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
      MuiModal: {
        defaultProps: {
          disableRestoreFocus: true
        }
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: { backgroundColor: 'transparent', overflow: 'hidden' }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(67, 52, 27, 0.15)'
            },
            '&:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(67, 52, 27, 0.5)'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
              borderWidth: 2
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: 'var(--ghibli-shadow)',
            backgroundImage: 'none',
            border: isDark ? '2px solid rgba(255, 255, 255, 0.1)' : '2px solid rgba(67, 52, 27, 0.1)',
            borderRadius: 2,
            '&.ghibli-card': {
              border: isDark ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #43341B',
              borderRadius: 12
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: 'none',
            transition: 'background-color 0.2s ease, transform 0.2s ease',
            '&:hover': {
              boxShadow: 'none'
            },
            '&:active': { transform: 'translateY(1px)' }
          },
          contained: {
            boxShadow: isDark ? '2px 4px 6px rgba(0, 0, 0, 0.4)' : '2px 4px 6px rgba(67, 52, 27, 0.2)'
          }
        }
      },
      MuiIconButton: {
        defaultProps: { disableFocusRipple: true },
        styleOverrides: {
          root: {
            color: 'var(--ghibli-text)',
            boxShadow: 'none',
            transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.1)' : 'rgba(93, 124, 102, 0.1)',
              boxShadow: 'none',
              transform: 'translateY(-1px)'
            },
            '&:active': { transform: 'translateY(0)' }
          }
        }
      },
      MuiTooltip: {
        defaultProps: {
          disableFocusListener: true,
          disableInteractive: true
        },
        styleOverrides: {
          tooltip: {
            backgroundColor: '#4A6651',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 500,
            borderRadius: 6,
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(93, 124, 102, 0.3)'
          },
          arrow: { color: '#4A6651' }
        }
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            top: '24px !important',
            left: '50% !important',
            transform: 'translateX(-50%) !important'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundImage: 'none',
            border: 'none !important'
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(67, 52, 27, 0.12)',
            boxShadow: 'var(--ghibli-shadow-hover)'
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '2px 4px',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.15)' : 'rgba(93, 124, 102, 0.15)'
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.25)' : 'rgba(93, 124, 102, 0.25)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(143, 181, 149, 0.35)' : 'rgba(93, 124, 102, 0.35)'
              }
            }
          }
        }
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            overflow: 'hidden'
          }
        }
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(67, 52, 27, 0.15)',
            borderRadius: 8,
            color: isDark ? 'rgba(235, 230, 220, 0.7)' : 'rgba(67, 52, 27, 0.7)',
            textTransform: 'none',
            transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.15)' : 'rgba(93, 124, 102, 0.1)',
              boxShadow: 'none'
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.25)' : 'rgba(93, 124, 102, 0.18)',
              borderColor: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
              color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
              '&:hover': {
                backgroundColor: isDark ? 'rgba(143, 181, 149, 0.35)' : 'rgba(93, 124, 102, 0.25)'
              }
            }
          }
        }
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
              '& + .MuiSwitch-track': {
                backgroundColor: isDark ? PRIMARY_DARK : PRIMARY_LIGHT,
                opacity: 0.55
              }
            }
          },
          track: {
            backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(67,52,27,0.25)'
          }
        }
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(67,52,27,0.4)',
            '&.Mui-checked': { color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT }
          }
        }
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: 'var(--ghibli-shadow)'
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: 'background-color 0.2s ease, transform 0.2s ease',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.1)' : 'rgba(93, 124, 102, 0.1)',
              boxShadow: 'none'
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? 'rgba(143, 181, 149, 0.25)' : 'rgba(93, 124, 102, 0.25)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(143, 181, 149, 0.35)' : 'rgba(93, 124, 102, 0.35)'
              }
            }
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          thumb: {
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            '&:hover, &.Mui-focusVisible': { boxShadow: '0 0 0 6px rgba(143, 181, 149, 0.16)' }
          }
        }
      }
    }
  })
}
