const MODIFIER_KEYS = new Set(['Alt', 'Control', 'Meta', 'Shift'])
const FUNCTION_KEY_PATTERN = /^F(?:[1-9]|1[0-2])$/
const RESERVED_COMMAND_KEYS = new Set([
  '/', '0', '[', ']', 'A', 'B', 'Backspace', 'C', 'Delete', 'Down', 'End',
  'Enter', 'Equals', 'F', 'G', 'H', 'Home', 'I', 'K', 'Left', 'M', 'Minus',
  'O', 'Plus', 'Q', 'Right', 'S', 'Up', 'V', 'X', 'Y', 'Z'
])
const NATIVE_TEXT_COMMAND_KEYS = new Set([
  'a', 'backspace', 'c', 'delete', 'end', 'home', 'v', 'x', 'y', 'z',
  'arrowdown', 'arrowleft', 'arrowright', 'arrowup'
])

const KEY_ALIASES = Object.freeze({
  ' ': 'Space',
  '+': 'Plus',
  '-': 'Minus',
  '=': 'Equals',
  '{': '[',
  '}': ']',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  Escape: 'Esc'
})

function normalizeKey (key) {
  const value = KEY_ALIASES[key] || key
  if (typeof value !== 'string' || !value) return ''
  return value.length === 1 ? value.toUpperCase() : value
}

export function isKeyboardEventComposing (event, compositionActive = false) {
  const nativeEvent = event?.nativeEvent
  return Boolean(
    compositionActive ||
    event?.isComposing ||
    nativeEvent?.isComposing ||
    event?.keyCode === 229 ||
    event?.which === 229 ||
    nativeEvent?.keyCode === 229 ||
    nativeEvent?.which === 229
  )
}

export function parseShortcut (value) {
  if (typeof value !== 'string') return null
  const parts = value.split('+').map(part => part.trim()).filter(Boolean)
  if (parts.length === 0) return null

  const key = normalizeKey(parts.at(-1))
  const modifiers = new Set(parts.slice(0, -1).map(part => {
    const lower = part.toLowerCase()
    if (lower === 'ctrl' || lower === 'control') return 'Ctrl'
    if (lower === 'alt') return 'Alt'
    if (lower === 'shift') return 'Shift'
    if (lower === 'meta' || lower === 'cmd' || lower === 'command') return 'Meta'
    return ''
  }))

  if (!key || MODIFIER_KEYS.has(key) || modifiers.has('') || modifiers.size !== parts.length - 1) return null
  const hasPrimaryModifier = modifiers.has('Ctrl') || modifiers.has('Alt') || modifiers.has('Meta')
  if (!hasPrimaryModifier && !FUNCTION_KEY_PATTERN.test(key)) return null
  return { key, modifiers }
}

export function formatShortcut ({ key, modifiers }) {
  const parts = []
  if (modifiers.has('Ctrl')) parts.push('Ctrl')
  if (modifiers.has('Alt')) parts.push('Alt')
  if (modifiers.has('Shift')) parts.push('Shift')
  if (modifiers.has('Meta')) parts.push('Meta')
  parts.push(key)
  return parts.join('+')
}

export function normalizeShortcut (value, fallback = 'Alt+Z') {
  const parsed = parseShortcut(value)
  return parsed ? formatShortcut(parsed) : fallback
}

export function shortcutFromKeyboardEvent (event) {
  if (isKeyboardEventComposing(event)) return null
  if (MODIFIER_KEYS.has(event.key)) return null
  const key = normalizeKey(event.key)
  if (!key) return null

  const modifiers = new Set()
  if (event.ctrlKey) modifiers.add('Ctrl')
  if (event.altKey) modifiers.add('Alt')
  if (event.shiftKey) modifiers.add('Shift')
  if (event.metaKey) modifiers.add('Meta')

  const hasPrimaryModifier = modifiers.has('Ctrl') || modifiers.has('Alt') || modifiers.has('Meta')
  if (!hasPrimaryModifier && !FUNCTION_KEY_PATTERN.test(key)) return null
  return formatShortcut({ key, modifiers })
}

export function isNativeTextEditingShortcut (event) {
  if (isKeyboardEventComposing(event)) return false
  const nativeEvent = event?.nativeEvent
  const isAltGraph = Boolean(
    event?.getModifierState?.('AltGraph') ||
    nativeEvent?.getModifierState?.('AltGraph') ||
    (event?.altKey && event?.ctrlKey && !event?.metaKey)
  )
  if (isAltGraph) return true
  if (event?.altKey) return false
  if (!event?.ctrlKey && !event?.metaKey) return false
  return NATIVE_TEXT_COMMAND_KEYS.has(String(event.key || '').toLowerCase())
}

export function eventMatchesShortcut (event, shortcut) {
  if (isKeyboardEventComposing(event)) return false
  const parsed = parseShortcut(shortcut)
  if (!parsed || normalizeKey(event.key) !== parsed.key) return false
  return event.ctrlKey === parsed.modifiers.has('Ctrl') &&
    event.altKey === parsed.modifiers.has('Alt') &&
    event.shiftKey === parsed.modifiers.has('Shift') &&
    event.metaKey === parsed.modifiers.has('Meta')
}

export function getCopyShortcutAction (event, { editorHasFocus = false, editorHasSelection = false, hasTextSelection = false, targetAcceptsText = false } = {}) {
  if (isKeyboardEventComposing(event)) return null
  const isCopyCommand = (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    String(event.key || '').toLowerCase() === 'c'
  if (!isCopyCommand) return null
  if (editorHasFocus) return editorHasSelection || hasTextSelection ? 'native' : 'copy-entry'
  return targetAcceptsText || hasTextSelection ? 'native' : 'copy-entry'
}

export function getEditingShortcutAction (event) {
  if (isKeyboardEventComposing(event) || event?.altKey || (!event?.ctrlKey && !event?.metaKey)) return null
  const key = String(event.key || '').toLowerCase()
  if (key === 'y' && !event.shiftKey) return 'delete-line'
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  return null
}

export function isReservedEditorShortcut (shortcut) {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return false
  const isMarkdownHeadingShortcut = parsed.modifiers.size === 1 && parsed.modifiers.has('Alt') && /^[0-6]$/.test(parsed.key)
  const isPotentialAltGraphShortcut = parsed.modifiers.has('Alt') && (parsed.modifiers.has('Ctrl') || parsed.modifiers.has('Meta'))
  const isCommandShortcut = (parsed.modifiers.has('Ctrl') || parsed.modifiers.has('Meta')) && !parsed.modifiers.has('Alt')
  return isMarkdownHeadingShortcut || isPotentialAltGraphShortcut || (isCommandShortcut && RESERVED_COMMAND_KEYS.has(parsed.key))
}
