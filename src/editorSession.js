import { normalizeCodeLanguage, normalizeEditorMode } from './editorMode'

export function createPersistenceTask (session) {
  if (!session || typeof session.content !== 'string') return null
  return {
    historyId: typeof session.historyId === 'string' ? session.historyId : null,
    content: session.content,
    dirty: session.dirty === true,
    editorMode: normalizeEditorMode(session.editorMode),
    codeLanguage: normalizeCodeLanguage(session.codeLanguage),
    autoSaveEntries: session.autoSaveEntries === true,
    revision: Number.isFinite(Number(session.revision)) ? Number(session.revision) : 0
  }
}

export function isPersistenceTaskCurrent (task, session) {
  if (!task) return false
  return task.historyId === (session.historyId || null) &&
    task.content === session.content &&
    task.dirty === (session.dirty === true) &&
    task.editorMode === normalizeEditorMode(session.editorMode) &&
    task.codeLanguage === normalizeCodeLanguage(session.codeLanguage) &&
    task.autoSaveEntries === (session.autoSaveEntries === true) &&
    task.revision === Number(session.revision)
}
