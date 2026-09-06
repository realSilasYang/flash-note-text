import { createRoot } from 'react-dom/client'
import './index.less'
import ErrorBoundary from './ErrorBoundary'
import App from './App'
import { loadSettings } from './historyStore'

let initialSettings = null
try {
  if (window.utools) initialSettings = loadSettings(window.utools)
} catch {}

const root = createRoot(document.getElementById('root'))
root.render(<ErrorBoundary><App initialSettings={initialSettings} /></ErrorBoundary>)
