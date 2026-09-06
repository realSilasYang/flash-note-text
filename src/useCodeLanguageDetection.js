import { useEffect, useState } from 'react'
import { AUTO_CODE_LANGUAGE, PLAIN_CODE_LANGUAGE } from './editorMode'

const EMPTY_DETECTION = Object.freeze({ language: null, confidence: 0, source: 'empty', candidates: [] })

export function useCodeLanguageDetection ({ enabled, filename, preference, text }) {
  const [detection, setDetection] = useState(EMPTY_DETECTION)

  useEffect(() => {
    if (!enabled) {
      setDetection(EMPTY_DETECTION)
      return undefined
    }
    if (preference === PLAIN_CODE_LANGUAGE) {
      setDetection({ ...EMPTY_DETECTION, source: 'manual-plain' })
      return undefined
    }
    if (preference !== AUTO_CODE_LANGUAGE) {
      setDetection({ language: preference, confidence: 1, source: 'manual', candidates: [{ language: preference, confidence: 1 }] })
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      import('./codeLanguageDetection').then(({ detectCodeLanguageFromSource }) => (
        detectCodeLanguageFromSource({ filename, text })
      )).then(result => {
        if (!cancelled) setDetection(result)
      }).catch(() => {
        if (!cancelled) setDetection({ ...EMPTY_DETECTION, source: 'error' })
      })
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, filename, preference, text])

  return detection
}
