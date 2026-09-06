const HTML_LINE_BREAK = /^<\s*br\s*\/?\s*>$/i

function createEmptyMarkdownParagraph () {
  return { type: 'paragraph', children: [] }
}

function getNodeStartLine (node) {
  const line = Number(node?.position?.start?.line)
  return Number.isInteger(line) && line > 0 ? line : null
}

function getNodeEndLine (node) {
  const line = Number(node?.position?.end?.line)
  return Number.isInteger(line) && line > 0 ? line : null
}

export function preserveMarkdownSourceBlankLines (tree, source) {
  if (tree?.type !== 'root' || !Array.isArray(tree.children)) return tree

  const sourceText = String(source ?? '').replace(/\r\n?/g, '\n')
  const positionedChildren = tree.children.filter(child => (
    getNodeStartLine(child) !== null && getNodeEndLine(child) !== null
  ))

  if (positionedChildren.length === 0) {
    const blankLineCount = sourceText.match(/\n/g)?.length || 0
    if (blankLineCount > 0) {
      tree.children = Array.from({ length: blankLineCount }, createEmptyMarkdownParagraph)
    }
    return tree
  }

  const firstChild = positionedChildren[0]
  const lastChild = positionedChildren[positionedChildren.length - 1]
  const leadingBlankLines = Math.max(0, getNodeStartLine(firstChild) - 1)
  const trailingBlankLines = sourceText.match(/\n+$/)?.[0].length || 0
  const children = []

  for (let index = 0; index < tree.children.length; index += 1) {
    const child = tree.children[index]
    if (child === firstChild) {
      for (let count = 0; count < leadingBlankLines; count += 1) {
        children.push(createEmptyMarkdownParagraph())
      }
    }

    children.push(child)

    const nextChild = tree.children[index + 1]
    const endLine = getNodeEndLine(child)
    const nextStartLine = getNodeStartLine(nextChild)
    if (endLine !== null && nextStartLine !== null) {
      // 将源码中的每一行空行保留为编辑器段落。Markdown 用两个 LF 分隔块级内容，
      // 但第一个 LF 仍对应纯文本模式中用户能看到的那一行空白。
      const extraBlankLines = Math.max(0, nextStartLine - endLine - 1)
      for (let count = 0; count < extraBlankLines; count += 1) {
        children.push(createEmptyMarkdownParagraph())
      }
    }

    if (child === lastChild) {
      for (let count = 0; count < trailingBlankLines; count += 1) {
        children.push(createEmptyMarkdownParagraph())
      }
    }
  }

  tree.children = children
  return tree
}

export function normalizeMarkdownLineBreakAst (tree) {
  if (!tree || typeof tree !== 'object') return tree

  const visit = (node, insideParagraph = false) => {
    if (!Array.isArray(node?.children)) return
    const canUseMarkdownBreak = insideParagraph || node.type === 'paragraph'
    node.children = node.children.map(child => {
      if (canUseMarkdownBreak && child?.type === 'html' && HTML_LINE_BREAK.test(String(child.value || '').trim())) {
        return { type: 'break' }
      }
      visit(child, canUseMarkdownBreak)
      return child
    })
  }

  visit(tree)
  return tree
}

export function stripMarkdownSerializerTerminator (markdown) {
  const value = String(markdown ?? '')
  return value.endsWith('\n') ? value.slice(0, -1) : value
}

export function preserveMarkdownTerminalNewlines (markdown, source) {
  const body = stripMarkdownSerializerTerminator(markdown).replace(/\n+$/, '')
  const terminalNewlines = String(source ?? '').match(/\n+$/)?.[0] || ''
  return body + terminalNewlines
}

export function normalizeMarkdownEditorChange (markdown, externalSource = null) {
  return externalSource === null
    ? stripMarkdownSerializerTerminator(markdown)
    : preserveMarkdownTerminalNewlines(markdown, externalSource)
}
