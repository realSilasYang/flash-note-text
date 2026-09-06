import { markdownToPlainText } from './historySearch'

export const XIAOHONGSHU_HOME_URL = 'https://creator.xiaohongshu.com/'

const XIAOHONGSHU_BROWSER_ENTRY = 'xhs-browser.html'
const XIAOHONGSHU_WEBVIEW_SELECTOR = '#flash-note-xhs-webview'
// 让宿主 BrowserWindow 与嵌入的 webview 使用同一个持久化 Chromium 会话。
// 登录状态由 Chromium 统一保存 cookies、localStorage 和 IndexedDB（包括
// 其中的 HttpOnly cookies 也由 Chromium 管理，渲染层只负责发起操作，不直接接触会话凭据。
const XIAOHONGSHU_PARTITION = 'persist:flash-note-xiaohongshu'
const LOGIN_TIMEOUT = 10 * 60 * 1000
const PAGE_TIMEOUT = 60 * 1000
const GENERATION_TIMEOUT = 3 * 60 * 1000
const DIAGNOSTIC_REVISION = 'xhs-browser-window-20260816-22'

let activeGeneration = null
let activeBrowserWindow = null

function delay (milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function createCancellationError () {
  return new Error('FLASH_NOTE_XHS:CANCELLED')
}

function throwIfCancelled (signal) {
  if (signal?.aborted) throw createCancellationError()
}

function waitForAbortable (value, signal) {
  if (!signal) return Promise.resolve(value)
  if (signal.aborted) return Promise.reject(createCancellationError())
  return new Promise((resolve, reject) => {
    const handleAbort = () => {
      signal.removeEventListener('abort', handleAbort)
      reject(createCancellationError())
    }
    signal.addEventListener('abort', handleAbort, { once: true })
    Promise.resolve(value).then(result => {
      signal.removeEventListener('abort', handleAbort)
      resolve(result)
    }, error => {
      signal.removeEventListener('abort', handleAbort)
      reject(error)
    })
  })
}

function safelyRead (reader, fallback = 'unavailable') {
  try {
    const value = reader()
    return value == null || value === '' ? fallback : String(value)
  } catch (error) {
    return `读取失败：${error?.message || error}`
  }
}

function createDiagnosticTrace ({ editorMode, contentLength, generationType, onProgress, titleLength }) {
  const startedAt = Date.now()
  const utools = window.utools
  const lines = [
    'FlashNote Xiaohongshu diagnostics',
    `revision: ${DIAGNOSTIC_REVISION}`,
    `startedAt: ${new Date(startedAt).toISOString()}`,
    `uTools: ${safelyRead(() => utools?.getAppVersion?.())}`,
    `windowType: ${safelyRead(() => utools?.getWindowType?.())}`,
    `isDev: ${safelyRead(() => utools?.isDev?.())}`,
    `editorMode: ${editorMode}`,
    `generationType: ${generationType}`,
    `titleLength: ${titleLength}`,
    `contentLength: ${contentLength}`,
    `createBrowserWindow: ${typeof utools?.createBrowserWindow}`,
    'transport: createBrowserWindow + webview (uBrowser disabled)',
    'trace:'
  ]
  return {
    add (stage, detail = '') {
      const elapsed = Date.now() - startedAt
      lines.push(`  +${elapsed}ms ${stage}${detail ? ` | ${detail}` : ''}`)
      try {
        onProgress?.({ stage, detail, elapsed })
      } catch {}
    },
    format (error) {
      const name = String(error?.name || 'Error')
      const message = String(error?.message || error || '未知错误')
      const stack = String(error?.stack || '').split('\n').slice(0, 12).join('\n')
      return [
        ...lines,
        '错误：',
        `  name: ${name}`,
        `  message: ${message}`,
        stack ? `  stack:\n${stack}` : '  stack: unavailable'
      ].join('\n')
    }
  }
}

function attachDiagnostics (error, trace) {
  const normalized = error instanceof Error ? error : new Error(String(error || '未知错误'))
  const details = trace.format(normalized)
  try {
    Object.defineProperty(normalized, 'xiaohongshuDiagnostics', {
      configurable: true,
      value: details
    })
    return normalized
  } catch {
    const wrapped = new Error(normalized.message)
    wrapped.name = normalized.name
    wrapped.stack = normalized.stack
    wrapped.xiaohongshuDiagnostics = details
    return wrapped
  }
}

function isBrowserWindowClosed (browserWindow) {
  if (!browserWindow) return true
  try {
    return typeof browserWindow.isDestroyed === 'function' && browserWindow.isDestroyed()
  } catch {
    return true
  }
}

function closeBrowserWindow (browserWindow, trace) {
  if (!browserWindow || isBrowserWindowClosed(browserWindow)) return
  try {
    browserWindow.close()
    trace?.add('browser-window:closed')
  } catch (error) {
    trace?.add('browser-window:close-failed', `${error?.name || 'Error'}: ${error?.message || error}`)
  }
}

function createXiaohongshuWindow (trace, windowTitle) {
  return new Promise((resolve, reject) => {
    let browserWindow = null
    let settled = false
    const finish = (error) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      if (error) reject(error)
      else resolve(browserWindow)
    }
    const timeoutId = setTimeout(() => {
      closeBrowserWindow(browserWindow, trace)
      finish(new Error('FLASH_NOTE_XHS:TIMEOUT|stage=create-browser-window'))
    }, PAGE_TIMEOUT)

    try {
      browserWindow = window.utools.createBrowserWindow(
        XIAOHONGSHU_BROWSER_ENTRY,
        {
          show: false,
          width: 1180,
          height: 760,
          center: true,
          title: String(windowTitle || '小红书创作'),
          backgroundColor: '#ffffff',
          resizable: true,
          minimizable: true,
          maximizable: true,
          autoHideMenuBar: true,
          webPreferences: {
            partition: XIAOHONGSHU_PARTITION,
            webviewTag: true,
            backgroundThrottling: false
          }
        },
        () => setTimeout(() => finish(null), 0)
      )
      activeBrowserWindow = browserWindow
      trace.add('browser-window:created', `session=${XIAOHONGSHU_PARTITION}`)
      if (!browserWindow?.webContents) finish(new Error('FLASH_NOTE_XHS:UNAVAILABLE|createBrowserWindow returned no webContents'))
    } catch (error) {
      finish(error)
    }
  })
}

function executeBrowserFunction (browserWindow, operation, ...args) {
  if (isBrowserWindowClosed(browserWindow)) return Promise.reject(new Error('FLASH_NOTE_XHS:WINDOW_CLOSED'))
  const guestSource = `(${String(operation)}).apply(null, ${JSON.stringify(args)})`
  const source = `(() => {
    const webview = document.querySelector(${JSON.stringify(XIAOHONGSHU_WEBVIEW_SELECTOR)})
    if (!webview || typeof webview.executeJavaScript !== 'function') {
      throw new Error('FLASH_NOTE_XHS:UNAVAILABLE|webview missing')
    }
    return webview.executeJavaScript(${JSON.stringify(guestSource)}, true)
  })()`
  return browserWindow.webContents.executeJavaScript(source, true)
}

