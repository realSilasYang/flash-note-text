import { serviceError } from './errors'

const memoryStore = new Map()
const memoryDbStorage = {
  getItem: key => memoryStore.has(key) ? memoryStore.get(key) : null,
  setItem: (key, value) => { memoryStore.set(key, value) },
  removeItem: key => { memoryStore.delete(key) }
}

function nativeApi () {
  if (typeof window !== 'undefined' && window.utools) return window.utools
  if (typeof globalThis !== 'undefined' && globalThis.utools) return globalThis.utools
  return null
}

export const host = {
  get mode () { return nativeApi() ? 'utools' : 'development-simulator' },
  get dbStorage () { return nativeApi()?.dbStorage || memoryDbStorage },
  ai (options, onChunk, direct) {
    if (direct?.enabled) {
      const service = typeof window !== 'undefined' ? window.aiServices : globalThis.aiServices
      if (typeof service?.request !== 'function') {
        const error = serviceError('ai.errorDirectUnavailable')
        error.code = 'AI_DIRECT_UNAVAILABLE'
        return Promise.reject(error)
      }
      try {
        const operation = service.request({
          config: direct,
          request: options,
          image: direct.image || null
        })
        return operation && typeof operation.then === 'function' ? operation : Promise.resolve(operation)
      } catch (error) {
        return Promise.reject(error)
      }
    }
    const api = nativeApi()
    if (typeof api?.ai !== 'function') {
      const error = serviceError('ai.errorUnavailable')
      error.code = 'AI_UNAVAILABLE'
      return Promise.reject(error)
    }
    try {
      const operation = api.ai(options, onChunk)
      return operation && typeof operation.then === 'function' ? operation : Promise.resolve(operation)
    } catch (error) {
      return Promise.reject(error)
    }
  },
  allAiModels () {
    const api = nativeApi()
    if (typeof api?.allAiModels !== 'function') return Promise.resolve([])
    try { return Promise.resolve(api.allAiModels()) } catch (error) { return Promise.reject(error) }
  },
  openAiModelsSettings () {
    const api = nativeApi()
    if (typeof api?.redirectAiModelsSetting !== 'function') return false
    try {
      api.redirectAiModelsSetting()
      return true
    } catch {
      return false
    }
  }
}

function compactAiDiagnostic (value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text || /^(?:\[.*?\]\s*)?(?:internal server error|server error|service unavailable|ai request failed|request failed|http\s*5\d\d|5\d\d)$/i.test(text)) return ''
  return text
    .replace(/data:image\/[^,\s]+,[A-Za-z0-9+/_=-]+/gi, '[image data omitted]')
    .replace(/\b(?:bearer|api[ _-]?key|authorization)\s*[:=]?\s*[^\s,;]+/gi, '$1 [redacted]')
    .slice(0, 600)
}

function isIncompleteChatCompletionsResponse (value) {
  return /invalid json response body.*unexpected end of json|unexpected end of json.*(?:chat\/completions|response body)/i.test(String(value || ''))
}

function incompleteResponseExplanation (attempt, language) {
  if (!attempt || !isIncompleteChatCompletionsResponse(attempt.message)) return ''
  const usesReferenceAnalysis = attempt.id === 'reference-analysis'
  const chinese = /^zh/i.test(String(language || ''))
  if (chinese) {
    return usesReferenceAnalysis
      ? '具体原因：参考图分析文本请求不含二进制图片，但 uTools 在解析 Chat Completions 响应时收到不完整 JSON，插件尚未获得模型输出。说明“hy3”的上游服务或代理没有返回完整的 Chat Completions JSON，而不是参考图编码或图片解码失败。'
      : '具体原因：uTools 在解析 Chat Completions 响应时收到不完整 JSON，插件尚未获得模型输出。上游服务或代理没有返回完整的 Chat Completions JSON。'
  }
  return usesReferenceAnalysis
    ? 'Cause: the reference-analysis request contains no binary image, but uTools received incomplete JSON while parsing the Chat Completions response. The plugin never received model output, so the hy3 upstream service or proxy did not return a complete Chat Completions JSON response rather than failing to encode or decode the reference image.'
    : 'Cause: uTools received incomplete JSON while parsing the Chat Completions response. The plugin never received model output because the upstream service or proxy did not return a complete Chat Completions JSON response.'
}

