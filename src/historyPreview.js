import { AUTO_HISTORY_TITLE_LENGTH } from './constants'
import { t } from './locales'
import { getFirstNonEmptyLine } from './textMetrics'

function getCustomTitle (item) {
  return typeof item.title === 'string' ? item.title.trim() : ''
}

function getFirstContentLine (item, language) {
  const firstContentLine = typeof item.autoTitle === 'string' && item.autoTitle.trim()
    ? item.autoTitle.trim()
    : getFirstNonEmptyLine(item.content)
  const normalizedLanguage = typeof language === 'boolean' ? (language ? 'en' : 'zh-CN') : language
  return firstContentLine || t(normalizedLanguage, 'editor.noContent')
}

export function getHistoryEntryFullTitle (item, language) {
  return getCustomTitle(item) || getFirstContentLine(item, language)
}

export function getHistoryEntryDisplayName (item, language) {
  const customTitle = getCustomTitle(item)
  if (customTitle) return customTitle
  return Array.from(getFirstContentLine(item, language)).slice(0, AUTO_HISTORY_TITLE_LENGTH).join('')
}

export function getHistoryPreviewHeading (item) {
  return getCustomTitle(item)
}