function sendWebviewText (browserWindow, text) {
  if (isBrowserWindowClosed(browserWindow)) return Promise.reject(new Error('FLASH_NOTE_XHS:WINDOW_CLOSED'))
  const source = `(async () => {
    const webview = document.querySelector(${JSON.stringify(XIAOHONGSHU_WEBVIEW_SELECTOR)})
    if (!webview) throw new Error('FLASH_NOTE_XHS:UNAVAILABLE|webview missing')
    webview.focus()
    if (typeof webview.insertText === 'function') {
      await webview.insertText(${JSON.stringify(text)})
      return 'webview.insertText'
    }
    if (typeof webview.sendInputEvent !== 'function') {
      throw new Error('FLASH_NOTE_XHS:UNAVAILABLE|webview text input missing')
    }
    for (const character of Array.from(${JSON.stringify(text)})) {
      if (character === '\\n') {
        webview.sendInputEvent({ type: 'keyDown', keyCode: 'ENTER' })
        webview.sendInputEvent({ type: 'keyUp', keyCode: 'ENTER' })
      } else {
        webview.sendInputEvent({ type: 'char', keyCode: character })
      }
    }
    return 'webview.sendInputEvent'
  })()`
  return browserWindow.webContents.executeJavaScript(source, true)
}

function sendWebviewClick (browserWindow, point) {
  if (isBrowserWindowClosed(browserWindow)) return Promise.reject(new Error('FLASH_NOTE_XHS:WINDOW_CLOSED'))
  const source = `(() => {
    const webview = document.querySelector(${JSON.stringify(XIAOHONGSHU_WEBVIEW_SELECTOR)})
    if (!webview || typeof webview.sendInputEvent !== 'function') {
      throw new Error('FLASH_NOTE_XHS:UNAVAILABLE|webview mouse input missing')
    }
    webview.focus()
    const x = ${JSON.stringify(point.x)}
    const y = ${JSON.stringify(point.y)}
    webview.sendInputEvent({ type: 'mouseMove', x, y })
    webview.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 })
    webview.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 })
    return 'webview.sendInputEvent'
  })()`
  return browserWindow.webContents.executeJavaScript(source, true)
}

function pageReadState () {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const exactVisibleCount = (selector, text) => Array.from(document.querySelectorAll(selector))
    .filter(element => isVisible(element) && element.textContent?.trim() === text).length
  const loginFields = Array.from(document.querySelectorAll('input[type="tel"], input[type="password"]'))
    .filter(isVisible).length
  return {
    href: window.location.href,
    path: window.location.pathname,
    readyState: document.readyState,
    login: window.location.pathname.includes('/login') || loginFields > 0,
    loginFields,
    publishNote: exactVisibleCount('span.btn-text', '发布笔记'),
    uploadImage: exactVisibleCount('span.title', '上传图文'),
    longArticle: exactVisibleCount('span.title', '写长文'),
    textImage: exactVisibleCount('.text2image-button', '文字配图'),
    editor: Array.from(document.querySelectorAll('div.tiptap.ProseMirror[contenteditable="true"][role="textbox"]')).filter(isVisible).length,
    newCreation: exactVisibleCount('button.new-btn', '新的创作'),
    oneClickLayout: exactVisibleCount('button.next-btn', '一键排版'),
    templateSubmit: document.querySelectorAll('button.submit').length,
    templateCards: document.querySelectorAll('.setting-panel .template-list .template-card.template-card-new, .template-list .template-card.template-card-new').length,
    longImages: Array.from(document.querySelectorAll('.pr[data-draggable="true"] .img-container img.img.preview')).filter(isVisible).length
  }
}

function stateSignature (state) {
  return state
    ? `path=${state.path}, ready=${state.readyState}, login=${Number(state.login)}, fields=${state.loginFields}, publishNote=${state.publishNote}, uploadImage=${state.uploadImage}, textImage=${state.textImage}, longArticle=${state.longArticle}, editor=${state.editor}, newCreation=${state.newCreation}, oneClickLayout=${state.oneClickLayout}, templateSubmit=${state.templateSubmit}, templateCards=${state.templateCards}, longImages=${state.longImages}`
    : 'unavailable'
}

async function waitForBrowserState (browserWindow, trace, stage, predicate, timeout = PAGE_TIMEOUT) {
  const deadline = Date.now() + timeout
  let lastSignature = ''
  let lastError = null
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    try {
      const state = await executeBrowserFunction(browserWindow, pageReadState)
      const signature = stateSignature(state)
      if (signature !== lastSignature) {
        trace.add(`${stage}:state`, signature)
        lastSignature = signature
      }
      if (await predicate(state)) return state
      lastError = null
    } catch (error) {
      if (String(error?.message || error).includes('WINDOW_CLOSED')) throw error
      lastError = error
    }
    await delay(400)
  }
  const detail = lastError ? `|last=${lastError?.message || lastError}` : ''
  throw new Error(`FLASH_NOTE_XHS:TIMEOUT|stage=${stage}${detail}`)
}

function pageClickExactText (selector, text, errorCode) {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const target = Array.from(document.querySelectorAll(selector))
    .find(element => isVisible(element) && element.textContent?.trim() === text)
  if (!target) throw new Error(`FLASH_NOTE_XHS:${errorCode}`)
  target.click()
  return `${target.tagName}.${String(target.className || '')}`
}

async function completeInteractiveLogin (browserWindow, trace) {
  browserWindow.show()
  browserWindow.focus?.()
  trace.add('login-window:shown')
  const state = await waitForBrowserState(
    browserWindow,
    trace,
    'login',
    value => !value.login && (
      value.editor > 0 || value.textImage > 0 || value.longArticle > 0 ||
      value.uploadImage > 0 || value.publishNote > 0 || value.newCreation > 0 ||
      value.oneClickLayout > 0 || value.templateSubmit > 0 || value.templateCards > 0 || value.longImages > 0
    ),
    LOGIN_TIMEOUT
  )
  try {
    browserWindow.hide()
    trace.add('login-window:hidden')
  } finally {
    const restored = Boolean(window.utools?.showMainWindow?.())
    trace.add('plugin-window:restored-after-login', `showMainWindow=${restored}`)
  }
  return state
}

async function reachImagePublisher (browserWindow, trace) {
  let state = await waitForBrowserState(
    browserWindow,
    trace,
    'entry',
    value => value.editor > 0 || value.textImage > 0 || value.uploadImage > 0 || value.publishNote > 0 || value.login,
    PAGE_TIMEOUT
  )

  for (let step = 1; step <= 8; step += 1) {
    if (state.editor > 0 || state.textImage > 0) return state
    if (state.login) {
      state = await completeInteractiveLogin(browserWindow, trace)
      continue
    }

    if (state.uploadImage > 0) {
      const target = await executeBrowserFunction(browserWindow, pageClickExactText, 'span.title', '上传图文', 'TEXT_IMAGE_ENTRY_NOT_FOUND')
      trace.add('navigation:upload-image-clicked', `target=${target}`)
      state = await waitForBrowserState(
        browserWindow,
        trace,
        'upload-image',
        value => value.editor > 0 || value.textImage > 0 || value.login,
        PAGE_TIMEOUT
      )
      continue
    }

    if (state.publishNote > 0) {
      const target = await executeBrowserFunction(browserWindow, pageClickExactText, 'span.btn-text', '发布笔记', 'TEXT_IMAGE_ENTRY_NOT_FOUND')
      trace.add('navigation:publish-note-clicked', `target=${target}`)
      state = await waitForBrowserState(
        browserWindow,
        trace,
        'publish-note',
        value => value.editor > 0 || value.textImage > 0 || value.uploadImage > 0 || value.login,
        PAGE_TIMEOUT
      )
      continue
    }

    break
  }

  throw new Error(`FLASH_NOTE_XHS:TEXT_IMAGE_ENTRY_NOT_FOUND|${stateSignature(state)}`)
}

