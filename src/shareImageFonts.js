const SYSTEM_UI_FONT = 'System UI'

const TEMPLATE_FONT_CHAINS = Object.freeze({
  default: {
    body: ['OPPOSans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei'],
    heading: ['OPPOSans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei']
  },
  'smartisan-dark': {
    body: ['OPPOSans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei'],
    heading: ['OPPOSans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei']
  },
  'apple-notes-light': {
    body: ['SF Pro Text', 'SF Pro SC', 'PingFang SC', 'Microsoft YaHei'],
    heading: ['SF Pro Text', 'SF Pro SC', 'PingFang SC', 'Microsoft YaHei'],
    systemFirstOnMac: true
  },
  'apple-notes': {
    body: ['SF Pro Text', 'SF Pro SC', 'PingFang SC', 'Microsoft YaHei'],
    heading: ['SF Pro Text', 'SF Pro SC', 'PingFang SC', 'Microsoft YaHei'],
    systemFirstOnMac: true
  },
  bear: {
    body: ['Avenir Next', 'Avenir', 'PingFang SC', 'Microsoft YaHei'],
    heading: ['Avenir Next', 'Avenir', 'PingFang SC', 'Microsoft YaHei'],
    systemBeforeCjkOnMac: true
  },
  telegraph: {
    body: ['Georgia', 'Cambria', 'Times New Roman', 'Noto Serif SC', 'Songti SC'],
    heading: ['Lucida Grande', 'PingFang SC', 'Microsoft YaHei'],
    headingSystemOnMac: true
  }
})

function installedFamilyMap (families) {
  const installed = new Map()
  ;(Array.isArray(families) ? families : []).forEach(value => {
    const family = typeof value === 'string' ? value.trim() : value?.family?.trim()
    if (family && !installed.has(family.toLocaleLowerCase())) installed.set(family.toLocaleLowerCase(), family)
  })
  return installed
}

function firstInstalled (candidates, installed, fallback = '') {
  for (const candidate of candidates) {
    const match = installed.get(candidate.toLocaleLowerCase())
    if (match) return match
  }
  return fallback || candidates[candidates.length - 1] || SYSTEM_UI_FONT
}

export function resolveNoteTemplateFonts (
  templateId,
  localFonts,
  platform = typeof navigator === 'undefined' ? '' : navigator.platform
) {
  const chains = TEMPLATE_FONT_CHAINS[templateId] || TEMPLATE_FONT_CHAINS.default
  const installed = installedFamilyMap(localFonts)
  const isMac = /Mac|iPhone|iPad|iPod/i.test(String(platform || ''))
  const body = chains.systemFirstOnMac && isMac
    ? SYSTEM_UI_FONT
    : chains.systemBeforeCjkOnMac && isMac && !firstInstalled(chains.body.slice(0, 2), installed)
      ? SYSTEM_UI_FONT
      : firstInstalled(chains.body, installed)
  const heading = chains.headingSystemOnMac && isMac
    ? firstInstalled(['Lucida Grande'], installed, SYSTEM_UI_FONT)
    : firstInstalled(chains.heading, installed, body)
  return { body, heading }
}

export function formatNoteTemplateFontLabel (baseLabel, fonts) {
  const details = fonts.heading && fonts.heading !== fonts.body
    ? `${fonts.body} / ${fonts.heading}`
    : fonts.body
  return `${baseLabel} (${details})`
}
