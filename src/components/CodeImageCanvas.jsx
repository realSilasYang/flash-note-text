import { forwardRef, memo, useEffect, useMemo, useRef, useState } from 'react'
import { getCodeImageThemeStyle, highlightCodeForImage, updateCodeIndentation } from '../codeImage'
import { getCodeImageTheme } from '../codeImageThemes'
import { t } from '../locales'
import './codeImageStudio.less'

function tokenStyle (token) {
  const fontStyle = Number(token.fontStyle) || 0
  return {
    color: token.color || undefined,
    fontStyle: fontStyle & 1 ? 'italic' : undefined,
    fontWeight: fontStyle & 2 ? 700 : undefined,
    textDecoration: fontStyle & 4 ? 'underline' : undefined
  }
}

function CodeEditorSurface ({ code, darkMode, editable, fontFamily, highlightedLines, interfaceLanguage, language, onChange, onHighlightedLinesChange, showLineNumbers, themeId }) {
  const textareaRef = useRef(null)
  const [tokens, setTokens] = useState([])
  const lines = String(code || '').split('\n')
  const longestLine = Math.max(1, ...lines.map(line => line.length))

  useEffect(() => {
    const input = textareaRef.current
    if (!input) return
    input.style.height = '0px'
    input.style.height = `${Math.max(input.scrollHeight, 86)}px`
  }, [code, fontFamily, showLineNumbers])

  useEffect(() => {
    let active = true
    highlightCodeForImage(code, language, themeId, darkMode).then(nextTokens => {
      if (active) setTokens(nextTokens)
    }).catch(() => {
      if (active) setTokens(String(code || '').split('\n').map(line => [{ content: line || ' ' }]))
    })
    return () => { active = false }
  }, [code, darkMode, language, themeId])

  const toggleCurrentLine = event => {
    if (!event.altKey) return
    event.preventDefault()
    const index = String(code || '').slice(0, textareaRef.current?.selectionStart || 0).split('\n').length - 1
    const next = new Set(highlightedLines)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    onHighlightedLinesChange?.(next)
  }

  return (
    <div
      className={`ci-editor${showLineNumbers ? ' ci-show-line-numbers' : ''}${longestLine >= 1000 ? ' ci-wide-line-numbers' : ''}`}
      style={{ '--ci-font-family': fontFamily }}
    >
      <div className="ci-highlighted-code" aria-hidden="true">
        {lines.map((line, lineIndex) => (
          <div
            className={`ci-code-line${highlightedLines.has(lineIndex) ? ' is-highlighted' : ''}`}
            data-line={lineIndex + 1}
            key={lineIndex}
          >
            {(tokens[lineIndex] || [{ content: line || ' ' }]).map((token, tokenIndex) => (
              <span key={tokenIndex} style={tokenStyle(token)}>{token.content || ' '}</span>
            ))}
          </div>
        ))}
      </div>
      {editable ? (
        <textarea
          ref={textareaRef}
          className="ci-code-input"
          data-ignore-in-export="true"
          value={code}
          spellCheck={false}
          aria-label={t(interfaceLanguage, 'editor.codeImageAria')}
          onChange={event => onChange?.(event.target.value)}
          onClick={toggleCurrentLine}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault()
              event.currentTarget.blur()
              return
            }
            updateCodeIndentation(event.currentTarget, code, onChange, event)
          }}
        />
      ) : null}
    </div>
  )
}

function EditableFileName ({ className, fileName, interfaceLanguage, onFileNameChange }) {
  return (
    <input
      className={className}
      value={fileName}
      placeholder={t(interfaceLanguage, 'editor.untitledFile')}
      spellCheck={false}
      onChange={event => onFileNameChange?.(event.target.value)}
      onKeyDown={event => { if (event.key === 'Escape') event.currentTarget.blur() }}
    />
  )
}