async function reachLongArticlePublisher (browserWindow, trace) {
  let state = await waitForBrowserState(
    browserWindow,
    trace,
    'long-entry',
    value => value.longArticle > 0 || value.newCreation > 0 || value.oneClickLayout > 0 ||
    value.templateSubmit > 0 || value.templateCards > 0 || value.longImages > 0 || value.uploadImage > 0 ||
      value.publishNote > 0 || value.login,
    PAGE_TIMEOUT
  )

  for (let step = 1; step <= 8; step += 1) {
    if (state.longArticle > 0 || state.newCreation > 0 || state.oneClickLayout > 0 || state.templateSubmit > 0 || state.templateCards > 0 || state.longImages > 0) return state
    if (state.login) {
      state = await completeInteractiveLogin(browserWindow, trace)
      continue
    }

    if (state.uploadImage > 0) {
      const target = await executeBrowserFunction(browserWindow, pageClickExactText, 'span.title', '上传图文', 'LONG_ARTICLE_ENTRY_NOT_FOUND')
      trace.add('long-navigation:upload-image-clicked', `target=${target}`)
      state = await waitForBrowserState(
        browserWindow,
        trace,
        'long-upload-image',
      value => value.longArticle > 0 || value.newCreation > 0 || value.oneClickLayout > 0 || value.templateCards > 0 || value.login,
        PAGE_TIMEOUT
      )
      continue
    }

    if (state.publishNote > 0) {
      const target = await executeBrowserFunction(browserWindow, pageClickExactText, 'span.btn-text', '发布笔记', 'LONG_ARTICLE_ENTRY_NOT_FOUND')
      trace.add('long-navigation:publish-note-clicked', `target=${target}`)
      state = await waitForBrowserState(
        browserWindow,
        trace,
        'long-publish-note',
        value => value.longArticle > 0 || value.newCreation > 0 || value.oneClickLayout > 0 || value.templateCards > 0 || value.uploadImage > 0 || value.login,
        PAGE_TIMEOUT
      )
      continue
    }

    break
  }

  throw new Error(`FLASH_NOTE_XHS:LONG_ARTICLE_ENTRY_NOT_FOUND|${stateSignature(state)}`)
}

function pageOpenTextImageEditor () {
  const isVisible = element => {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const target = Array.from(document.querySelectorAll('.text2image-button'))
    .find(element => isVisible(element) && element.textContent?.trim() === '文字配图')
  if (!target) throw new Error('FLASH_NOTE_XHS:TEXT_IMAGE_ENTRY_NOT_FOUND')
  target.click()
  return true
}

function pageReplaceEditorText (text) {
  const editor = document.querySelector('div.tiptap.ProseMirror[contenteditable="true"][role="textbox"]')
  if (!editor) throw new Error('FLASH_NOTE_XHS:TEXT_IMAGE_ENTRY_NOT_FOUND|editor')
  editor.focus()
  const range = document.createRange()
  range.selectNodeContents(editor)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
  if (!document.execCommand('insertText', false, text)) {
    throw new Error('FLASH_NOTE_XHS:TEXT_INPUT_FAILED')
  }
  return { text: editor.innerText, transport: 'prosemirror-input-event' }
}

function pageOpenLongArticle () {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const target = Array.from(document.querySelectorAll('span.title'))
    .find(element => isVisible(element) && element.textContent?.trim() === '写长文')
  if (!target) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_ENTRY_NOT_FOUND')
  target.closest('.creator-tab')?.click?.()
  if (!target.closest('.creator-tab')) target.click()
  return `${target.tagName}.${String(target.className || '')}`
}

function pagePrepareLongArticleText () {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const candidates = Array.from(new Set(Array.from(document.querySelectorAll(
    '.ProseMirror[contenteditable="true"], [contenteditable="true"][role="textbox"], [contenteditable="true"], textarea'
  )))).filter(element => isVisible(element) && !element.closest('button'))
    .sort((left, right) => {
      const leftRect = left.getBoundingClientRect()
      const rightRect = right.getBoundingClientRect()
      return (rightRect.width * rightRect.height) - (leftRect.width * leftRect.height)
    })
  const editor = candidates[0]
  if (!editor) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_EDITOR_NOT_FOUND')
  editor.focus()
  if (editor.matches('textarea')) {
    editor.select()
  } else {
    const range = document.createRange()
    range.selectNodeContents(editor)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }
  return {
    target: `${editor.tagName}.${String(editor.className || '')}`
  }
}

function pagePrepareLongArticleTitle () {
  const title = document.querySelector('textarea[placeholder="输入标题"], input[placeholder="输入标题"]')
  if (!title) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_TEXT_INPUT_FAILED|title')
  title.focus()
  title.select()
  return {
    target: `${title.tagName}.${String(title.className || '')}`
  }
}

function pageReadLongArticleText () {
  const editor = document.activeElement?.matches?.('.ProseMirror[contenteditable="true"], [contenteditable="true"][role="textbox"], [contenteditable="true"], textarea')
    ? document.activeElement
    : document.querySelector('.ProseMirror[contenteditable="true"], [contenteditable="true"][role="textbox"], textarea')
  if (!editor) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_EDITOR_NOT_FOUND')
  const title = document.querySelector('textarea[placeholder="输入标题"], input[placeholder="输入标题"]')
  return {
    titleLength: String(title?.value || '').length,
    textLength: String(editor.innerText ?? editor.value ?? '').length,
    target: `${editor.tagName}.${String(editor.className || '')}`
  }
}

async function replaceLongArticleText (browserWindow, title, text) {
  const titleEditor = await executeBrowserFunction(browserWindow, pagePrepareLongArticleTitle)
  const titleTransport = await sendWebviewText(browserWindow, title)
  await delay(150)
  const editor = await executeBrowserFunction(browserWindow, pagePrepareLongArticleText)
  const textTransport = await sendWebviewText(browserWindow, text)
  await delay(300)
  const state = await executeBrowserFunction(browserWindow, pageReadLongArticleText)
  return {
    ...state,
    titleTarget: titleEditor.target,
    textTarget: editor.target,
    titleTransport,
    textTransport
  }
}

function pagePrepareExactButtonClick (selector, text, errorCode) {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const label = Array.from(document.querySelectorAll(selector))
    .find(element => isVisible(element) && element.textContent?.trim() === text)
  const button = label?.matches('button') ? label : label?.closest('button')
  if (!button || !isVisible(button)) throw new Error(`FLASH_NOTE_XHS:${errorCode}`)
  if (button.matches('[disabled], [aria-disabled="true"]') || button.classList.contains('disabled')) {
    throw new Error(`FLASH_NOTE_XHS:${errorCode}|disabled`)
  }
  button.scrollIntoView({ block: 'center', inline: 'center' })
  button.focus({ preventScroll: true })
  const rect = button.getBoundingClientRect()
  return {
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + rect.height / 2),
    target: `${button.tagName}.${String(button.className || '')}`
  }
}

async function clickExactButtonThroughWebview (browserWindow, selector, text, errorCode) {
  const point = await executeBrowserFunction(browserWindow, pagePrepareExactButtonClick, selector, text, errorCode)
  const transport = await sendWebviewClick(browserWindow, point)
  return { ...point, transport }
}

async function openLongTemplatePanel (browserWindow, trace, shareTitle, shareText) {
  let lastError = null
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const editorUpdate = await replaceLongArticleText(browserWindow, shareTitle, shareText)
    trace.add('long-editor:fields-inserted', `attempt=${attempt}, sourceTitleLength=${shareTitle.length}, editorTitleLength=${editorUpdate.titleLength}, sourceTextLength=${shareText.length}, editorTextLength=${editorUpdate.textLength}, titleTarget=${editorUpdate.titleTarget}, textTarget=${editorUpdate.textTarget}, titleTransport=${editorUpdate.titleTransport}, textTransport=${editorUpdate.textTransport}`)
    await waitForExactButtonReady(browserWindow, trace, 'long-layout', 'button.next-btn', '一键排版')
    const click = await clickExactButtonThroughWebview(browserWindow, 'button.next-btn', '一键排版', 'LONG_ARTICLE_LAYOUT_FAILED')
    trace.add('long-layout:clicked', `attempt=${attempt}, target=${click.target}, transport=${click.transport}, point=${click.x},${click.y}`)
    try {
      return await waitForBrowserState(
        browserWindow,
        trace,
        `long-layout-accepted-${attempt}`,
        value => value.oneClickLayout === 0 || value.templateSubmit > 0 || value.templateCards > 0 || value.login,
        8000
      )
    } catch (error) {
      lastError = error
      trace.add('long-layout:not-accepted', `attempt=${attempt}`)
    }
  }
  throw new Error(`FLASH_NOTE_XHS:LONG_ARTICLE_LAYOUT_FAILED|click-not-accepted|${lastError?.message || 'unknown'}`)
}

