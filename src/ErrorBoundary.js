import React from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import { resolveLocale, t } from './locales'

const GLOBAL_ERROR_ID = 'global-error-' + Date.now()

function getUiLanguage () {
  const documentLanguage = document.documentElement.lang
  return documentLanguage ? resolveLocale(documentLanguage) : resolveLocale('auto')
}

function hashString (value) {
  let hash = 0
  for (let index = 0; index < value.length; index++) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return 'error-' + (hash >>> 0)
}

function sanitizeStack (stack) {
  return String(stack || '').replace(/file:\/\/\/.*?([^/\\]+:\d+:\d+)/g, '$1')
}

function normalizeError (reason) {
  if (reason instanceof Error) {
    const message = reason.message || reason.name || t(getUiLanguage(), 'error.unknown')
    return {
      name: reason.name || 'Error',
      message,
      stack: sanitizeStack(reason.stack || message)
    }
  }

  if (typeof reason === 'string') {
    return { name: 'Error', message: reason, stack: reason }
  }

  let message = t(getUiLanguage(), 'error.unknown')
  try {
    message = JSON.stringify(reason) || message
  } catch {
    message = String(reason)
  }
  return { name: 'Error', message, stack: sanitizeStack(message) }
}

function copyText (text) {
  if (window.utools?.copyText) return window.utools.copyText(text)
  navigator.clipboard?.writeText(text).catch(() => {})
  return true
}

function showGlobalError (reason, type) {
  const language = getUiLanguage()
  const error = normalizeError(reason)
  const errorId = hashString(`${error.name}:${error.message}:${error.stack.split('\n')[1] || ''}`)
  let cardEl = document.getElementById(errorId)

  if (cardEl) {
    let countEl = cardEl.querySelector('.global-error-count')
    if (!countEl) {
      countEl = document.createElement('span')
      countEl.className = 'global-error-count'
      countEl.textContent = '2'
      cardEl.querySelector('.global-error-title')?.prepend(countEl)
    } else {
      countEl.textContent = String(Number.parseInt(countEl.textContent, 10) + 1)
    }
    return
  }

  let containerEl = document.getElementById(GLOBAL_ERROR_ID)
  if (!containerEl) {
    containerEl = document.createElement('div')
    containerEl.id = GLOBAL_ERROR_ID
    containerEl.className = 'global-error'
    document.body.appendChild(containerEl)
  }

  const title = type === 'global'
    ? t(language, 'error.operation')
    : t(language, 'error.background')
  cardEl = document.createElement('div')
  cardEl.id = errorId
  cardEl.className = 'global-error-card'

  const titleEl = document.createElement('div')
  titleEl.className = 'global-error-title'
  titleEl.textContent = title

  const messageEl = document.createElement('div')
  messageEl.className = 'global-error-message'
  messageEl.textContent = error.message

  const detailsEl = document.createElement('details')
  detailsEl.className = 'global-error-details'
  const summaryEl = document.createElement('summary')
  summaryEl.textContent = t(language, 'error.details')
  const stackEl = document.createElement('pre')
  stackEl.className = 'global-error-stack'
  stackEl.textContent = error.stack
  detailsEl.append(summaryEl, stackEl)

  const closeBtnEl = document.createElement('button')
  closeBtnEl.className = 'global-error-btn'
  closeBtnEl.textContent = t(language, 'error.close')
  closeBtnEl.onclick = () => cardEl?.remove()

  const copyBtnEl = document.createElement('button')
  copyBtnEl.className = 'global-error-btn'
  copyBtnEl.textContent = t(language, 'error.copyDetails')
  copyBtnEl.onclick = () => copyText(`${title}\n${error.stack}`)

  const headerEl = document.createElement('div')
  headerEl.className = 'global-error-header'
  const actionsEl = document.createElement('div')
  actionsEl.className = 'global-error-actions'
  actionsEl.append(copyBtnEl, closeBtnEl)
  headerEl.append(titleEl, actionsEl)
  cardEl.append(headerEl, messageEl, detailsEl)
  containerEl.appendChild(cardEl)
}

export default class ErrorBoundary extends React.Component {
  state = { error: null }

  static getDerivedStateFromError (error) {
    return { error: normalizeError(error) }
  }

  componentDidMount () {
    window.addEventListener('error', this.handleGlobalError)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  componentWillUnmount () {
    window.removeEventListener('error', this.handleGlobalError)
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
  }

  handleGlobalError = (event) => {
    showGlobalError(event.error || event.message, 'global')
  }

  handleUnhandledRejection = (event) => {
    showGlobalError(event.reason, 'promise')
  }

  handleCopyError = () => {
    if (this.state.error) copyText(`${t(getUiLanguage(), 'error.renderError')}\n${this.state.error.stack}`)
  }

  handleReload = () => {
    window.location.reload()
  }

  render () {
    const language = getUiLanguage()
    if (this.state.error) {
      return (
        <div className="render-error-alert">
          <Alert
            variant="filled"
            severity="error"
            action={(
              <>
                <Button onClick={this.handleCopyError} color="inherit">{t(language, 'error.copyDetails')}</Button>
                <Button onClick={this.handleReload} color="inherit">{t(language, 'error.reload')}</Button>
              </>
            )}
          >
            <AlertTitle>{t(language, 'error.renderTitle')}</AlertTitle>
            <p>{t(language, 'error.renderBody')}</p>
            <details>
              <summary>{t(language, 'error.details')}</summary>
              <pre>{this.state.error.stack}</pre>
            </details>
          </Alert>
        </div>
      )
    }
    return this.props.children
  }
}