function imageRequestStage (id, language, t) {
  const chinese = /^zh/i.test(String(language || ''))
  const labels = chinese
    ? {
        'base64-reference': 'Base64 文本参考图',
        'multimodal-reference': 'OpenAI 多模态参考图',
        'reference-analysis': '参考图分析文本',
        'direct-images-api': t(language, 'ai.directImagesApi')
      }
    : {
        'base64-reference': 'Base64 text reference image',
        'multimodal-reference': 'OpenAI multimodal reference image',
        'reference-analysis': 'reference-image analysis text',
        'direct-images-api': t(language, 'ai.directImagesApi')
      }
  return labels[id] || (chinese ? '未知图片请求格式' : 'unknown image request format')
}

function explainImageGenerationError (error, t, language, model) {
  const attempts = Array.isArray(error?.imageGenerationDiagnostics?.attempts)
    ? error.imageGenerationDiagnostics.attempts
    : []
  if (!attempts.length) return ''
  const finalAttempt = attempts[attempts.length - 1]
  const unknownStatus = /^zh/i.test(String(language || '')) ? '未知状态' : 'unknown status'
  const status = finalAttempt.status || error?.status || unknownStatus
  const attempted = attempts.map(attempt => {
    const attemptStatus = attempt.status || unknownStatus
    return `${imageRequestStage(attempt.id, language, t)} (HTTP ${attemptStatus})`
  }).join(' -> ')
  const modelName = String(model || error?.model || '').trim() || t(language, 'ai.modelAuto')
  const detail = compactAiDiagnostic(finalAttempt.message)
  const cause = incompleteResponseExplanation(finalAttempt, language)
  const headline = t(language, 'ai.errorImageGenerationRequest', {
    attempts: attempted,
    model: modelName,
    status
  })
  const providerDetail = detail
    ? t(language, 'ai.errorImageGenerationProviderDetail', { detail })
    : t(language, 'ai.errorImageGenerationNoProviderDetail')
  return [headline, cause, providerDetail].filter(Boolean).join('\n')
}

export function explainHostAiError (error, t, language, model = '') {
  const message = String(error?.message || '').trim()
  const imageGenerationError = explainImageGenerationError(error, t, language, model)
  if (imageGenerationError) return imageGenerationError
  if (error?.code === 'AI_UNAVAILABLE') return t(language, 'ai.errorUnavailable')
  if (error?.code === 'AI_DIRECT_UNAVAILABLE') return t(language, 'ai.errorDirectUnavailable')
  if (error?.code === 'AI_DIRECT_CONFIG') return t(language, 'ai.errorDirectConfig')
  if (error?.code === 'AI_DIRECT_INVALID_RESPONSE') return t(language, 'ai.errorDirectInvalidResponse')
  if (error?.code === 'AI_ABORTED') return t(language, 'ai.errorCancelled')
  if (error?.code === 'AI_IMAGE_API_UNSUPPORTED') return t(language, 'ai.errorImageApiUnsupported', { model: model || error?.model || '' })
  if (error?.status === 400 || /\b400\b|bad request|请求无效/i.test(message)) {
    const reportedModel = model || message.match(/(?:自定义|custom)\s*AI\s*模型?\s*["“]([^"”]+)["”]/i)?.[1] || ''
    return reportedModel
      ? t(language, 'ai.errorBadRequest', { model: reportedModel })
      : t(language, 'ai.errorDefaultBadRequest')
  }
  if (error?.status === 401 || /\b401\b|unauthorized|authentication/i.test(message)) return t(language, 'ai.errorAuth')
  if (error?.status === 403 || /\b403\b|forbidden/i.test(message)) return t(language, 'ai.errorForbidden')
  if (error?.status === 408 || error?.code === 'AI_TIMEOUT' || /\b408\b|timeout|timed out|超时/i.test(message)) return t(language, 'ai.errorTimeout')
  if (error?.status === 429 || /rate|quota|频率|限额|\b429\b/i.test(message)) return t(language, 'ai.errorRateLimit')
  if ((error?.status >= 500 && error?.status < 600) || /\b5\d\d\b|server error|服务异常/i.test(message)) return t(language, 'ai.errorServer')
  if (error?.code === 'AI_NETWORK' || /network|fetch|连接|socket|econn/i.test(message)) return t(language, 'ai.errorNetwork')
  return message || t(language, 'ai.callFailed')
}
