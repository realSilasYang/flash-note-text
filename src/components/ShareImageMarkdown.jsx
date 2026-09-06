import { isValidElement } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { highlightMarkdownCode } from '../markdownCodeHighlighting'
import {
  detachUnindentedImagesFromLists,
  MARKDOWN_BLANK_LINE,
  preserveMarkdownBlankLines
} from '../shareImageMarkdown'

const markdownComponents = {
  p: ({ children, className }) => {
    const isBlankLine = Array.isArray(children)
      ? children.length === 1 && children[0] === MARKDOWN_BLANK_LINE
      : children === MARKDOWN_BLANK_LINE
    const classes = [className, isBlankLine ? 'markdown-blank-line' : ''].filter(Boolean).join(' ')
    return <p className={classes || undefined}>{children}</p>
  },
  strong: ({ children }) => <strong>{children}</strong>,
  em: ({ children }) => <em>{children}</em>,
  a: ({ children, href }) => <a href={href}>{children}</a>,
  img: ({ src, alt }) => (
    <img
      className="note-image-frame"
      data-smartisan-image-frame="android"
      src={src}
      alt={alt || ''}
      loading="eager"
      decoding="sync"
    />
  ),
  code: ({ children, className }) => <code className={className}>{children}</code>,
  pre: ({ children }) => {
    const codeElement = isValidElement(children) ? children : null
    const className = codeElement?.props?.className || ''
    const source = String(codeElement?.props?.children ?? '').replace(/\n$/, '')
    const highlighted = highlightMarkdownCode(source, className)
    const codeClasses = ['hljs', className].filter(Boolean).join(' ')
    return (
      <div
        className={`markdown-code-block${highlighted.highlighted ? ' is-highlighted' : ' is-plain'}`}
        data-language={highlighted.language || 'text'}
      >
        <div className="markdown-code-toolbar" aria-hidden="true">
          <span className="markdown-code-language">{highlighted.label}</span>
        </div>
        <pre>
          <code className={codeClasses} dangerouslySetInnerHTML={{ __html: highlighted.html }} />
        </pre>
      </div>
    )
  },
  blockquote: ({ children }) => <blockquote>{children}</blockquote>
}

const inlineMarkdownComponents = {
  ...markdownComponents,
  p: ({ children }) => <>{children}</>
}

function escapeLeadingBlockMarkdown (markdown) {
  return String(markdown || '')
    .replace(/^(\s*)(\d+)([.)])(?=\s)/, '$1$2\\$3')
    .replace(/^(\s*)([-+*>])(?=\s)/, '$1\\$2')
    .replace(/^(\s*)(#{1,6})(?=\s)/, '$1\\$2')
}

function toClassList (value) {
  if (!value) return []
  return Array.isArray(value) ? value : value.split(/\s+/).filter(Boolean)
}

function withClassName (node, className) {
  const classNames = toClassList(node.data?.hProperties?.className)
  return {
    ...node,
    data: {
      ...node.data,
      hProperties: {
        ...node.data?.hProperties,
        className: Array.from(new Set([...classNames, className]))
      }
    }
  }
}

function splitParagraphByManualLines (node) {
  if (node.type !== 'paragraph' || !Array.isArray(node.children)) return [node]
  const lines = [[]]
  let hasManualLine = false

  node.children.forEach(child => {
    if (child.type !== 'text' || typeof child.value !== 'string' || !child.value.includes('\n')) {
      lines[lines.length - 1].push(child)
      return
    }

    hasManualLine = true
    child.value.split('\n').forEach((part, index) => {
      if (index > 0) lines.push([])
      if (part) lines[lines.length - 1].push({ ...child, value: part })
    })
  })

  if (!hasManualLine) return [node]
  return lines.map((children, index) => {
    const paragraph = {
      ...node,
      children: children.length ? children : [{ type: 'text', value: '' }]
    }
    return index === 0 ? paragraph : withClassName(paragraph, 'markdown-manual-line')
  })
}

export function remarkManualLineParagraphs () {
  return tree => {
    const visit = node => {
      if (!node || typeof node !== 'object' || !Array.isArray(node.children)) return
      node.children = node.children.flatMap(child => splitParagraphByManualLines(child))
      node.children.forEach(visit)
    }
    visit(tree)
  }
}

export function ShareImageMarkdownText ({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkManualLineParagraphs]}
      components={markdownComponents}
    >
      {detachUnindentedImagesFromLists(preserveMarkdownBlankLines(children))}
    </ReactMarkdown>
  )
}

export function ShareImageMarkdownInlineText ({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineMarkdownComponents}>
      {escapeLeadingBlockMarkdown(children)}
    </ReactMarkdown>
  )
}
