import { host } from './host'

const AI_ROLES = new Set(['system', 'user', 'assistant'])
const MODEL_CAPABILITY_KEYS = new Set([
  'image', 'imageInput', 'image_input', 'input', 'inputModalities', 'input_modalities',
  'isVisionModel', 'modalities', 'multimodal', 'ocr', 'supportsVision', 'text', 'type', 'vision', 'visual'
])
const VISION_CAPABILITY_TOKENS = new Set([
  'image', 'image-input', 'input-image', 'multimodal', 'multi-modal', 'ocr', 'vision', 'visual'
])

export const AI_MODEL_VISION_SUPPORT = Object.freeze({
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown'
})

const NON_VISION_MODEL_PATTERN = /(?:^|[\s/_.-])(?:dall-e|deepseek-(?!vl)[\w.-]+|embedding|flux|gpt-3\.5|gpt-4-(?:0314|0613|32k|1106-preview)|imagen|rerank|sdxl|stable-diffusion|text-embedding|tts|whisper)(?:$|[\s/_.-])/i
const VISION_MODEL_PATTERN = /(?:claude-(?:3|4|opus-4|sonnet-4)|deepseek-vl|doubao.*(?:seed-1[.-][68]|thinking-vision|vision)|gemini|gemma-3|glm-4(?:\.\d+)?v|gpt-4(?:o|\.1|\.5|-turbo|-vision)|gpt-5|grok.*vision|internvl|kimi.*vision|llava|minicpm|moondream|o1(?!-mini)|o3(?!-mini)|o4|pixtral|qwen(?:2(?:\.5)?|3)?-vl|qwen2\.5-omni|qvq|yi-vision)/i

export function normalizeAiModelSelection (model) {
  const value = model && typeof model === 'object'
    ? model.id || model.model || model.name || model.label || ''
    : model
  return String(value || '').trim().slice(0, 160)
}

function normalizeCapabilityValue (value, depth = 0) {
  if (depth > 2) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().slice(0, 240)
  if (Array.isArray(value)) {
    return value.slice(0, 24).map(item => normalizeCapabilityValue(item, depth + 1)).filter(item => item !== undefined)
  }
  if (!value || typeof value !== 'object') return undefined
  const normalized = {}
  for (const [key, item] of Object.entries(value)) {
    if (!MODEL_CAPABILITY_KEYS.has(key)) continue
    const next = normalizeCapabilityValue(item, depth + 1)
    if (next !== undefined) normalized[key] = next
  }
  return Object.keys(normalized).length ? normalized : undefined
}

function appendCapabilityMetadata (target, source, key) {
  const normalized = normalizeCapabilityValue(source?.[key])
  if (normalized !== undefined) target[key] = normalized
}

function parseJsonEnvelope (value) {
  if (typeof value !== 'string') return null
  const candidate = value.trim()
    .replace(/^```(?:json|javascript|js)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```[ \t]*$/i, '$1')
    .replace(/^data:\s*/i, '')
  if (!candidate || (candidate[0] !== '{' && candidate[0] !== '[')) return null
  try { return JSON.parse(candidate) } catch { return null }
}