function FrameBody ({ code, darkMode, editable, fileName, fontFamily, highlightedLines, interfaceLanguage, language, onChange, onFileNameChange, onHighlightedLinesChange, showLineNumbers, theme }) {
  const editor = (
    <CodeEditorSurface
      code={code}
      darkMode={darkMode}
      editable={editable}
      fontFamily={fontFamily}
      highlightedLines={highlightedLines}
      interfaceLanguage={interfaceLanguage}
      language={language}
      onChange={onChange}
      onHighlightedLinesChange={onHighlightedLinesChange}
      showLineNumbers={showLineNumbers}
      themeId={theme.id}
    />
  )

  if (theme.id === 'vercel' || theme.id === 'rabbit') {
    return (
      <div className="ci-vercel-window">
        <span className="ci-vercel-grid-horizontal" />
        <span className="ci-vercel-grid-vertical" />
        <span className="ci-vercel-bracket ci-vercel-bracket-left" />
        <span className="ci-vercel-bracket ci-vercel-bracket-right" />
        {editor}
      </div>
    )
  }
  if (theme.id === 'supabase') {
    return (
      <div className="ci-supabase-window">
        <div className="ci-supabase-header">
          <EditableFileName className="ci-supabase-file-name" fileName={fileName} interfaceLanguage={interfaceLanguage} onFileNameChange={onFileNameChange} />
          <span className="ci-supabase-language">{language || t(interfaceLanguage, 'share.code.plainText')}</span>
        </div>
        {editor}
      </div>
    )
  }
  if (theme.id === 'tailwind') {
    return (
      <div className="ci-tailwind-window">
        <span className="ci-tailwind-grid-horizontal" />
        <span className="ci-tailwind-grid-vertical" />
        <div className="ci-tailwind-gradient"><span /><span /></div>
        <div className="ci-tailwind-header"><span /><span /><span /></div>
        {editor}
      </div>
    )
  }
  if (theme.id === 'clerk') {
    return <div className="ci-clerk-window"><div className="ci-clerk-code">{editor}</div></div>
  }
  if (theme.id === 'mintlify') {
    return (
      <div className="ci-mintlify-window">
        <div className="ci-mintlify-header"><EditableFileName fileName={fileName} interfaceLanguage={interfaceLanguage} onFileNameChange={onFileNameChange} /></div>
        {editor}
      </div>
    )
  }
  if (theme.id === 'prisma') {
    return (
      <div className="ci-prisma-window">
        <span data-frame-border /><span data-frame-border /><span data-frame-border /><span data-frame-border />
        {editor}
      </div>
    )
  }
  if (theme.id === 'openai') return <div className="ci-openai-window">{editor}</div>

  return (
    <div className="ci-default-window">
      <div className="ci-default-header">
        <div className="ci-window-controls"><span /><span /><span /></div>
        <EditableFileName className="ci-default-file-name" fileName={fileName} interfaceLanguage={interfaceLanguage} onFileNameChange={onFileNameChange} />
      </div>
      {editor}
    </div>
  )
}

const CodeImageCanvas = forwardRef(function CodeImageCanvas ({
  code,
  darkMode,
  editable = true,
  fileName,
  font,
  highlightedLines,
  interfaceLanguage,
  language,
  onChange,
  onFileNameChange,
  onHighlightedLinesChange,
  padding,
  showBackground,
  showLineNumbers,
  themeId,
  width
}, ref) {
  const theme = getCodeImageTheme(themeId)
  const themeStyle = useMemo(() => getCodeImageThemeStyle(themeId, darkMode), [darkMode, themeId])
  const selectedFont = font === 'theme' ? theme.font || 'jetbrains-mono' : font
  const fontFamily = font === 'theme'
    ? themeStyle['--code-image-font']
    : ({
        'jetbrains-mono': '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
        'geist-mono': 'Geist Mono, "Cascadia Mono", Consolas, monospace',
        'ibm-plex-mono': '"IBM Plex Mono", Consolas, monospace',
        'fira-code': '"Fira Code", "Cascadia Code", Consolas, monospace',
        'soehne-mono': '"Söhne Mono", "SFMono-Regular", Consolas, monospace'
      })[font] || themeStyle['--code-image-font']
  const fontWeight = selectedFont === 'jetbrains-mono' || selectedFont === 'ibm-plex-mono' ? 500 : 400
  const transparentBackground = !showBackground
  const frameStyle = transparentBackground
    ? { padding, background: 'transparent', backgroundColor: 'transparent', backgroundImage: 'none' }
    : { padding }

  return (
    <div
      ref={ref}
      className={`ci-export-frame ci-theme-${theme.id}${darkMode ? ' is-dark' : ' is-light'}${showBackground ? ' has-background' : ' has-no-background'}`}
      data-transparent-background={transparentBackground ? 'true' : undefined}
      style={{ ...themeStyle, '--ci-font-weight': fontWeight, width, ...(transparentBackground ? { background: 'transparent', backgroundColor: 'transparent' } : {}) }}
    >
      <div className="ci-frame" style={frameStyle}>
        {!showBackground ? <div className="ci-transparent-pattern" data-ignore-in-export="true" /> : null}
        {theme.id === 'tailwind' && showBackground ? <img className="ci-tailwind-beams" src="./code-image/tailwind-beams.png" alt="" /> : null}
        {theme.id === 'clerk' && showBackground ? <img className="ci-clerk-pattern" src="./code-image/clerk-pattern.svg" alt="" /> : null}
        {theme.id === 'mintlify' && showBackground ? (
          <img className="ci-mintlify-pattern" src={darkMode ? './code-image/mintlify-pattern-dark.svg' : './code-image/mintlify-pattern-light.svg'} alt="" />
        ) : null}
        <FrameBody
          code={code}
          darkMode={darkMode}
          editable={editable}
          fileName={fileName}
          fontFamily={fontFamily}
          highlightedLines={highlightedLines}
          interfaceLanguage={interfaceLanguage}
          language={language}
          onChange={onChange}
          onFileNameChange={onFileNameChange}
          onHighlightedLinesChange={onHighlightedLinesChange}
          showLineNumbers={showLineNumbers}
          theme={theme}
        />
      </div>
    </div>
  )
})

export default memo(CodeImageCanvas)