function pageReadExactButtonState (selector, text) {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const candidates = Array.from(document.querySelectorAll(selector))
    .filter(element => selector === 'button.submit' || isVisible(element))
  const label = candidates.find(element => element.textContent?.trim() === text) || (candidates.length === 1 ? candidates[0] : null)
  if (!label) return { found: false, visible: false, disabled: true, target: '' }
  const button = label.matches('button') ? label : label.closest('button') || label
  const disabled = button.matches('[disabled], [aria-disabled="true"]') ||
    button.classList.contains('disabled') || label.classList.contains('disabled')
  return {
    found: true,
    visible: isVisible(button),
    disabled,
    target: `${button.tagName}.${String(button.className || '')}`
  }
}

async function waitForExactButtonReady (browserWindow, trace, stage, selector, text, timeout = PAGE_TIMEOUT) {
  const deadline = Date.now() + timeout
  let lastSignature = ''
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadExactButtonState, selector, text)
    const signature = `found=${Number(state?.found)}, visible=${Number(state?.visible)}, disabled=${Number(state?.disabled)}, target=${state?.target || ''}`
    if (signature !== lastSignature) {
      trace.add(`${stage}:button-state`, signature)
      lastSignature = signature
    }
    if (state?.found && state.visible && !state.disabled) return state
    await delay(100)
  }
  throw new Error(`FLASH_NOTE_XHS:TIMEOUT|stage=${stage}-button-ready`)
}

function pageClickExactButton (selector, text, errorCode) {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const candidates = Array.from(document.querySelectorAll(selector))
    .filter(element => selector === 'button.submit' || isVisible(element))
  const label = candidates.find(element => element.textContent?.trim() === text) || (candidates.length === 1 ? candidates[0] : null)
  const button = label?.matches('button') ? label : label?.closest('button')
  if (!button || (selector !== 'button.submit' && !isVisible(button))) throw new Error(`FLASH_NOTE_XHS:${errorCode}`)
  if (button.matches('[disabled], [aria-disabled="true"]') || button.classList.contains('disabled')) {
    throw new Error(`FLASH_NOTE_XHS:${errorCode}|disabled`)
  }
  button.click()
  return `${button.tagName}.${String(button.className || '')}`
}

function pageReadLongTemplateState () {
  const templates = Array.from(document.querySelectorAll('.template-list .template-card.template-card-new'))
  const selected = templates.find(element => element.classList.contains('selected')) || null
  const readColors = element => Array.from(element.querySelectorAll('.color-item')).map((item, index) => ({
    id: `long-color-${index}`,
    value: item.style.getPropertyValue('--item-color').trim() || window.getComputedStyle(item).backgroundColor,
    selected: item.classList.contains('active')
  }))
  const selectedColors = selected ? readColors(selected) : []
  return {
    count: templates.length,
    selected: selected?.querySelector('.template-title')?.textContent?.trim() || '',
    selectedColor: selectedColors.find(color => color.selected)?.value || '',
    templates: templates.map((element, index) => ({
      id: `long-template-${index}`,
      name: element.querySelector('.template-title')?.textContent?.trim() || `模板 ${index + 1}`,
      covers: Array.from(element.querySelectorAll('.template-cover-container img')).slice(0, 3).map(image => image.currentSrc || image.src).filter(Boolean),
      colors: readColors(element).filter(color => color.value),
      selected: element.classList.contains('selected')
    }))
  }
}

async function waitForLongTemplates (browserWindow, trace) {
  const deadline = Date.now() + GENERATION_TIMEOUT
  let lastSignature = ''
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadLongTemplateState)
    const signature = `count=${state?.count || 0}, selected=${state?.selected || 'none'}`
    if (signature !== lastSignature) {
      trace.add('long-template:state', signature)
      lastSignature = signature
    }
    if (state?.count > 0) {
      const loaded = await executeBrowserFunction(browserWindow, pageLoadAllLazyItems, '.template-list .template-card.template-card-new', 24)
      const refreshed = await executeBrowserFunction(browserWindow, pageReadLongTemplateState)
      trace.add('long-template:scrolled', `templates=${loaded?.count || refreshed?.count || state.count}`)
      return refreshed
    }
    await delay(300)
  }
  throw new Error('FLASH_NOTE_XHS:TIMEOUT|stage=long-templates')
}

function pageSelectLongTemplate (templateId, templateName) {
  const templates = Array.from(document.querySelectorAll('.template-list .template-card.template-card-new'))
  const requestedIndex = Number(String(templateId || '').match(/^long-template-(\d+)$/)?.[1])
  const target = templates.find(element => element.querySelector('.template-title')?.textContent?.trim() === templateName) ||
    (Number.isInteger(requestedIndex) && requestedIndex >= 0 ? templates[requestedIndex] : null) ||
    templates.find(element => element.classList.contains('selected')) || templates[0]
  if (!target) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_TEMPLATE_NOT_FOUND')
  target.click()
  return {
    id: `long-template-${templates.indexOf(target)}`,
    name: target.querySelector('.template-title')?.textContent?.trim() || '长文模板'
  }
}

function pageSelectLongTemplateColor (templateName, colorIndex, colorValue) {
  const normalize = value => String(value || '').replace(/\s+/g, '').toUpperCase()
  const templates = Array.from(document.querySelectorAll('.template-list .template-card.template-card-new'))
  const template = templates.find(element => element.querySelector('.template-title')?.textContent?.trim() === templateName) ||
    templates.find(element => element.classList.contains('selected'))
  if (!template) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_TEMPLATE_NOT_FOUND|color-template')
  const colors = Array.from(template.querySelectorAll('.color-item'))
  if (!colors.length) return { index: -1, value: '' }
  const requestedIndex = Number(colorIndex)
  const requestedValue = normalize(colorValue)
  const target = colors.find(item => normalize(item.style.getPropertyValue('--item-color').trim()) === requestedValue) ||
    (Number.isInteger(requestedIndex) && requestedIndex >= 0 ? colors[requestedIndex] : null) ||
    colors.find(item => item.classList.contains('active')) || colors[0]
  if (!target) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_TEMPLATE_NOT_FOUND|color')
  target.click()
  return {
    index: colors.indexOf(target),
    value: target.style.getPropertyValue('--item-color').trim() || window.getComputedStyle(target).backgroundColor
  }
}

async function waitForLongTemplateSelection (browserWindow, trace, templateName) {
  const deadline = Date.now() + PAGE_TIMEOUT
  let stableChecks = 0
  let lastSelected = ''
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadLongTemplateState)
    if (state?.selected !== lastSelected) {
      trace.add('long-template:selection-state', `expected=${templateName}, actual=${state?.selected || 'none'}`)
      lastSelected = state?.selected || ''
    }
    if (state?.selected === templateName) {
      stableChecks += 1
      if (stableChecks >= 4) return state
    } else {
      stableChecks = 0
    }
    await delay(150)
  }
  throw new Error(`FLASH_NOTE_XHS:LONG_ARTICLE_TEMPLATE_NOT_FOUND|expected=${templateName}, actual=${lastSelected || 'none'}`)
}

