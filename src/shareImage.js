import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { toBlob } from 'html-to-image'
import ShareImageSheet from './components/ShareImageSheet.jsx'
import './components/shareImageSheet.less'
import { markdownToPlainText } from './historySearch'
import { splitShareImageSections } from './shareImageMarkdown'
import { getShareImageSheetHeight, resolveShareImageAspectRatio, SHARE_IMAGE_SHEET_WIDTH } from './shareImageAspectRatios'

export const SHARE_IMAGE_TEMPLATES = Object.freeze([
  { id: 'default', layout: 'smartisan', paper: '#fffcf7', accent: '#ac9070', preview: './share/smartisan-theme-icon.png' },
  { id: 'smartisan-dark', layout: 'smartisan', paper: '#1c1a1c', accent: '#d5ab36', preview: './share/smartisan-theme-icon.png' },
  { id: 'apple-notes-light', layout: 'apple', paper: '#ffffff', accent: '#ebb800', preview: './share/apple-notes-theme-icon.png' },
  { id: 'apple-notes', layout: 'apple', paper: '#181818', accent: '#ebb800', preview: './share/apple-notes-theme-icon.png' },
  { id: 'bear', layout: 'bear', paper: '#ffffff', accent: '#dd4c4f', preview: './share/bear-theme-icon.png' },
  { id: 'telegraph', layout: 'telegraph', paper: '#ffffff', accent: '#202020', preview: './share/telegraph-theme-icon.png' }
])

export { getShareImageSheetHeight, resolveShareImageAspectRatio, SHARE_IMAGE_ASPECT_RATIOS } from './shareImageAspectRatios'

const TEMPLATE_IDS = new Set(SHARE_IMAGE_TEMPLATES.map(template => template.id))
const TEMPLATE_LAYOUTS = Object.freeze(Object.fromEntries(SHARE_IMAGE_TEMPLATES.map(template => [template.id, template.layout])))
const TEMPLATE_PAPERS = Object.freeze(Object.fromEntries(SHARE_IMAGE_TEMPLATES.map(template => [template.id, template.paper])))
const DEFAULT_IMAGE_COPY = Object.freeze({
  appleNotes: '备忘录',
  footerBrand: '由闪念文本生成',
  footerVia: 'Powered by realSilasYang'
})
const EXPORT_WIDTH = 1080
const SHEET_WIDTH = SHARE_IMAGE_SHEET_WIDTH
const MAX_PAGE_VISUAL_LINES = 120

export function getShareImageTemplateLayout (templateId) {
  return TEMPLATE_LAYOUTS[templateId] || 'smartisan'
}

