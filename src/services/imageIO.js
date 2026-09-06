function imageFormat (image) {
  const mimeType = String(image?.mimeType || '').toLowerCase()
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/svg' || mimeType === 'image/svg+xml') return 'svg'
  if (mimeType === 'image/gif') return 'gif'
  if (mimeType === 'image/avif') return 'avif'
  if (mimeType === 'image/tiff') return 'tiff'
  return 'png'
}

function imageMimeType (format) {
  if (format === 'jpg') return 'image/jpeg'
  if (format === 'svg') return 'image/svg+xml'
  if (format === 'tif' || format === 'tiff') return 'image/tiff'
  return `image/${format}`
}

export function detectImageFormat (bytes, fallback = 'png') {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (view.length >= 8 && view.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])) return 'png'
  if (view.length >= 3 && view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) return 'jpg'
  if (view.length >= 12 && String.fromCharCode(...view.slice(0, 4)) === 'RIFF' && String.fromCharCode(...view.slice(8, 12)) === 'WEBP') return 'webp'
  if (view.length >= 6 && (String.fromCharCode(...view.slice(0, 6)) === 'GIF87a' || String.fromCharCode(...view.slice(0, 6)) === 'GIF89a')) return 'gif'
  try {
    if (/<svg(?:\s|>)/i.test(new TextDecoder().decode(view.slice(0, 4096)))) return 'svg'
  } catch {}
  return fallback
}

function decodeImageDataUrl (value) {
  const match = String(value || '').match(/^data:([^;,]+)(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i)
  if (!match) return null
  const mimeType = String(match[1] || '').toLowerCase()
  if (match[2]) {
    const binary = atob(match[3].replace(/\s+/g, ''))
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
    return { bytes: bytes.buffer, mimeType }
  }
  const text = decodeURIComponent(match[3])
  const bytes = new TextEncoder().encode(text)
  return { bytes: bytes.buffer, mimeType }
}

function encodeImageDataUrl (bytes, mimeType) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < view.length; offset += chunkSize) {
    binary += String.fromCharCode(...view.subarray(offset, Math.min(view.length, offset + chunkSize)))
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

async function decodedImage (bytes, fallbackFormat) {
  const inspectImage = globalThis.window?.imageServices?.inspectImage
  if (typeof inspectImage === 'function') {
    const metadata = await inspectImage(bytes, { animated: true })
    return { bytes, format: metadata.format, metadata }
  }
  return { bytes, format: detectImageFormat(new Uint8Array(bytes), fallbackFormat) }
}

export async function readGeneratedImage (image) {
  const embeddedDataUrl = image?.dataUrl || (typeof image?.src === 'string' && /^data:image\//i.test(image.src) ? image.src : '')
  if (embeddedDataUrl && /^data:image\//i.test(embeddedDataUrl)) {
    const decoded = decodeImageDataUrl(embeddedDataUrl)
    if (!decoded) throw new Error('生成的图片数据不可用')
    return decodedImage(decoded.bytes, imageFormat({ ...image, mimeType: decoded.mimeType }))
  }
  if (image?.url) {
    const response = await fetch(image.url)
    if (!response.ok) throw new Error(`图片下载失败（${response.status}）`)
    const bytes = await response.arrayBuffer()
    return decodedImage(bytes, imageFormat(image))
  }
  throw new Error('生成的图片数据不可用')
}

export async function readGeneratedImageDataUrl (image) {
  const source = await readGeneratedImage(image)
  const prepareReferenceImage = globalThis.window?.imageServices?.prepareReferenceImage
  if (typeof prepareReferenceImage === 'function') {
    try {
      const prepared = await prepareReferenceImage(source.bytes)
      if (prepared?.dataUrl) return prepared.dataUrl
      if (prepared?.bytes && prepared?.mimeType) return encodeImageDataUrl(prepared.bytes, prepared.mimeType)
    } catch (error) {
      if (source.format !== 'svg') throw error
      console.warn('Sharp 参考图片预处理失败，改用 SVG 备用路径', error)
    }
  }
  if (source.format === 'svg') {
    try {
      return encodeImageDataUrl(await rasterizeSvg(source.bytes), 'image/png')
    } catch (error) {
      console.warn('SVG 转 PNG 失败，改用编码后的 SVG 作为参考图片', error)
      return encodeImageDataUrl(source.bytes, 'image/svg+xml')
    }
  }
  return encodeImageDataUrl(source.bytes, imageMimeType(source.format))
}

export async function rasterizeSvg (bytes) {
  const sharpRasterize = globalThis.window?.imageServices?.rasterizeImage
  if (typeof sharpRasterize === 'function') return sharpRasterize(bytes, 'svg')
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof Image === 'undefined' || typeof document === 'undefined') throw new Error('当前环境无法转换 SVG 图片')
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/svg+xml' }))
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('SVG 图片无法渲染'))
      element.src = objectUrl
    })
    const width = Math.max(1, image.naturalWidth || image.width || 1024)
    const height = Math.max(1, image.naturalHeight || image.height || 1024)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width))
    canvas.height = Math.max(1, Math.round(height))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('SVG 图片画布不可用')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const png = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('SVG 转 PNG 失败')), 'image/png'))
    return png.arrayBuffer()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
