import { MAX_TEXT_LENGTH } from '../constants'
import { createAiRequest, runAiRequest } from './aiService'

export function buildFormattingRequest ({ model, systemPrompt, prompt, content }) {
  const system = String(systemPrompt || '').trim() || '你是严谨的文本排版助手。保留原意和重要信息，只输出修改后的完整文本。'
  const user = `<user_request>\n${String(prompt || '').trim()}\n</user_request>\n<source_text>\n${String(content || '')}\n</source_text>\n请只输出排版后的完整正文，不要解释，不要添加代码围栏。`
  return createAiRequest({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
}

function imageMimeType (dataUrl) {
  return String(dataUrl || '').match(/^data:(image\/(?:png|jpeg|webp|gif|avif|tiff?|bmp|x-icon|svg\+xml))(?:;[^,]*)?;base64,/i)?.[1]?.toLowerCase() || 'image/png'
}

export function buildVisionMessageContent ({ model, text, dataUrl }) {
  const normalizedModel = String(model || '').toLowerCase()
  const mimeType = imageMimeType(dataUrl)
  const base64 = String(dataUrl || '').replace(/^data:image\/(?:png|jpeg|webp|gif|avif|tiff?|bmp|x-icon|svg\+xml)(?:;[^,]*)?;base64,/i, '')
  if (normalizedModel.includes('claude') || normalizedModel.includes('anthropic')) {
    return [
      { type: 'text', text },
      { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } }
    ]
  }
  if (normalizedModel.includes('gemini') || normalizedModel.includes('google')) {
    return [
      { text },
      { inline_data: { mime_type: mimeType, data: base64 } }
    ]
  }
  return [
    { type: 'text', text },
    { type: 'image_url', image_url: { url: String(dataUrl || '') } }
  ]
}

export function shouldUseCurrentImageReference (imageTask) {
  return imageTask === 'refine'
}

function imageEntryContext ({ content, imageTask, referenceDataUrl }) {
  const entryContent = String(content || '').trim()
  if (!entryContent) return ''
  const refiningCurrentImage = Boolean(referenceDataUrl) && shouldUseCurrentImageReference(imageTask)
  const priority = refiningCurrentImage
    ? 'The supplied current image is the editing source. The entry content below is its semantic context: use it to understand the intended subject and message, but preserve the current image except for changes explicitly requested by the user.\n当前图片是微调的编辑源。下方条目正文只用于理解图片应表达的主题和信息；除非用户明确要求，不得因为正文而重做、替换或扩展当前图片。'
    : 'The entry content above is the mandatory primary semantic source for this image. Identify its central topic, subjects, events, objects, information, and intended message, then make them visibly present in the result. Do not substitute an unrelated scene, generic motif, or decorative concept. The user request below only adds presentation requirements; follow an explicit conflict only when the user clearly asks to change or omit a specific part of the entry.\n条目正文是这张图片不可忽略的首要语义来源。必须让图片明确表达正文的核心主题、主体、事件、对象、信息和意图；不得用无关场景、泛化意象或装饰性概念替代。下方用户要求仅补充呈现方式，只有在用户明确要求修改或省略正文某部分时才按冲突要求处理。'
  return `<entry_content>\n${entryContent}\n</entry_content>\n\n<entry_content_priority>\n${priority}\n</entry_content_priority>`
}

export function buildImageGenerationRequest ({ model, prompt, content = '', systemPrompt = '', referenceDataUrl = '', referenceAnalysis = '', imageTask = 'regenerate', referenceAsText = false }) {
  const system = String(systemPrompt || '').trim() || '你是一个图像生成助手。根据用户要求生成图片，并在模型支持时直接返回图片数据。'
  const userRequest = String(prompt || '').trim()
  const entryContext = imageEntryContext({ content, imageTask, referenceDataUrl })
  const userText = [
    referenceDataUrl && imageTask === 'refine'
      ? '<reference_image_instruction>Use the attached current image as the editing source. Change only what the user explicitly requests and preserve all other subjects, layout, text, colors, proportions, and details.</reference_image_instruction>'
      : '',
    !referenceDataUrl && referenceAnalysis
      ? `<reference_image_analysis>\n${String(referenceAnalysis).trim()}\n</reference_image_analysis>\n<reference_image_fallback_instruction>Use this analysis as the visual source for the requested image. Reproduce only details supported by the analysis and user request; do not claim that you directly received or inspected the original reference image.</reference_image_fallback_instruction>`
      : '',
    entryContext,
    `<user_request>\n${userRequest}\n</user_request>`,
  ].filter(Boolean).join('\n\n')
  const user = referenceDataUrl
    ? referenceAsText
      ? `${userText}\n\n<reference_image_data_url>\n${referenceDataUrl}\n</reference_image_data_url>`
      : buildVisionMessageContent({ model, text: userText, dataUrl: referenceDataUrl })
    : userText
  // 某些兼容 OpenAI 协议的图片模型如果未明确声明输出类型，会默认返回纯文本，
  // 即使所选模型实际支持图片生成，因此这里显式要求图片输出。
  return createAiRequest({
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
  })
}

export function buildDirectImageApiPrompt ({ prompt, content = '', systemPrompt = '', referenceDataUrl = '', referenceAnalysis = '', imageTask = 'regenerate' }) {
  const system = String(systemPrompt || '').trim() || '根据用户要求生成图片。'
  const userRequest = String(prompt || '').trim()
  const entryContext = imageEntryContext({ content, imageTask, referenceDataUrl })
  return [
    system,
    referenceDataUrl
      ? imageTask === 'refine'
        ? 'Use the supplied image as the editing source. Change only what the user explicitly requests and preserve all other visual details.'
        : 'Use the supplied image as visual reference for a new generation. Follow the user request while preserving relevant subjects, composition, and style.'
      : '',
    !referenceDataUrl && referenceAnalysis
      ? `<reference_image_analysis>\n${String(referenceAnalysis).trim()}\n</reference_image_analysis>`
      : '',
    entryContext,
    `<user_request>\n${userRequest}\n</user_request>`,
  ].filter(Boolean).join('\n\n')
}

export function stripOuterCodeFence (value) {
  const raw = String(value ?? '')
  const match = raw.match(/^\s*```(?:text|plaintext|markdown|md)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```[ \t]*$/i)
  return match ? match[1] : raw
}

export function validateFormattingResult (value) {
  const text = stripOuterCodeFence(value)
  if (!text.trim()) return null
  if (text.length > MAX_TEXT_LENGTH) return null
  return text
}

export function startFormatting ({ model, systemPrompt, prompt, content, onChunk }) {
  const request = buildFormattingRequest({ model, systemPrompt, prompt, content })
  return runAiRequest({ request, model, onChunk })
}

export function startImageGeneration ({ model, prompt, content, systemPrompt, referenceDataUrl, referenceAnalysis, imageTask, onChunk, direct }) {
  if (direct?.enabled) {
    const directPrompt = buildDirectImageApiPrompt({
      prompt,
      content,
      systemPrompt,
      referenceDataUrl,
      referenceAnalysis,
      imageTask
    })
    const request = createAiRequest({ model, messages: [{ role: 'user', content: directPrompt }] })
    return runAiRequest({
      request,
      model,
      onChunk,
      stream: false,
      expectsImage: true,
      direct: {
        ...direct,
        image: {
          prompt: directPrompt,
          referenceDataUrl: String(referenceDataUrl || ''),
          imageTask: String(imageTask || 'regenerate')
        }
      }
    })
  }
  const visualRequest = referenceDataUrl
    ? buildImageGenerationRequest({ model, prompt, content, systemPrompt, referenceDataUrl, imageTask })
    : null
  const textOnlyRequest = referenceDataUrl
    ? buildImageGenerationRequest({ model, prompt, content, systemPrompt, referenceAnalysis, imageTask })
    : null
  // 按 uTools 文档，Message.content 必须是字符串。图片生成时优先传入编码后的参考图，
  // 避免不透明的自定义模型尝试解析不支持的多模态数组而一直无响应。
  const request = referenceDataUrl
    ? buildImageGenerationRequest({ model, prompt, content, systemPrompt, referenceDataUrl, imageTask, referenceAsText: true })
    : buildImageGenerationRequest({ model, prompt, content, systemPrompt, referenceDataUrl, imageTask })
  const requests = [
    { id: 'base64-reference', request },
    { id: 'multimodal-reference', request: visualRequest },
    { id: 'reference-analysis', request: textOnlyRequest }
  ].filter(item => item.request)
  // 在 uTools 中，流式增量消息会丢弃只有图片的字段，因此生成请求保持非流式，
  // 确保响应规范化器能拿到包含图片的完整 assistant 消息。
  // 如果服务商明确拒绝编码格式，再重试其原生多模态结构；两种图片结构都被拒绝时，
  // 最后改用本地参考图分析结果，让只支持文生图的自定义模型仍能获得可用的参考信息，
  // 同时不必上传二进制图片内容。
  let activeOperation = null
  let requestIndex = 0
  const attempts = []
  const operation = new Promise((resolve, reject) => {
    const run = () => {
      const current = requests[requestIndex]
      activeOperation = runAiRequest({ request: current.request, model, onChunk, stream: false, expectsImage: true, direct })
      activeOperation.then(resolve).catch(error => {
        attempts.push({
          id: current.id,
          message: String(error?.message || '').trim(),
          status: Number.isFinite(Number(error?.status)) ? Number(error.status) : null
        })
        const message = String(error?.message || '')
        const status = Number(error?.status)
        const isRequestShapeError = status === 400 || /\b400\b|bad request|请求无效|invalid json response|invalid response body|unexpected end of json|unexpected token .*json/i.test(message)
        // 一些自定义端点会把“不支持图片内容”错误地返回为 5xx。这里只重试带二进制
        // 参考图的两种请求结构；最后的纯分析请求才是真正用于验证文本兼容性的检查。
        const isReferenceTransportFailure = current.id !== 'reference-analysis' && status >= 500 && status < 600
        if ((isRequestShapeError || isReferenceTransportFailure) && requestIndex < requests.length - 1) {
          requestIndex += 1
          run()
        } else {
          error.imageGenerationDiagnostics = { attempts }
          reject(error)
        }
      })
    }
    run()
  })
  operation.abort = (...args) => activeOperation?.abort?.(...args)
  return operation
}

function toHex (red, green, blue) {
  return `#${[red, green, blue].map(value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`
}

function pixelLuminance (red, green, blue) {
  return red * 0.299 + green * 0.587 + blue * 0.114
}

export function analyzeReferenceImage (dataUrl) {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return Promise.resolve('')
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      try {
        const width = Math.max(1, image.naturalWidth || image.width)
        const height = Math.max(1, image.naturalHeight || image.height)
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 48 / Math.max(width, height))
        const sampleWidth = Math.max(1, Math.round(width * scale))
        const sampleHeight = Math.max(1, Math.round(height * scale))
        canvas.width = sampleWidth
        canvas.height = sampleHeight
        const context = canvas.getContext('2d', { willReadFrequently: true })
        context.drawImage(image, 0, 0, sampleWidth, sampleHeight)
        const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data
        const buckets = new Map()
        let red = 0; let green = 0; let blue = 0; let count = 0; let transparent = 0
        let minimumLuminance = 255; let maximumLuminance = 0; let edgeCount = 0; let edgeComparisons = 0
        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3] / 255
          if (alpha < 0.05) { transparent += 1; continue }
          const r = pixels[index]
          const g = pixels[index + 1]
          const b = pixels[index + 2]
          red += r; green += g; blue += b; count += 1
          const luminance = pixelLuminance(r, g, b)
          minimumLuminance = Math.min(minimumLuminance, luminance)
          maximumLuminance = Math.max(maximumLuminance, luminance)
          const key = [r, g, b].map(value => Math.min(255, Math.round(value / 32) * 32)).join(',')
          buckets.set(key, (buckets.get(key) || 0) + 1)
          const pixelIndex = index / 4
          const x = pixelIndex % sampleWidth
          const y = Math.floor(pixelIndex / sampleWidth)
          if (x > 0) {
            const previous = index - 4
            if (Math.abs(luminance - pixelLuminance(pixels[previous], pixels[previous + 1], pixels[previous + 2])) > 32) edgeCount += 1
            edgeComparisons += 1
          }
          if (y > 0) {
            const previous = index - sampleWidth * 4
            if (Math.abs(luminance - pixelLuminance(pixels[previous], pixels[previous + 1], pixels[previous + 2])) > 32) edgeCount += 1
            edgeComparisons += 1
          }
        }
        const average = count ? [red / count, green / count, blue / count].map(value => Math.round(value)) : [128, 128, 128]
        const palette = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, amount]) => {
          const color = key.split(',').map(Number)
          return `${toHex(...color)} ${Math.round(amount / Math.max(1, count) * 100)}%`
        })
        const luminance = Math.round((average[0] * 0.299 + average[1] * 0.587 + average[2] * 0.114) / 2.55)

        const regionRows = 4
        const regionColumns = 4
        const regions = []
        for (let regionY = 0; regionY < regionRows; regionY += 1) {
          const row = []
          for (let regionX = 0; regionX < regionColumns; regionX += 1) {
            let regionRed = 0; let regionGreen = 0; let regionBlue = 0; let regionCount = 0
            const startX = Math.floor(regionX * sampleWidth / regionColumns)
            const endX = Math.max(startX + 1, Math.floor((regionX + 1) * sampleWidth / regionColumns))
            const startY = Math.floor(regionY * sampleHeight / regionRows)
            const endY = Math.max(startY + 1, Math.floor((regionY + 1) * sampleHeight / regionRows))
            for (let y = startY; y < Math.min(endY, sampleHeight); y += 1) {
              for (let x = startX; x < Math.min(endX, sampleWidth); x += 1) {
                const index = (y * sampleWidth + x) * 4
                if (pixels[index + 3] < 13) continue
                regionRed += pixels[index]
                regionGreen += pixels[index + 1]
                regionBlue += pixels[index + 2]
                regionCount += 1
              }
            }
            row.push(regionCount ? toHex(regionRed / regionCount, regionGreen / regionCount, regionBlue / regionCount) : 'transparent')
          }
          regions.push(row.join(' '))
        }

        const mapColumns = 12
        const mapRows = Math.max(1, Math.min(24, Math.round(mapColumns * sampleHeight / sampleWidth)))
        const colorMap = []
        for (let mapY = 0; mapY < mapRows; mapY += 1) {
          const row = []
          for (let mapX = 0; mapX < mapColumns; mapX += 1) {
            const x = Math.min(sampleWidth - 1, Math.floor((mapX + 0.5) * sampleWidth / mapColumns))
            const y = Math.min(sampleHeight - 1, Math.floor((mapY + 0.5) * sampleHeight / mapRows))
            const index = (y * sampleWidth + x) * 4
            row.push(pixels[index + 3] < 13 ? '--------' : toHex(pixels[index], pixels[index + 1], pixels[index + 2]))
          }
          colorMap.push(row.join(' '))
        }

        resolve([
          `原始画布：${width}×${height}px；宽高比 ${(width / height).toFixed(4)}；${width === height ? '方形' : width > height ? '横向' : '纵向'}。`,
          `全局视觉：平均色 ${toHex(...average)}；平均明度 ${luminance}%；亮度范围 ${Math.round(minimumLuminance / 2.55)}%–${Math.round(maximumLuminance / 2.55)}%；高对比边缘密度 ${Math.round(edgeCount / Math.max(1, edgeComparisons) * 100)}%；透明像素约 ${Math.round(transparent / Math.max(1, pixels.length / 4) * 100)}%。`,
          `量化主色（占采样像素）：${palette.join('、') || '未知'}。`,
          '4×4 分区平均色（从上到下、从左到右，每格对应画布 25%×25%）：',
          ...regions,
          `12 列低分辨率色彩位置图（从上到下；每行覆盖等高区域；-------- 表示透明）：`,
          ...colorMap,
          '能力边界：以上是本地像素统计，并非模型直接看到原图；无法可靠识别具体人物、物体、字体名称或逐字文字，需结合用户补充要求，禁止凭空杜撰。'
        ].join('\n'))
      } catch { resolve('参考图已提供，但本地无法读取像素摘要。') }
    }
    image.onerror = () => resolve('参考图已提供，但本地无法读取像素摘要。')
    image.src = String(dataUrl || '')
  })
}