const IMAGE_DATA_URL_PATTERN = /^data:(image\/(?:png|jpe?g|webp|gif|avif|tiff?|bmp|x-icon))(?:;[^,]*)?;base64,([A-Za-z0-9+/_\-\s]+={0,2})$/i
const EMBEDDED_IMAGE_DATA_URL_PATTERN = /(data:image\/(?:png|jpe?g|webp|gif|avif|tiff?|bmp|x-icon)(?:;[^,]*)?;base64,[A-Za-z0-9+/_\-\s]+={0,2})/i
const SVG_DATA_URL_PATTERN = /^data:image\/svg\+xml(?:;charset=[^;,]+)?(?:;base64)?,([\s\S]*)$/i
const IMAGE_URL_PATTERN = /^https?:\/\/[^\s"'<>]+$/i
function stripImageCodeFence (value) {
  const text = String(value || '').trim()
  const match = text.match(/^```(?:svg|xml|html|image)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```[ \t]*$/i)
  return match ? match[1].trim() : text
}

function svgMarkup (value) {
  const text = stripImageCodeFence(value)
  if (!text) return ''
  const start = text.search(/<svg(?:\s|>)/i)
  if (start < 0) return ''
  const end = text.toLowerCase().lastIndexOf('</svg>')
  if (end < start) return ''
  return text.slice(start, end + '</svg>'.length).trim()
}

function svgDataUrl (value) {
  const markup = svgMarkup(value)
  return markup ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}` : ''
}

function normalizeImageMimeType (value) {
  const mimeType = String(value || '').toLowerCase().trim()
  if (mimeType === 'image/jpg') return 'image/jpeg'
  if (mimeType === 'image/svg' || mimeType === 'image/svg+xml' || mimeType === 'text/svg+xml') return 'image/svg+xml'
  return ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/tiff', 'image/bmp', 'image/x-icon'].includes(mimeType) ? mimeType : 'image/png'
}

function imageDataUrl (mimeType, value) {
  let encoded = String(value || '').trim()
  try {
    if (/%[0-9a-f]{2}/i.test(encoded)) encoded = decodeURIComponent(encoded)
  } catch {}
  encoded = encoded.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return ''
  encoded += '='.repeat((4 - encoded.length % 4) % 4)
  return `data:${normalizeImageMimeType(mimeType)};base64,${encoded}`
}

function isImageByteArray (value) {
  if (!Array.isArray(value) && !ArrayBuffer.isView(value)) return false
  const bytes = Array.from(value)
  return Boolean(bytes.length && bytes.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255))
}

function imageBytesDataUrl (mimeType, value) {
  if (!isImageByteArray(value)) return ''
  const bytes = Array.from(value)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.slice(index, index + 0x8000))
  return imageDataUrl(mimeType, btoa(binary))
}

function imageMimeTypeFromBase64 (value) {
  const encoded = String(value || '').trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!encoded || encoded.length < 16 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return ''
  if (encoded.startsWith('iVBORw0KGgo')) return 'image/png'
  if (encoded.startsWith('/9j/')) return 'image/jpeg'
  if (encoded.startsWith('R0lGOD')) return 'image/gif'
  if (encoded.startsWith('UklGR')) return 'image/webp'
  return ''
}

function addAiImage (images, seen, value, mimeType = '', allowUrl = false) {
  const byteDataUrl = imageBytesDataUrl(mimeType || 'image/png', value)
  if (byteDataUrl) {
    if (seen.has(byteDataUrl)) return
    seen.add(byteDataUrl)
    images.push({ src: byteDataUrl, dataUrl: byteDataUrl, url: '', mimeType: normalizeImageMimeType(mimeType || 'image/png') })
    return
  }
  const raw = stripImageCodeFence(value)
  if (!raw) return
  const dataMatch = raw.match(IMAGE_DATA_URL_PATTERN)
  const svgDataMatch = raw.match(SVG_DATA_URL_PATTERN)
  const inferredMimeType = imageMimeTypeFromBase64(raw)
  const svgMarkupDataUrl = !dataMatch && !svgDataMatch ? svgDataUrl(raw) : ''
  const dataUrl = dataMatch
    ? imageDataUrl(dataMatch[1], dataMatch[2])
    : svgDataMatch
      ? /;base64,/i.test(raw.slice(0, raw.indexOf(',')))
        ? `data:image/svg+xml;base64,${svgDataMatch[1].replace(/\s+/g, '')}`
        : raw
      : svgMarkupDataUrl || imageDataUrl(mimeType || inferredMimeType, raw)
  const url = dataUrl || (allowUrl && IMAGE_URL_PATTERN.test(raw) ? raw : '')
  if (!url || seen.has(url)) return
  seen.add(url)
  const normalizedMimeType = dataMatch
    ? normalizeImageMimeType(dataMatch[1])
    : svgDataMatch || svgMarkupDataUrl
      ? 'image/svg+xml'
      : normalizeImageMimeType(mimeType || inferredMimeType)
  images.push({
    src: url,
    dataUrl: dataUrl || '',
    url: dataUrl ? '' : url,
    mimeType: normalizedMimeType
  })
}

function imageContextForKey (key, parentContext) {
  const name = String(key || '').toLowerCase().replace(/[-_]/g, '')
  return Boolean(parentContext || name.includes('image') || name.includes('inline') || name.includes('b64') || name.includes('base64'))
}

export function extractAiImages (value, images = [], seen = new Set(), context = false) {
  if (typeof value === 'string') {
    const text = value.trim()
    const envelope = parseJsonEnvelope(text)
    if (envelope) {
      const before = images.length
      extractAiImages(envelope, images, seen, context)
      if (images.length > before) return images
    }
    const embeddedDataUrl = text.match(EMBEDDED_IMAGE_DATA_URL_PATTERN)?.[1]
    if (IMAGE_DATA_URL_PATTERN.test(text) || SVG_DATA_URL_PATTERN.test(text) || svgMarkup(text)) addAiImage(images, seen, text)
    else if (embeddedDataUrl) addAiImage(images, seen, embeddedDataUrl)
    else if (context && IMAGE_URL_PATTERN.test(text)) addAiImage(images, seen, text, '', true)
    else {
      const markdownUrl = text.match(/!\[[^\]]*\]\(\s*(<[^>]+>|(?:https?:\/\/|data:image\/)[^\s)]+)\s*\)/i)?.[1]?.replace(/^<|>$/g, '')
      if (markdownUrl) addAiImage(images, seen, markdownUrl, '', true)
      else if (context && text.length >= 32 && /^[A-Za-z0-9+/_-]+={0,2}$/.test(text)) addAiImage(images, seen, text, imageMimeTypeFromBase64(text) || 'image/png')
      else {
        const inferredMimeType = imageMimeTypeFromBase64(text)
        if (inferredMimeType) addAiImage(images, seen, text, inferredMimeType)
      }
    }
    return images
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return images
  seen.add(value)
  if (Array.isArray(value)) {
    value.forEach(item => extractAiImages(item, images, seen, context))
    return images
  }

  const type = String(value.type || '').toLowerCase()
  const mimeType = value.mime_type || value.mimeType || value.media_type || value.mediaType || ''
  const imageType = context || type.includes('image') || type.includes('inline') || Boolean(mimeType)
  if (typeof value.url === 'string') addAiImage(images, seen, value.url, mimeType, imageType)
  if (typeof value.b64_json === 'string') addAiImage(images, seen, value.b64_json, mimeType || 'image/png')
  if (typeof value.base64 === 'string') addAiImage(images, seen, value.base64, mimeType || 'image/png')
  for (const key of ['image', 'image_data', 'imageData', 'base64_image', 'base64Image', 'image_base64', 'imageBase64']) {
    if (typeof value[key] === 'string') addAiImage(images, seen, value[key], mimeType || 'image/png', true)
    else if (isImageByteArray(value[key])) addAiImage(images, seen, value[key], mimeType || 'image/png', true)
    else if (value[key] && typeof value[key] === 'object') extractAiImages(value[key], images, seen, true)
  }
  if (typeof value.data === 'string') {
    const isData = IMAGE_DATA_URL_PATTERN.test(value.data) || SVG_DATA_URL_PATTERN.test(value.data) || svgMarkup(value.data)
    if (isData || imageType) addAiImage(images, seen, value.data, mimeType || 'image/png', imageType)
  } else if (value.data && typeof value.data === 'object') {
    if (imageType && isImageByteArray(value.data)) addAiImage(images, seen, value.data, mimeType || 'image/png', true)
    else extractAiImages(value.data, images, seen, true)
  }
  if (typeof value.image_url === 'string') addAiImage(images, seen, value.image_url, mimeType, true)
  else if (value.image_url && typeof value.image_url === 'object') extractAiImages(value.image_url, images, seen, true)
  if (value.inline_data && typeof value.inline_data === 'object') extractAiImages(value.inline_data, images, seen, true)
  if (value.inlineData && typeof value.inlineData === 'object') extractAiImages(value.inlineData, images, seen, true)
  for (const key of ['bytes', 'byte_array', 'byteArray', 'image_bytes', 'imageBytes', 'buffer']) {
    if (isImageByteArray(value[key])) addAiImage(images, seen, value[key], mimeType || 'image/png', true)
    else if (value[key] && typeof value[key] === 'object') extractAiImages(value[key], images, seen, true)
  }

  // 图片生成 API 经常把真正的 base64 数据放在图片对象下方的 `result`、`output`
  // 等字段中。遍历这些字段时继续携带图片上下文，避免把图片数据误判为普通文本。
  for (const [key, item] of Object.entries(value)) {
    if (['url', 'data', 'base64', 'b64_json', 'image', 'image_data', 'imageData', 'base64_image', 'base64Image', 'image_base64', 'imageBase64', 'image_url', 'inline_data', 'inlineData'].includes(key)) continue
    const payloadKey = String(key).toLowerCase().replace(/[-_]/g, '')
    if (imageType && ['result', 'imagedata', 'outputdata', 'base64data'].includes(payloadKey) && typeof item === 'string') {
      addAiImage(images, seen, item, mimeType || 'image/png', true)
      continue
    }
    extractAiImages(item, images, seen, imageContextForKey(key, imageType))
  }
  return images
}

function textFromContent (content, seen = new Set(), allowJsonFallback = true) {
  if (typeof content === 'string') {
    if (content === '[DONE]' || IMAGE_DATA_URL_PATTERN.test(content) || SVG_DATA_URL_PATTERN.test(content) || svgMarkup(content) || imageMimeTypeFromBase64(content)) return ''
    const envelope = parseJsonEnvelope(content)
    if (envelope && extractAiImages(envelope).length) return ''
    return content
  }
  if (content == null) return ''
  if (typeof content === 'number' || typeof content === 'boolean') return String(content)
  if (typeof content !== 'object' || seen.has(content)) return ''
  seen.add(content)
  if (Array.isArray(content)) return content.map(part => textFromContent(part, seen, allowJsonFallback)).join('')

  if (content.type === 'image_url' || content.type === 'image') return '[参考图已附加]'
  const textKeys = [
    'text', 'output_text', 'outputText', 'content', 'delta', 'message', 'parts',
    'choices', 'candidates', 'output', 'response', 'result', 'data', 'value'
  ]
  for (const key of textKeys) {
    if (!(key in content)) continue
    const text = textFromContent(content[key], seen, allowJsonFallback)
    if (text) return text
  }
  if (!allowJsonFallback) return ''
  try { return JSON.stringify(content) } catch { return '' }
}

export function normalizeAiMessage (message) {
  if (!message || typeof message !== 'object' || !AI_ROLES.has(message.role)) return null
  const normalized = { role: message.role, content: Array.isArray(message.content) ? message.content : textFromContent(message.content) }
  if (typeof message.reasoning_content === 'string' && message.reasoning_content) normalized.reasoning_content = message.reasoning_content
  return normalized
}

export function normalizeAiMessages (messages) {
  if (!Array.isArray(messages)) throw createAiError('AI_INVALID_REQUEST', 'AI messages must be an array')
  const normalized = messages.map(normalizeAiMessage).filter(Boolean)
  if (!normalized.length) throw createAiError('AI_INVALID_REQUEST', 'AI messages cannot be empty')
  return normalized
}

export function normalizeAiModel (model) {
  if (typeof model === 'string') {
    const id = model.trim().slice(0, 160)
    return id ? { id, label: id, description: '', icon: '', cost: 0 } : null
  }
  if (!model || typeof model !== 'object') return null
  const id = String(model.id || '').trim().slice(0, 160)
  if (!id) return null
  const cost = Number(model.cost)
  const normalized = {
    id,
    label: String(model.label || id).trim() || id,
    description: String(model.description || '').trim(),
    icon: String(model.icon || '').trim(),
    cost: Number.isFinite(cost) ? cost : 0
  }
  for (const key of ['capabilities', 'modalities', 'inputModalities', 'input_modalities', 'type']) {
    appendCapabilityMetadata(normalized, model, key)
  }
  for (const key of ['supportsVision', 'isVisionModel', 'vision']) {
    if (typeof model[key] === 'boolean') normalized[key] = model[key]
  }
  if (typeof model.provider === 'string' && model.provider.trim()) normalized.provider = model.provider.trim().slice(0, 80)
  return normalized
}

export function normalizeAiModels (models) {
  if (!Array.isArray(models)) return []
  const seen = new Set()
  return models.map(normalizeAiModel).filter(model => {
    if (!model || seen.has(model.id)) return false
    seen.add(model.id)
    return true
  })
}

function modelMatchesSelection (model, selection) {
  const selected = normalizeAiModelSelection(selection).toLowerCase()
  return selected && [model?.id, model?.label].some(value => String(value || '').trim().toLowerCase() === selected)
}

export function resolveAiModelSelection (selection, models = []) {
  const normalizedModels = normalizeAiModels(models)
  if (selection && typeof selection === 'object') {
    const normalizedSelection = normalizeAiModel(selection)
    if (normalizedSelection) {
      return normalizedModels.find(model => modelMatchesSelection(model, normalizedSelection.id) || modelMatchesSelection(model, normalizedSelection.label)) || normalizedSelection
    }
  }
  const selected = normalizeAiModelSelection(selection)
  if (!selected || /^(?:auto|default|default model|默认模型)$/i.test(selected)) return normalizedModels[0] || null
  return normalizedModels.find(model => modelMatchesSelection(model, selected)) || normalizeAiModel(selected)
}

function explicitVisionFlag (model) {
  for (const key of ['supportsVision', 'isVisionModel', 'vision']) {
    if (typeof model?.[key] === 'boolean') return model[key]
  }
  for (const source of [model?.capabilities, model?.type]) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue
    for (const key of ['supportsVision', 'isVisionModel', 'vision', 'visual', 'multimodal', 'image', 'imageInput', 'image_input']) {
      if (typeof source[key] === 'boolean') return source[key]
    }
  }
  return null
}

function capabilityTokens (value, tokens = []) {
  if (typeof value === 'string') {
    value.toLowerCase().split(/[\s,|/;]+/).filter(Boolean).forEach(token => tokens.push(token.replace(/_/g, '-')))
  } else if (Array.isArray(value)) {
    value.forEach(item => capabilityTokens(item, tokens))
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (item === true) tokens.push(key.toLowerCase().replace(/_/g, '-'))
      else if (item !== false) capabilityTokens(item, tokens)
    }
  }
  return tokens
}

function supportFromCapabilityList (value) {
  if (value == null) return AI_MODEL_VISION_SUPPORT.UNKNOWN
  const tokens = capabilityTokens(value)
  if (tokens.some(token => VISION_CAPABILITY_TOKENS.has(token))) return AI_MODEL_VISION_SUPPORT.YES
  return tokens.length ? AI_MODEL_VISION_SUPPORT.NO : AI_MODEL_VISION_SUPPORT.UNKNOWN
}

function supportFromDescription (description) {
  const text = String(description || '').trim()
  if (!text) return AI_MODEL_VISION_SUPPORT.UNKNOWN
  if (/(?:不支持|不具备|无法|不能).{0,8}(?:图片|图像|视觉|多模态)|(?:纯文本|仅文本|文本专用|text[- ]only|without (?:image|vision)|no (?:image|vision))/i.test(text)) return AI_MODEL_VISION_SUPPORT.NO
  if (/(?:视觉(?:理解|能力|输入|识别)?|图像(?:理解|输入|识别)|图片(?:理解|输入|识别)|多模态|看图|image (?:input|understanding|recognition)|vision|multimodal|OCR)/i.test(text)) return AI_MODEL_VISION_SUPPORT.YES
  return AI_MODEL_VISION_SUPPORT.UNKNOWN
}

export function getAiModelVisionSupport (selection, models = []) {
  const model = resolveAiModelSelection(selection, models)
  if (!model) return AI_MODEL_VISION_SUPPORT.UNKNOWN

  const explicit = explicitVisionFlag(model)
  if (explicit !== null) return explicit ? AI_MODEL_VISION_SUPPORT.YES : AI_MODEL_VISION_SUPPORT.NO

  for (const value of [model.inputModalities, model.input_modalities, model.capabilities, model.modalities]) {
    const support = supportFromCapabilityList(value)
    if (support !== AI_MODEL_VISION_SUPPORT.UNKNOWN) return support
  }

  const described = supportFromDescription(model.description)
  if (described !== AI_MODEL_VISION_SUPPORT.UNKNOWN) return described

  const identity = [model.id, model.label, model.provider].filter(Boolean).join(' ')
  if (NON_VISION_MODEL_PATTERN.test(identity)) return AI_MODEL_VISION_SUPPORT.NO
  if (VISION_MODEL_PATTERN.test(identity)) return AI_MODEL_VISION_SUPPORT.YES
  return AI_MODEL_VISION_SUPPORT.UNKNOWN
}

function normalizeTool (tool) {
  if (!tool || tool.type !== 'function' || !tool.function || typeof tool.function !== 'object') return null
  const name = String(tool.function.name || '').trim()
  const description = String(tool.function.description || '').trim()
  const parameters = tool.function.parameters
  if (!name || !description || !parameters || typeof parameters !== 'object' || parameters.type !== 'object' || !parameters.properties || typeof parameters.properties !== 'object') return null
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters,
      ...(Array.isArray(tool.function.required) ? { required: tool.function.required.map(String) } : {})
    }
  }
}

export function createAiRequest ({ model = '', messages, tools } = {}) {
  const normalizedMessages = normalizeAiMessages(messages)
  const normalizedModel = normalizeAiModelSelection(model)
  const request = { messages: normalizedMessages }
  if (normalizedModel) request.model = normalizedModel
  if (Array.isArray(tools)) {
    const normalizedTools = tools.map(normalizeTool).filter(Boolean)
    if (normalizedTools.length) request.tools = normalizedTools
  }
  return request
}

export function createAiError (code, message, cause, status) {
  const error = cause instanceof Error ? cause : new Error(message || code)
  error.code = code
  if (message && !(cause instanceof Error)) error.message = message
  if (cause && cause !== error) error.cause = cause
  if (status != null && Number.isFinite(Number(status))) error.status = Number(status)
  return error
}

function statusFromError (error) {
  const explicit = Number(error?.status || error?.statusCode || error?.response?.status)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  const match = String(error?.message || '').match(/\b([45]\d\d)\b/)
  return match ? Number(match[1]) : undefined
}

function isMissingChatChoicesError (error) {
  return /cannot read properties of undefined\s*\(reading ['"]0['"]\)/i.test(String(error?.message || ''))
}

export function normalizeAiError (error, { model = '', expectsImage = false } = {}) {
  if (error?.code === 'AI_ABORTED' || error?.name === 'AbortError') return createAiError('AI_ABORTED', 'AI request was cancelled', error)
  const status = statusFromError(error)
  if (error?.code === 'AI_UNAVAILABLE') return createAiError('AI_UNAVAILABLE', error.message, error)
  if (expectsImage && isMissingChatChoicesError(error)) {
    const normalized = createAiError('AI_IMAGE_API_UNSUPPORTED', 'The image model returned an Images API response, but uTools AI only supports Chat Completions responses for custom models.', error)
    normalized.model = String(model || '').trim()
    return normalized
  }
  let code = error?.code || ''
  if (!code || /^ERR_/i.test(code)) {
    if (status === 408) code = 'AI_TIMEOUT'
    else if (status >= 500) code = 'AI_SERVER'
    else if (status === 429) code = 'AI_RATE_LIMIT'
    else if (status >= 400) code = 'AI_BAD_REQUEST'
    else if (/network|fetch|socket|econn|连接/i.test(String(error?.message || ''))) code = 'AI_NETWORK'
    else code = 'AI_CALL_FAILED'
  }
  const normalized = createAiError(code, String(error?.message || 'AI request failed'), error, status)
  normalized.model = String(model || '').trim()
  return normalized
}

function chunkContent (chunk) {
  if (typeof chunk === 'string') {
    if (/^data:\s*\[DONE\]\s*$/i.test(chunk.trim())) return ''
    const envelope = /^data:\s*/i.test(chunk.trim()) ? parseJsonEnvelope(chunk) : null
    return envelope ? chunkContent(envelope) : textFromContent(chunk)
  }
  if (!chunk || typeof chunk !== 'object') return textFromContent(chunk)
  const candidates = [
    chunk.content,
    chunk.text,
    chunk.output_text,
    chunk.outputText,
    chunk.delta,
    chunk.choices?.[0]?.delta?.content,
    chunk.choices?.[0]?.delta?.text,
    chunk.choices?.[0]?.message?.content,
    chunk.choices?.[0]?.message?.text,
    chunk.choices?.[0]?.text,
    chunk.candidates?.[0]?.content,
    chunk.candidates?.[0]?.content?.parts,
    chunk.response,
    chunk.result,
    chunk.data
  ]
  for (const [index, candidate] of candidates.entries()) {
    const envelope = index === candidates.length - 1 && typeof candidate === 'string' ? parseJsonEnvelope(candidate) : null
    const text = envelope ? chunkContent(envelope) : textFromContent(candidate, new Set(), false)
    if (text) return text
  }
  return ''
}

function chunkReasoningContent (chunk) {
  if (!chunk || typeof chunk !== 'object') return ''
  const values = [
    chunk?.reasoning_content,
    chunk?.reasoningContent,
    chunk?.reasoning,
    chunk?.thinking,
    chunk?.analysis,
    chunk?.delta?.reasoning_content,
    chunk?.delta?.reasoningContent,
    chunk?.delta?.reasoning,
    chunk?.delta?.thinking,
    chunk?.choices?.[0]?.delta?.reasoning_content,
    chunk?.choices?.[0]?.delta?.reasoningContent,
    chunk?.choices?.[0]?.delta?.reasoning,
    chunk?.choices?.[0]?.message?.reasoning_content,
    chunk?.choices?.[0]?.message?.reasoningContent,
    chunk?.choices?.[0]?.message?.reasoning,
    chunk?.candidates?.[0]?.content?.parts?.filter(part => part?.thought).map(part => part?.text || '').join('')
  ]
  for (const value of values) {
    const text = textFromContent(value, new Set(), false)
    if (text) return text
  }
  return ''
}

function normalizeChunk (chunk, expectsImage = false) {
  if (typeof chunk === 'string') {
    const envelope = parseJsonEnvelope(chunk)
    const images = extractAiImages(envelope || chunk, [], new Set(), expectsImage)
    return {
      // 保留普通 JSON 中的文本响应；如果同一响应封装同时包含图片，则不要把原始图片
      // 数据直接显示到文本结果区域。
      content: images.length && (envelope || expectsImage) ? chunkContent(envelope || chunk) : chunkContent(chunk),
      reasoning_content: '',
      images
    }
  }
  return {
    content: chunkContent(chunk),
    reasoning_content: chunkReasoningContent(chunk),
    images: extractAiImages(chunk, [], new Set(), expectsImage)
  }
}

function appendStreamText (current, incoming) {
  const previous = String(current || '')
  const next = String(incoming || '')
  if (!next) return previous
  if (!previous) return next
  // 某些自定义模型桥接层会在每个分片中重复发送当前已经累积的完整文本，
  // 需要识别这种情况，避免把同一段内容反复拼接。
  if (next.length > previous.length && next.startsWith(previous)) return next
  return previous + next
}

function overlapLength (left, right) {
  if (!left || !right) return 0
  const prefixTable = new Uint32Array(right.length)
  for (let index = 1, matched = 0; index < right.length; index += 1) {
    while (matched > 0 && right[index] !== right[matched]) matched = prefixTable[matched - 1]
    if (right[index] === right[matched]) matched += 1
    prefixTable[index] = matched
  }
  let matched = 0
  for (let index = 0; index < left.length; index += 1) {
    const character = left[index]
    while (matched > 0 && character !== right[matched]) matched = prefixTable[matched - 1]
    if (character === right[matched]) matched += 1
    if (matched === right.length) {
      if (index === left.length - 1) return right.length
      matched = prefixTable[matched - 1]
    }
  }
  return matched
}

function mergeFinalText (streamText, finalText) {
  const stream = String(streamText || '')
  const final = String(finalText || '')
  if (!stream) return final
  if (!final || stream === final) return stream
  if (final.startsWith(stream) || final.includes(stream)) return final
  if (stream.startsWith(final) || stream.includes(final)) return stream
  const overlap = overlapLength(stream, final)
  if (overlap) return stream + final.slice(overlap)
  return final.length > stream.length ? final : stream
}

function normalizeFinalResponse (response, stream, expectsImage = false) {
  const final = normalizeChunk(response, expectsImage)
  return {
    content: mergeFinalText(stream.content, final.content),
    reasoning_content: mergeFinalText(stream.reasoning_content, final.reasoning_content),
    images: mergeAiImages(stream.images, final.images),
    raw: response
  }
}

function mergeAiImages (current = [], incoming = []) {
  const merged = []
  const seen = new Set()
  for (const image of [...(current || []), ...(incoming || [])]) {
    if (!image?.src || seen.has(image.src)) continue
    seen.add(image.src)
    merged.push(image)
  }
  return merged
}

export function runAiRequest ({ request, model = request?.model || '', onChunk, stream = true, expectsImage = false, direct } = {}) {
  const shouldStream = stream !== false && !direct?.enabled
  const state = { content: '', reasoning_content: '', images: [] }
  let settled = false
  const handleChunk = chunk => {
    if (settled) return
    const normalized = normalizeChunk(chunk, expectsImage)
    state.content = appendStreamText(state.content, normalized.content)
    state.reasoning_content = appendStreamText(state.reasoning_content, normalized.reasoning_content)
    state.images = mergeAiImages(state.images, normalized.images)
    try { onChunk?.(normalized, { ...state, images: [...state.images] }) } catch (error) { console.warn('AI 流式回调失败', error) }
  }
  // 直连请求刻意采用非流式模式。preload 客户端原样返回服务商响应封装，
  // 这样同一个规范化器就能统一读取 Chat Completions、Images API 以及服务商自定义的图片字段。
  const operation = direct?.enabled
    ? host.ai(request, undefined, direct)
    : shouldStream
      ? host.ai(request, handleChunk)
      : host.ai(request)
  const result = new Promise((resolve, reject) => {
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }
    const promise = Promise.resolve(operation)
    promise.then(response => {
      if (settled) return
      try {
        const normalized = normalizeFinalResponse(response, state, expectsImage)
        if (!shouldStream) {
          try {
            onChunk?.(normalizeChunk(response, expectsImage), {
              content: normalized.content,
              reasoning_content: normalized.reasoning_content,
              images: [...normalized.images]
            })
          } catch (error) {
            console.warn('AI 响应回调失败', error)
          }
        }
        finish(resolve, normalized)
      } catch (error) {
        finish(reject, normalizeAiError(error, { model, expectsImage }))
      }
    }, error => {
      finish(reject, normalizeAiError(error, { model, expectsImage }))
    })
  })
  result.abort = (...args) => {
    try { operation?.abort?.(...args) } catch (error) { console.warn('终止 AI 请求失败', error) }
  }
  return result
}

export function loadAiModels () {
  return host.allAiModels().then(normalizeAiModels).catch(error => {
    throw normalizeAiError(error)
  })
}

export function isAiAbortError (error) {
  return error?.code === 'AI_ABORTED' || error?.name === 'AbortError'
}