async function waitForLongTemplateColorSelection (browserWindow, trace, templateName, colorValue) {
  if (!colorValue) return null
  const normalize = value => String(value || '').replace(/\s+/g, '').toUpperCase()
  const expectedColor = normalize(colorValue)
  const deadline = Date.now() + PAGE_TIMEOUT
  let stableChecks = 0
  let lastColor = ''
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadLongTemplateState)
    const actualColor = normalize(state?.selectedColor)
    if (actualColor !== lastColor) {
      trace.add('long-template:color-state', `template=${templateName}, expected=${colorValue}, actual=${state?.selectedColor || 'none'}`)
      lastColor = actualColor
    }
    if (state?.selected === templateName && actualColor === expectedColor) {
      stableChecks += 1
      if (stableChecks >= 3) return state
    } else {
      stableChecks = 0
    }
    await delay(150)
  }
  throw new Error(`FLASH_NOTE_XHS:LONG_ARTICLE_TEMPLATE_NOT_FOUND|color-expected=${colorValue}, color-actual=${lastColor || 'none'}`)
}

function pageReadLongImages () {
  const images = Array.from(document.querySelectorAll('.pr[data-draggable="true"] .img-container img.img.preview'))
  return {
    count: images.length,
    ready: images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0),
    signature: images.map(image => `${image.currentSrc || image.src}:${image.naturalWidth}x${image.naturalHeight}`).join('|')
  }
}

async function waitForLongImages (browserWindow, trace) {
  const deadline = Date.now() + GENERATION_TIMEOUT
  let stableSignature = ''
  let stableChecks = 0
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadLongImages)
    if (state.ready && state.signature) {
      if (state.signature === stableSignature) stableChecks += 1
      else {
        stableSignature = state.signature
        stableChecks = 1
        trace.add('long-images:state', `count=${state.count}`)
      }
      if (stableChecks >= 3) return state
    } else {
      stableSignature = ''
      stableChecks = 0
    }
    await delay(500)
  }
  throw new Error('FLASH_NOTE_XHS:TIMEOUT|stage=long-images')
}

async function pageExtractLongImages (templateName) {
  const images = Array.from(document.querySelectorAll('.pr[data-draggable="true"] .img-container img.img.preview'))
  return Promise.all(images.map(async (image, index) => {
    if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error('FLASH_NOTE_XHS:LONG_IMAGE_READ_FAILED|image-not-ready')
    }
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('FLASH_NOTE_XHS:LONG_IMAGE_READ_FAILED|canvas-context')
    context.drawImage(image, 0, 0)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result)
        else reject(new Error('FLASH_NOTE_XHS:LONG_IMAGE_READ_FAILED|canvas-export'))
      }, 'image/png')
    })
    const url = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(reader.error || new Error('FLASH_NOTE_XHS:LONG_IMAGE_READ_FAILED|file-reader'))
      reader.readAsDataURL(blob)
    })
    return {
      id: `long-${index + 1}`,
      index,
      name: `${templateName} · 第 ${index + 1} 页`,
      url,
      active: index === 0
    }
  }))
}

function pageReadCards () {
  const cards = Array.from(document.querySelectorAll('.right-container .cover-item-container')).map((container, index) => {
    const image = container.querySelector('.cover-item img')
    return {
      id: `${index}:${image?.currentSrc || image?.src || ''}`,
      index,
      name: container.querySelector('.cover-name')?.textContent?.trim() || `卡片 ${index + 1}`,
      url: image?.currentSrc || image?.src || '',
      loaded: Boolean(image?.complete && image.naturalWidth > 0),
      active: Boolean(container.querySelector('.cover-item.active'))
    }
  }).filter(card => card.url)
  return {
    cards,
    ready: cards.length > 0 && cards.every(card => card.loaded),
    signature: cards.map(card => `${card.name}:${card.url}`).join('|')
  }
}

async function pageLoadAllLazyItems (itemSelector, maxPasses = 24) {
  const findScrollable = () => {
    const firstItem = document.querySelector(itemSelector)
    if (!firstItem) return null
    const candidates = []
    let node = firstItem
    while (node && node !== document.documentElement) {
      candidates.push(node)
      node = node.parentElement
    }
    candidates.push(document.scrollingElement || document.documentElement)
    return candidates.find(element => {
      if (!element || element.scrollHeight <= element.clientHeight + 4) return false
      const style = window.getComputedStyle(element)
      return style.overflowY === 'auto' || style.overflowY === 'scroll' || element === document.scrollingElement
    }) || null
  }
  const readState = () => {
    const items = Array.from(document.querySelectorAll(itemSelector))
    const scrollable = findScrollable()
    const signature = items.map(item => {
      const title = item.querySelector('.cover-name, .template-title')?.textContent?.trim() || ''
      const image = item.querySelector('img')
      return `${title}:${image?.currentSrc || image?.src || ''}`
    }).join('|')
    return {
      count: items.length,
      signature,
      scrollTop: scrollable?.scrollTop || 0,
      scrollHeight: scrollable?.scrollHeight || 0,
      clientHeight: scrollable?.clientHeight || 0
    }
  }
  let scrollable = findScrollable()
  let previous = readState()
  let unchangedPasses = 0
  for (let pass = 0; pass < maxPasses; pass += 1) {
    const items = Array.from(document.querySelectorAll(itemSelector))
    const lastItem = items[items.length - 1]
    if (scrollable) {
      scrollable.scrollTop = scrollable.scrollHeight
      scrollable.dispatchEvent(new Event('scroll', { bubbles: true }))
    } else {
      window.scrollTo(0, document.documentElement.scrollHeight)
    }
    lastItem?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
    await new Promise(resolve => setTimeout(resolve, 450))
    scrollable = findScrollable() || scrollable
    const next = readState()
    const changed = next.count > previous.count || next.signature !== previous.signature || next.scrollHeight !== previous.scrollHeight
    unchangedPasses = changed ? 0 : unchangedPasses + 1
    previous = next
    const atEnd = !scrollable || next.scrollTop + next.clientHeight >= next.scrollHeight - 4
    if (atEnd && unchangedPasses >= 3) break
  }
  return readState()
}

function pageReadGenerateButtonState () {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const label = Array.from(document.querySelectorAll('span.edit-text-button-text, button, [role="button"]'))
    .find(element => isVisible(element) && element.textContent?.trim() === '生成图片')
  if (!label) return { found: false, visible: false, disabled: true, target: '' }
  const button = label.closest('button, [role="button"], .edit-text-button') || label
  const visible = isVisible(label) && isVisible(button)
  const disabled = label.matches('[disabled], [aria-disabled="true"]') ||
    label.classList.contains('disabled') ||
    button.matches('[disabled], [aria-disabled="true"]') ||
    button.classList.contains('disabled')
  return {
    found: true,
    visible,
    disabled,
    target: `${button.tagName}.${String(button.className || '')}`
  }
}

async function waitForGenerateButtonReady (browserWindow, trace) {
  const deadline = Date.now() + PAGE_TIMEOUT
  let lastSignature = ''
  let lastError = null
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    try {
      const state = await executeBrowserFunction(browserWindow, pageReadGenerateButtonState)
      const signature = `found=${Number(state?.found)}, visible=${Number(state?.visible)}, disabled=${Number(state?.disabled)}`
      if (signature !== lastSignature) {
        trace.add('generation:button-state', signature)
        lastSignature = signature
      }
      if (state?.found && state.visible && !state.disabled) return state
      lastError = null
    } catch (error) {
      if (String(error?.message || error).includes('WINDOW_CLOSED')) throw error
      lastError = error
    }
    await delay(100)
  }
  const detail = lastError ? `|last=${lastError?.message || lastError}` : ''
  throw new Error(`FLASH_NOTE_XHS:TIMEOUT|stage=generate-button-ready${detail}`)
}