function stripMarkdownInline (value) {
  return String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, match => match.slice(1, -1))
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\\([\\`*{}[\]()#+\-.!_>])/g, '$1')
    .trimEnd()
}

export function parseShareImageBlocks (text, editorMode = 'text') {
  const lines = String(text || '').replace(/\r\n|\r/g, '\n').split('\n')
  if (editorMode !== 'markdown') {
    return lines.map(line => line ? { type: 'body', text: line } : { type: 'blank', text: '' })
  }

  const blocks = []
  let inFence = false
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      blocks.push(line ? { type: 'code', text: line } : { type: 'code', text: ' ' })
      continue
    }
    if (!line.trim()) {
      blocks.push({ type: 'blank', text: '' })
      continue
    }
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: stripMarkdownInline(heading[2]) })
      continue
    }
    if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      blocks.push({ type: 'rule', text: '' })
      continue
    }
    const quote = line.match(/^\s{0,3}>\s?(.*)$/)
    if (quote) {
      blocks.push({ type: 'quote', text: stripMarkdownInline(quote[1]) || ' ' })
      continue
    }
    const list = line.match(/^\s*(?:([-+*])|(\d+)[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/)
    if (list) {
      const marker = list[3] ? `[${list[3].toLowerCase() === 'x' ? 'x' : ' '}]` : (list[2] ? `${list[2]}.` : '•')
      blocks.push({ type: 'list', text: `${marker} ${stripMarkdownInline(list[4])}` })
      continue
    }
    blocks.push({ type: 'body', text: stripMarkdownInline(line) })
  }
  return blocks
}

function estimateVisualLines (line, editorMode) {
  const plain = editorMode === 'markdown' ? stripMarkdownInline(line.replace(/^\s{0,3}(?:#{1,6}|>|[-+*]|\d+[.)])\s*/, '')) : line
  const units = Array.from(plain).reduce((total, character) => total + (character.codePointAt(0) <= 0xff ? 0.55 : 1), 0)
  const wrappedLines = Math.max(1, Math.ceil(units / 24))
  return editorMode === 'markdown' && /^\s{0,3}#{1,3}\s+/.test(line) ? wrappedLines + 1 : wrappedLines
}

function getPageVisualLineLimit (aspectRatio) {
  const sheetHeight = getShareImageSheetHeight(aspectRatio)
  if (!sheetHeight) return MAX_PAGE_VISUAL_LINES
  // 为模板内边距、标题和页脚预留空间。Markdown 块级元素可能额外产生纵向间距，
  // 因此这里采用偏保守的上限，避免导出时内容贴近底部或被截断。
  return Math.max(1, Math.floor((sheetHeight - 300) / 52))
}

function paginateText (text, editorMode, aspectRatio = 'auto') {
  const normalized = String(text || '').replace(/\r\n|\r/g, '\n')
  const lines = normalized.split('\n')
  const pages = []
  let current = []
  let visualLines = 0
  let activeFence = ''
  const pageVisualLineLimit = getPageVisualLineLimit(aspectRatio)

  const commit = () => {
    if (!current.length) return
    const pageLines = activeFence ? [...current, '```'] : current
    pages.push(pageLines.join('\n'))
    current = activeFence ? [activeFence] : []
    visualLines = activeFence ? 1 : 0
  }

  for (const line of lines) {
    const nextLines = estimateVisualLines(line, editorMode)
    if (current.length && visualLines + nextLines > pageVisualLineLimit) commit()
    current.push(line)
    visualLines += nextLines
    if (editorMode === 'markdown') {
      const fence = line.match(/^\s*(```|~~~)(.*)$/)
      if (fence) activeFence = activeFence ? '' : `${fence[1]}${fence[2]}`
    }
  }
  if (current.length || pages.length === 0) pages.push(current.join('\n'))
  return pages
}

function buildPageNotes (text, title, editorMode) {
  if (editorMode === 'markdown') {
    const sections = splitShareImageSections(text)
    return title
      ? [{ heading: title, content: '', titleOnly: true }, ...sections]
      : sections
  }

  return [{ heading: title, content: text }]
}

export function prepareShareImage ({ text, title = '', editorMode = 'text', templateId = 'default', appearance = {}, copy = {} }) {
  if (typeof document === 'undefined') throw new Error('当前环境无法使用页面文档')
  const resolvedTemplateId = TEMPLATE_IDS.has(templateId) ? templateId : 'default'
  const resolvedAspectRatio = resolveShareImageAspectRatio(appearance.aspectRatio).id
  const pageTexts = paginateText(text, editorMode, resolvedAspectRatio)
  const resolvedEditorMode = editorMode === 'markdown' ? 'markdown' : 'text'
  return {
    pages: pageTexts.map((pageText, index) => {
      const pageTitle = index === 0 && appearance.showTitle !== false ? String(title || '').trim() : ''
      return {
        hasDocumentTitle: Boolean(pageTitle),
        notes: buildPageNotes(pageText, pageTitle, resolvedEditorMode)
      }
    }),
    templateId: resolvedTemplateId,
    editorMode: resolvedEditorMode,
    appearance: { ...appearance, aspectRatio: resolvedAspectRatio },
    paper: TEMPLATE_PAPERS[resolvedTemplateId],
    copy: { ...DEFAULT_IMAGE_COPY, ...copy }
  }
}

function waitForImages (node) {
  return Promise.all(Array.from(node.querySelectorAll('img')).map(image => {
    if (image.complete && image.naturalWidth > 0) return image.decode?.().catch(() => {})
    return new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true })
      image.addEventListener('error', resolve, { once: true })
    })
  }))
}

export async function renderShareImagePage (prepared, pageIndex) {
  const page = prepared.pages[pageIndex]
  if (!page) throw new Error('分享图片页面不存在')

  const host = document.createElement('div')
  host.className = 'share-image-export-host'
  document.body.appendChild(host)
  const root = createRoot(host)
  const footerLogoUrl = new URL('./logo.png', window.location.href).href
  const pageLabel = prepared.appearance?.showPageNumber !== false && prepared.pages.length > 1 ? `${pageIndex + 1} / ${prepared.pages.length}` : ''

  try {
    flushSync(() => {
      root.render(createElement(ShareImageSheet, {
        copy: prepared.copy,
        appearance: prepared.appearance,
        editorMode: prepared.editorMode,
        footerLogoUrl,
        hasDocumentTitle: page.hasDocumentTitle,
        notes: page.notes,
        pageLabel,
        templateId: prepared.templateId,
      }))
    })
    const sheet = host.querySelector('.note-sheet')
    if (!sheet) throw new Error('分享图片画布不可用')
    await document.fonts?.ready
    await waitForImages(sheet)
    const blob = await toBlob(sheet, {
      backgroundColor: prepared.paper,
      cacheBust: false,
      pixelRatio: EXPORT_WIDTH / SHEET_WIDTH,
      skipAutoScale: true
    })
    if (!blob) throw new Error('PNG 图片生成失败')
    return blob
  } finally {
    root.unmount()
    host.remove()
  }
}

function sanitizeFilenamePart (value) {
  const forbidden = new Set(Array.from('<>:"/\\|?*'))
  return Array.from(String(value || ''))
    .filter(character => character.codePointAt(0) >= 32 && !forbidden.has(character))
    .join('')
    .trim()
    .slice(0, 36)
}

export function buildShareImageFilename (title, text, editorMode = 'text', templateName = '', defaultName = 'Flash Note Text') {
  const plainText = editorMode === 'markdown' ? markdownToPlainText(text) : String(text || '')
  const firstLine = plainText.split(/\r?\n/).map(line => line.trim()).find(Boolean) || ''
  const name = sanitizeFilenamePart(title) || sanitizeFilenamePart(firstLine) || sanitizeFilenamePart(defaultName) || 'Flash Note Text'
  const templateSuffix = sanitizeFilenamePart(templateName)
  return `${name}${templateSuffix ? ` - ${templateSuffix}` : ''}.png`
}

export function getShareImagePagePath (filePath, pageIndex, pageCount) {
  if (pageCount <= 1) return filePath
  const suffix = String(pageIndex + 1).padStart(Math.max(2, String(pageCount).length), '0')
  const base = String(filePath).toLowerCase().endsWith('.png') ? String(filePath).slice(0, -4) : String(filePath)
  return `${base}-${suffix}.png`
}
