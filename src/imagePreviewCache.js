const xiaohongshuPreviewCache = new Map()

function normalizeColor (color) {
  return String(color || '').trim().toUpperCase()
}

export function getXiaohongshuLongVariantKey (templateName, color) {
  return JSON.stringify([String(templateName || ''), normalizeColor(color)])
}

function getCacheKey (initialData) {
  const entryId = String(initialData?.entryId || 'current-entry')
  const kind = initialData?.kind === 'xiaohongshu-long' ? 'long' : 'cards'
  return `${entryId}:${kind}`
}

function getSourceSignature (initialData) {
  return JSON.stringify([
    String(initialData?.title || ''),
    String(initialData?.content || ''),
    String(initialData?.editorMode || 'text')
  ])
}

function ensureCache (initialData) {
  const key = getCacheKey(initialData)
  const sourceSignature = getSourceSignature(initialData)
  let cached = xiaohongshuPreviewCache.get(key)
  if (!cached || cached.sourceSignature !== sourceSignature) {
    cached = {
      sourceSignature,
      cards: [],
      cardColorOffsets: new Map(),
      longTemplates: [],
      longTemplateCards: new Map(),
      selectedCardId: '',
      selectedLongTemplateName: '',
      selectedLongTemplateColor: ''
    }
    xiaohongshuPreviewCache.set(key, cached)
  }
  return cached
}

export function getXiaohongshuPreviewCache (initialData) {
  const key = getCacheKey(initialData)
  const cached = xiaohongshuPreviewCache.get(key)
  if (!cached || cached.sourceSignature !== getSourceSignature(initialData)) return null
  return cached
}

export function cacheXiaohongshuCards (initialData, cards) {
  const cached = ensureCache(initialData)
  cached.cards = Array.isArray(cards) ? cards : []
  return cached
}

export function cacheXiaohongshuCardColorOffset (initialData, cardName, offset) {
  const cached = ensureCache(initialData)
  const name = String(cardName || '')
  const normalizedOffset = Math.max(0, Number(offset) || 0)
  if (name) cached.cardColorOffsets.set(name, normalizedOffset)
  return cached
}

export function clearXiaohongshuCardColorOffsets (initialData) {
  const cached = ensureCache(initialData)
  cached.cardColorOffsets.clear()
  return cached
}

export function cacheXiaohongshuLongTemplates (initialData, templates) {
  const cached = ensureCache(initialData)
  cached.longTemplates = Array.isArray(templates) ? templates : []
  return cached
}

export function cacheXiaohongshuLongTemplateCards (initialData, templateName, color, cards) {
  const cached = ensureCache(initialData)
  const name = String(templateName || '')
  if (name && Array.isArray(cards) && cards.length > 0) {
    cached.longTemplateCards.set(getXiaohongshuLongVariantKey(name, color), cards)
    cached.selectedLongTemplateName = name
    cached.selectedLongTemplateColor = normalizeColor(color)
  }
  return cached
}

export function cacheXiaohongshuSelection (initialData, { cardId, templateColor, templateName } = {}) {
  const cached = ensureCache(initialData)
  if (typeof cardId === 'string') cached.selectedCardId = cardId
  if (typeof templateName === 'string' && templateName) cached.selectedLongTemplateName = templateName
  if (typeof templateColor === 'string') cached.selectedLongTemplateColor = normalizeColor(templateColor)
  return cached
}