function pageClickGenerateButton () {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const label = Array.from(document.querySelectorAll('span.edit-text-button-text'))
    .find(element => isVisible(element) && element.textContent?.trim() === '生成图片')
  if (!label) throw new Error('FLASH_NOTE_XHS:GENERATE_BUTTON_NOT_FOUND')
  const button = label.closest('.edit-text-button')
  if (!button || !isVisible(button)) throw new Error('FLASH_NOTE_XHS:GENERATE_BUTTON_NOT_FOUND')
  const disabled = label.classList.contains('disabled') ||
    label.matches('[disabled], [aria-disabled="true"]') ||
    button.classList.contains('disabled') ||
    button.matches('[disabled], [aria-disabled="true"]')
  if (disabled) throw new Error('FLASH_NOTE_XHS:GENERATE_BUTTON_DISABLED')
  button.click()
  return { target: `${button.tagName}.${String(button.className || '')}` }
}

function pageReadGenerationState () {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const editor = Array.from(document.querySelectorAll('div.tiptap.ProseMirror[contenteditable="true"][role="textbox"]')).filter(isVisible).length
  const loading = Array.from(document.querySelectorAll('.text-content *'))
    .some(element => isVisible(element) && element.textContent?.trim() === '图片生成中')
  const imageEditor = Array.from(document.querySelectorAll('.right-container .cover-list-container')).filter(isVisible).length
  const cards = Array.from(document.querySelectorAll('.right-container .cover-item-container')).filter(isVisible).length
  return { editor, loading, imageEditor, cards }
}

async function waitForGenerationStart (browserWindow, trace) {
  const deadline = Date.now() + 8000
  let lastSignature = ''
  let lastError = null
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    try {
      const state = await executeBrowserFunction(browserWindow, pageReadGenerationState)
      const signature = `editor=${state?.editor || 0}, loading=${Number(state?.loading)}, imageEditor=${state?.imageEditor || 0}, cards=${state?.cards || 0}`
      if (signature !== lastSignature) {
        trace.add('generation:page-state', signature)
        lastSignature = signature
      }
      if (state?.loading || state?.imageEditor > 0 || state?.cards > 0 || state?.editor === 0) {
        trace.add('generation:accepted', signature)
        return
      }
      lastError = null
    } catch (error) {
      if (String(error?.message || error).includes('WINDOW_CLOSED')) throw error
      lastError = error
    }
    await delay(100)
  }
  const detail = lastError ? `|last=${lastError?.message || lastError}` : ''
  throw new Error(`FLASH_NOTE_XHS:GENERATE_BUTTON_DISABLED|click-not-accepted${detail}`)
}

async function waitForGeneratedCards (browserWindow, previousSignature, trace) {
  const deadline = Date.now() + GENERATION_TIMEOUT
  let stableSignature = ''
  let stableChecks = 0
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const result = await executeBrowserFunction(browserWindow, pageReadCards)
    if (result.ready && result.signature && result.signature !== previousSignature) {
      if (result.signature === stableSignature) stableChecks += 1
      else {
        stableSignature = result.signature
        stableChecks = 1
      }
      if (stableChecks >= 3) {
        trace.add('generation:cards-ready', `cards=${result.cards.length}`)
        const loaded = await executeBrowserFunction(browserWindow, pageLoadAllLazyItems, '.right-container .cover-item-container', 20)
        trace.add('generation:cards-scrolled', `cards=${loaded?.count || result.cards.length}`)
        return (await executeBrowserFunction(browserWindow, pageReadCards)).cards
      }
    } else {
      stableSignature = ''
      stableChecks = 0
    }
    await delay(500)
  }
  throw new Error('FLASH_NOTE_XHS:TIMEOUT|stage=generate-cards')
}

function pagePrepareCardActivation (cardName, cardIndex) {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const containers = Array.from(document.querySelectorAll('.right-container .cover-item-container'))
  const requestedIndex = Number(cardIndex)
  const container = containers.find(element => element.querySelector('.cover-name')?.textContent?.trim() === cardName) ||
    (Number.isInteger(requestedIndex) && requestedIndex >= 0 ? containers[requestedIndex] : null)
  const card = container?.querySelector('.cover-item')
  if (!container || !card || !isVisible(card)) throw new Error('FLASH_NOTE_XHS:NO_IMAGES|color-card')
  container.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' })
  const clickTarget = card.querySelector('img') || card
  const rect = clickTarget.getBoundingClientRect()
  return {
    active: card.classList.contains('active'),
    index: containers.indexOf(container),
    name: container.querySelector('.cover-name')?.textContent?.trim() || '',
    target: `${clickTarget.tagName}.${String(clickTarget.className || '')}`,
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + rect.height / 2),
    url: container.querySelector('.cover-item img')?.currentSrc || container.querySelector('.cover-item img')?.src || ''
  }
}

function pageReadCardColorControl (cardName, cardIndex) {
  const isVisible = element => {
    if (!element) return false
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
  }
  const containers = Array.from(document.querySelectorAll('.right-container .cover-item-container'))
  const requestedIndex = Number(cardIndex)
  const container = containers.find(element => element.querySelector('.cover-name')?.textContent?.trim() === cardName) ||
    (Number.isInteger(requestedIndex) && requestedIndex >= 0 ? containers[requestedIndex] : null)
  const card = container?.querySelector('.cover-item')
  const image = card?.querySelector('img')
  const change = card?.querySelector('.change')
  const activeContainer = containers.find(element => element.querySelector('.cover-item.active'))
  return {
    found: Boolean(container && card),
    active: Boolean(card?.classList.contains('active')),
    activeIndex: activeContainer ? containers.indexOf(activeContainer) : -1,
    activeName: activeContainer?.querySelector('.cover-name')?.textContent?.trim() || '',
    ready: Boolean(image?.complete && image.naturalWidth > 0),
    change: Boolean(change && isVisible(change)),
    url: image?.currentSrc || image?.src || ''
  }
}

async function waitForCardColorControl (browserWindow, trace, cardName, cardIndex) {
  const deadline = Date.now() + 20_000
  let lastSignature = ''
  let stableChecks = 0
  let unavailableChecks = 0
  let activationAttempts = 0
  let lastActivationAt = 0
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadCardColorControl, cardName, cardIndex)
    const signature = `card=${cardName}, found=${Number(state?.found)}, active=${Number(state?.active)}, activeCard=${state?.activeName || 'none'}#${state?.activeIndex ?? -1}, change=${Number(state?.change)}, ready=${Number(state?.ready)}`
    if (signature !== lastSignature) {
      trace.add('card-color:control-state', signature)
      lastSignature = signature
    }
    if (state?.found && state.active && state.change && state.ready) {
      stableChecks += 1
      unavailableChecks = 0
      // 页面会先暴露新的当前卡片，随后才异步完成样式切换并解除全局忙碌锁。
      // 在样式稳定前保留一个很短的观察窗口，避免颜色点击落在已被丢弃的卡片上。
      if (stableChecks >= 8) return state
    } else {
      stableChecks = 0
      if (state?.found && state.active && state.ready && !state.change) {
        unavailableChecks += 1
        if (unavailableChecks >= 15) throw new Error(`FLASH_NOTE_XHS:CARD_COLOR_UNAVAILABLE|card=${cardName}`)
      } else {
        unavailableChecks = 0
      }
    }
    if (state?.found && !state.active && Date.now() - lastActivationAt >= 800) {
      const activation = await executeBrowserFunction(browserWindow, pagePrepareCardActivation, cardName, cardIndex)
      const transport = await sendWebviewClick(browserWindow, activation)
      activationAttempts += 1
      lastActivationAt = Date.now()
      trace.add('card-color:card-clicked', `attempt=${activationAttempts}, requested=${cardName}#${cardIndex}, actual=${activation.name}#${activation.index}, target=${activation.target}, transport=${transport}, point=${activation.x},${activation.y}`)
    }
    await delay(150)
  }
  throw new Error('FLASH_NOTE_XHS:TIMEOUT|stage=card-color-control')
}

function pagePrepareCardColorChange (cardName, cardIndex) {
  const containers = Array.from(document.querySelectorAll('.right-container .cover-item-container'))
  const requestedIndex = Number(cardIndex)
  const container = containers.find(element => element.querySelector('.cover-name')?.textContent?.trim() === cardName) ||
    (Number.isInteger(requestedIndex) && requestedIndex >= 0 ? containers[requestedIndex] : null)
  const card = container?.querySelector('.cover-item.active')
  const change = card?.querySelector('.change')
  if (!change) throw new Error('FLASH_NOTE_XHS:NO_IMAGES|color-control')
  change.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
  const rect = change.getBoundingClientRect()
  const previousUrl = card.querySelector('img')?.currentSrc || card.querySelector('img')?.src || ''
  return {
    previousUrl,
    target: `${change.tagName}.${String(change.className || '')}`,
    x: Math.round(rect.left + rect.width / 2),
    y: Math.round(rect.top + rect.height / 2)
  }
}

async function waitForCardColorChanged (browserWindow, trace, cardName, cardIndex, previousUrl, timeout = 10_000) {
  const deadline = Date.now() + timeout
  let stableUrl = ''
  let stableChecks = 0
  while (Date.now() < deadline) {
    if (isBrowserWindowClosed(browserWindow)) throw new Error('FLASH_NOTE_XHS:WINDOW_CLOSED')
    const state = await executeBrowserFunction(browserWindow, pageReadCardColorControl, cardName, cardIndex)
    if (state?.ready && state.url && state.url !== previousUrl) {
      if (state.url === stableUrl) stableChecks += 1
      else {
        stableUrl = state.url
        stableChecks = 1
        trace.add('card-color:image-changed', `card=${cardName}`)
      }
      if (stableChecks >= 2) return state
    } else {
      stableUrl = ''
      stableChecks = 0
    }
    await delay(200)
  }
  return null
}

async function applyCardColorChanges (browserWindow, trace, request) {
  const cardName = String(request?.cardName || '')
  const cardIndex = Number(request?.cardIndex)
  const changes = Math.max(0, Math.min(24, Number(request?.changes) || 0))
  if (!cardName || changes === 0) return
  for (let changeIndex = 0; changeIndex < changes; changeIndex += 1) {
    let changed = null
    for (let attempt = 1; attempt <= 3 && !changed; attempt += 1) {
      await waitForCardColorControl(browserWindow, trace, cardName, cardIndex)
      const click = await executeBrowserFunction(browserWindow, pagePrepareCardColorChange, cardName, cardIndex)
      const transport = await sendWebviewClick(browserWindow, click)
      trace.add('card-color:clicked', `card=${cardName}, change=${changeIndex + 1}/${changes}, attempt=${attempt}, target=${click.target}, transport=${transport}, point=${click.x},${click.y}`)
      changed = await waitForCardColorChanged(browserWindow, trace, cardName, cardIndex, click.previousUrl)
      if (!changed) trace.add('card-color:click-not-accepted', `card=${cardName}, change=${changeIndex + 1}/${changes}, attempt=${attempt}`)
    }
    if (!changed) throw new Error(`FLASH_NOTE_XHS:TIMEOUT|stage=card-color-image|card=${cardName}`)
  }
}

async function generateLongArticleImages (browserWindow, trace, shareTitle, shareText, initialState, onTemplatesReady, signal) {
  let state = initialState

  if (state.longArticle > 0) {
    const target = await executeBrowserFunction(browserWindow, pageOpenLongArticle)
    trace.add('long-navigation:long-article-clicked', `target=${target}`)
    state = await waitForBrowserState(
      browserWindow,
      trace,
      'long-article',
      value => value.newCreation > 0 || value.oneClickLayout > 0 || value.templateCards > 0 || value.login,
      PAGE_TIMEOUT
    )
  }

  if (state.login) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_ENTRY_NOT_FOUND|login-returned')

  if (state.newCreation > 0) {
    await waitForExactButtonReady(browserWindow, trace, 'long-new-creation', 'button.new-btn', '新的创作')
    const target = await executeBrowserFunction(browserWindow, pageClickExactButton, 'button.new-btn', '新的创作', 'LONG_ARTICLE_ENTRY_NOT_FOUND')
    trace.add('long-navigation:new-creation-clicked', `target=${target}`)
    state = await waitForBrowserState(
      browserWindow,
      trace,
      'long-editor',
      value => value.oneClickLayout > 0 || value.templateSubmit > 0 || value.templateCards > 0,
      PAGE_TIMEOUT
    )
  }

  if (state.oneClickLayout > 0) {
    state = await openLongTemplatePanel(browserWindow, trace, shareTitle, shareText)
  }

  if (state.login) throw new Error('FLASH_NOTE_XHS:LONG_ARTICLE_LAYOUT_FAILED|login-returned')
  if (state.templateSubmit === 0 && state.templateCards === 0) {
    state = await waitForBrowserState(
      browserWindow,
      trace,
      'long-template-panel',
      value => value.templateSubmit > 0 || value.templateCards > 0,
      GENERATION_TIMEOUT
    )
  }

  if (state.templateSubmit === 0 && state.templateCards === 0) throw new Error(`FLASH_NOTE_XHS:LONG_ARTICLE_TEMPLATE_NOT_FOUND|${stateSignature(state)}`)
  const templateState = await waitForLongTemplates(browserWindow, trace)
  const defaultTemplate = templateState.templates.find(template => template.selected) || templateState.templates[0]
  trace.add('long-template:awaiting-user', `templates=${templateState.templates.length}, default=${defaultTemplate?.name || 'none'}`)
  const selectedTemplateChoice = typeof onTemplatesReady === 'function'
    ? await waitForAbortable(onTemplatesReady(templateState.templates), signal)
    : defaultTemplate?.id
  throwIfCancelled(signal)
  const selectedTemplateId = typeof selectedTemplateChoice === 'object' ? selectedTemplateChoice?.templateId : selectedTemplateChoice
  const requestedTemplate = templateState.templates.find(template => template.id === selectedTemplateId) || defaultTemplate
  const selectedTemplate = await executeBrowserFunction(browserWindow, pageSelectLongTemplate, requestedTemplate?.id, requestedTemplate?.name)
  trace.add('long-template:selected', `id=${selectedTemplate.id}, name=${selectedTemplate.name}`)
  await waitForLongTemplateSelection(browserWindow, trace, selectedTemplate.name)
  trace.add('long-template:selection-stable', `name=${selectedTemplate.name}`)
  const requestedColorIndex = typeof selectedTemplateChoice === 'object' ? selectedTemplateChoice?.colorIndex : -1
  const requestedColorValue = typeof selectedTemplateChoice === 'object' ? selectedTemplateChoice?.color : ''
  const selectedColor = await executeBrowserFunction(browserWindow, pageSelectLongTemplateColor, selectedTemplate.name, requestedColorIndex, requestedColorValue)
  if (selectedColor.value) {
    trace.add('long-template:color-selected', `index=${selectedColor.index}, color=${selectedColor.value}`)
    await waitForLongTemplateColorSelection(browserWindow, trace, selectedTemplate.name, selectedColor.value)
  }
  await waitForExactButtonReady(browserWindow, trace, 'long-template-submit', 'button.submit', '下一步', GENERATION_TIMEOUT)
  const submitTarget = await executeBrowserFunction(browserWindow, pageClickExactButton, 'button.submit', '下一步', 'LONG_ARTICLE_LAYOUT_FAILED')
  trace.add('long-template:submitted', `target=${submitTarget}`)
  await waitForLongImages(browserWindow, trace)
  const extracted = await executeBrowserFunction(browserWindow, pageExtractLongImages, selectedTemplate.name)
  const cards = normalizeXiaohongshuLongCards(extracted)
  trace.add('long-result:normalized', `cards=${cards.length}`)
  if (!cards.length) throw new Error('FLASH_NOTE_XHS:NO_IMAGES')
  return cards
}

export function getXiaohongshuShareText (content, editorMode) {
  const source = editorMode === 'markdown' ? markdownToPlainText(content) : String(content || '')
  return source.replace(/\r\n|\r/g, '\n')
}

export function getXiaohongshuShareTitle (title, content) {
  const customTitle = String(title || '').trim()
  const firstLine = String(content || '').split('\n').map(line => line.trim()).find(Boolean) || ''
  return Array.from(customTitle || firstLine || '闪念文本').slice(0, 20).join('')
}

export function normalizeXiaohongshuCards (cards) {
  const seen = new Set()
  return (Array.isArray(cards) ? cards : []).flatMap((card, index) => {
    const url = String(card?.url || '')
    let trusted = false
    try {
      const parsed = new URL(url)
      trusted = parsed.protocol === 'https:' && (parsed.hostname === 'xhscdn.com' || parsed.hostname.endsWith('.xhscdn.com'))
    } catch {}
    if (!trusted || seen.has(url)) return []
    seen.add(url)
    return [{
      id: String(card?.id || `${index}:${url}`),
      index: Number.isFinite(card?.index) ? card.index : index,
      name: String(card?.name || '').trim() || `卡片 ${index + 1}`,
      url,
      active: Boolean(card?.active)
    }]
  })
}

export function normalizeXiaohongshuLongCards (cards) {
  return (Array.isArray(cards) ? cards : []).flatMap((card, index) => {
    const url = String(card?.url || '')
    if (!/^data:image\/(?:png|jpeg|webp);base64,/i.test(url)) return []
    return [{
      id: String(card?.id || `long-${index + 1}`),
      index: Number.isFinite(card?.index) ? card.index : index,
      name: String(card?.name || '').trim() || `第 ${index + 1} 页`,
      url,
      active: Boolean(card?.active) || index === 0
    }]
  })
}

export function getXiaohongshuErrorCode (error) {
  const message = String(error?.message || error || '')
  const explicit = message.match(/FLASH_NOTE_XHS:([A-Z_]+)/)?.[1]
  if (explicit) return explicit
  if (/closed|destroyed|abort|cancel/i.test(message)) return 'WINDOW_CLOSED'
  if (/timeout|timed out/i.test(message)) return 'TIMEOUT'
  return 'UNKNOWN'
}

export function getXiaohongshuErrorDetails (error) {
  if (error?.xiaohongshuDiagnostics) return String(error.xiaohongshuDiagnostics)
  const name = String(error?.name || 'Error')
  const message = String(error?.message || error || '未知错误')
  const stack = String(error?.stack || '').split('\n').slice(0, 12).join('\n')
  return [
    'FlashNote Xiaohongshu diagnostics',
    `revision: ${DIAGNOSTIC_REVISION}`,
    'transport: createBrowserWindow + webview (uBrowser disabled)',
    'trace: unavailable (failure occurred before tracing started)',
    `错误：${name}：${message}`,
    stack
  ].filter(Boolean).join('\n')
}

export async function generateXiaohongshuCards ({ title = '', content, editorMode = 'text', generationType = 'cards', cardColorRequest = null, onProgress, onTemplatesReady, signal, windowTitle = 'Xiaohongshu' }) {
  const shareText = getXiaohongshuShareText(content, editorMode)
  const shareTitle = getXiaohongshuShareTitle(title, shareText)
  const normalizedGenerationType = generationType === 'long-article' ? 'long-article' : 'cards'
  if (!shareText.trim()) throw new Error('FLASH_NOTE_XHS:EMPTY_CONTENT')
  if (typeof window.utools?.createBrowserWindow !== 'function') throw new Error('FLASH_NOTE_XHS:UNAVAILABLE')
  const generationKey = `${normalizedGenerationType}\u0000${editorMode}\u0000${shareTitle}\u0000${shareText}\u0000${JSON.stringify(cardColorRequest)}`
  if (activeGeneration) {
    if (activeGeneration.key === generationKey) return activeGeneration.promise
    throw new Error('FLASH_NOTE_XHS:BUSY')
  }

  const promise = (async () => {
    const trace = createDiagnosticTrace({ editorMode, contentLength: shareText.length, generationType: normalizedGenerationType, onProgress, titleLength: shareTitle.length })
    let browserWindow = null
    const cancelGeneration = () => {
      trace.add('generation:cancelled')
      closeBrowserWindow(browserWindow, trace)
    }
    signal?.addEventListener('abort', cancelGeneration, { once: true })
    trace.add('validation:passed')
    try {
      throwIfCancelled(signal)
      browserWindow = await createXiaohongshuWindow(trace, windowTitle)
      throwIfCancelled(signal)
      trace.add('browser-window:hidden-for-generation')

      if (normalizedGenerationType === 'long-article') {
        const publisherState = await reachLongArticlePublisher(browserWindow, trace)
        return await generateLongArticleImages(browserWindow, trace, shareTitle, shareText, publisherState, onTemplatesReady, signal)
      }

      const publisherState = await reachImagePublisher(browserWindow, trace)

      if (publisherState.editor === 0) {
        await executeBrowserFunction(browserWindow, pageOpenTextImageEditor)
        trace.add('text-image:opened')
        await waitForBrowserState(browserWindow, trace, 'text-image', state => state.editor > 0, PAGE_TIMEOUT)
      } else {
        trace.add('text-image:already-open')
      }

      const editorUpdate = await executeBrowserFunction(browserWindow, pageReplaceEditorText, shareText)
      trace.add('editor:text-inserted', `expectedLength=${shareText.length}, actualLength=${editorUpdate.text.length}, transport=${editorUpdate.transport}`)

      const previousCards = await executeBrowserFunction(browserWindow, pageReadCards)
      await waitForGenerateButtonReady(browserWindow, trace)
      const generateButton = await executeBrowserFunction(browserWindow, pageClickGenerateButton)
      trace.add('generation:dom-clicked', `target=${generateButton.target}, previousCards=${previousCards.cards.length}`)
      await waitForGenerationStart(browserWindow, trace)
      let generatedCards = await waitForGeneratedCards(browserWindow, previousCards.signature, trace)
      if (cardColorRequest?.cardName && Number(cardColorRequest?.changes) > 0) {
        await applyCardColorChanges(browserWindow, trace, cardColorRequest)
        generatedCards = (await executeBrowserFunction(browserWindow, pageReadCards)).cards
      }
      const cards = normalizeXiaohongshuCards(generatedCards)
      trace.add('result:normalized', `cards=${cards.length}`)
      if (!cards.length) throw new Error('FLASH_NOTE_XHS:NO_IMAGES')
      return cards
    } catch (error) {
      trace.add('run:failed', `${error?.name || 'Error'}: ${error?.message || error}`)
      throw attachDiagnostics(error, trace)
    } finally {
      signal?.removeEventListener('abort', cancelGeneration)
      closeBrowserWindow(browserWindow, trace)
      if (activeBrowserWindow === browserWindow) activeBrowserWindow = null
    }
  })()

  activeGeneration = { key: generationKey, promise }
  try {
    return await promise
  } finally {
    if (activeGeneration?.promise === promise) activeGeneration = null
  }
}
