import { ShareImageMarkdownInlineText, ShareImageMarkdownText } from './ShareImageMarkdown.jsx'
import { getShareImageSheetHeight, resolveShareImageAspectRatio } from '../shareImageAspectRatios'

export const APPLE_SHARE_PATH = 'M55.7617-21.9727C57.8613-21.9727 59.668-23.7305 59.668-25.7812L59.668-75.9277L59.375-83.252L62.6465-79.7852L70.0684-71.875C70.752-71.0938 71.7285-70.7031 72.7051-70.7031C74.707-70.7031 76.2695-72.168 76.2695-74.1699C76.2695-75.1953 75.8301-75.9766 75.0977-76.709L58.5938-92.627C57.6172-93.6035 56.7871-93.9453 55.7617-93.9453C54.7852-93.9453 53.9551-93.6035 52.9297-92.627L36.4258-76.709C35.6934-75.9766 35.3027-75.1953 35.3027-74.1699C35.3027-72.168 36.7676-70.7031 38.8184-70.7031C39.7461-70.7031 40.8203-71.0938 41.5039-71.875L48.877-79.7852L52.1973-83.252L51.9043-75.9277L51.9043-25.7812C51.9043-23.7305 53.6621-21.9727 55.7617-21.9727ZM27.7832 16.2598L83.7891 16.2598C93.9941 16.2598 99.1211 11.1816 99.1211 1.12305L99.1211-47.6074C99.1211-57.666 93.9941-62.7441 83.7891-62.7441L70.166-62.7441L70.166-54.8828L83.6426-54.8828C88.4766-54.8828 91.2598-52.2461 91.2598-47.168L91.2598 0.683594C91.2598 5.76172 88.4766 8.39844 83.6426 8.39844L27.8809 8.39844C22.998 8.39844 20.3125 5.76172 20.3125 0.683594L20.3125-47.168C20.3125-52.2461 22.998-54.8828 27.8809-54.8828L41.4062-54.8828L41.4062-62.7441L27.7832-62.7441C17.5781-62.7441 12.4512-57.666 12.4512-47.6074L12.4512 1.12305C12.4512 11.1816 17.5781 16.2598 27.7832 16.2598Z'
export const APPLE_MORE_PATH = 'M50 13.5A36.5 36.5 0 1 0 50 86.5A36.5 36.5 0 1 0 50 13.5Z'

function isDocumentTitle (note, index) {
  return index === 0 && note.headingAlignment === 'center' && /^#(?!#)\s+/.test(note.heading.trim())
}

function PlainText ({ children }) {
  return <p>{children || ' '}</p>
}

export default function ShareImageSheet ({ appearance, copy, editorMode, footerLogoUrl, hasDocumentTitle = false, notes, pageLabel, templateId }) {
  const renderMarkdown = editorMode === 'markdown'
  const fontScale = Math.min(1.3, Math.max(0.75, Number(appearance?.fontScale) || 1))
  const lineSpacing = Math.min(1.5, Math.max(0.5, Number(appearance?.lineSpacing) || 1))
  const contentPadding = Math.min(1.4, Math.max(0.6, Number(appearance?.contentPadding) || 1))
  const fontFamily = ['sans', 'serif', 'mono'].includes(appearance?.fontFamily) ? appearance.fontFamily : 'theme'
  const textAlign = ['left', 'center', 'right'].includes(appearance?.textAlign) ? appearance.textAlign : 'left'
  const titleAlign = ['left', 'center', 'right'].includes(appearance?.titleAlign) ? appearance.titleAlign : 'left'
  const showFooter = appearance?.showFooter !== false
  const aspectRatio = resolveShareImageAspectRatio(appearance?.aspectRatio)
  const sheetHeight = getShareImageSheetHeight(aspectRatio)
  const fixedAspectRatio = Boolean(sheetHeight)
  const deviceType = fixedAspectRatio
    ? (aspectRatio.id.startsWith('phone-') ? 'phone' : 'tablet')
    : 'auto'
  const baseLineHeight = templateId === 'apple-notes' || templateId === 'apple-notes-light'
    ? 1.65
    : templateId === 'bear'
      ? 1.755
      : templateId === 'telegraph'
        ? 1.58
        : 1.8
  const appearanceStyle = {
    '--note-font-scale': fontScale,
    '--note-body-line-height': Number((baseLineHeight * lineSpacing).toFixed(3)),
    '--note-padding-scale': contentPadding,
    '--note-text-align': textAlign,
    '--note-title-align': titleAlign
  }
  if (sheetHeight) appearanceStyle['--note-sheet-height'] = `${sheetHeight}px`
  if (fontFamily !== 'theme') {
    const stack = {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", "Noto Serif SC", "Songti SC", serif',
      mono: '"JetBrains Mono", "Cascadia Code", Consolas, "Noto Sans Mono CJK SC", monospace'
    }[fontFamily]
    appearanceStyle['--note-font'] = stack
    appearanceStyle['--note-heading-font'] = stack
  }
  return (
    <div
      className="share-image-theme"
      data-preview-aspect={aspectRatio.id}
      data-preview-device={deviceType}
      data-preview-theme={templateId}
      style={appearanceStyle}
    >
      <div className={`note-sheet${sheetHeight ? ' has-fixed-aspect-ratio' : ''}${hasDocumentTitle ? ' has-document-title' : ''}${!showFooter && !pageLabel ? ' has-no-footer' : ''}`}>
        <div className="sheet-frame sheet-frame-outer" />
        <div className="sheet-frame sheet-frame-inner" />
        <span className="sheet-corner sheet-corner-top-left" />
        <span className="sheet-corner sheet-corner-top-right" />
        <span className="sheet-corner sheet-corner-bottom-left" />
        <span className="sheet-corner sheet-corner-bottom-right" />

        <div className="note-apple-toolbar" aria-hidden="true">
          <span className="note-apple-back">
            <span className="note-apple-back-line">
              <span className="note-apple-back-chevron" aria-hidden="true">
                <svg viewBox="0 0 32 48" focusable="false">
                  <path d="M20 10 6 24l14 14" />
                </svg>
              </span>
              <span className="note-apple-back-label">{copy.appleNotes}</span>
            </span>
          </span>
          <span className="note-apple-actions">
            <span className="note-apple-action-icon note-apple-share">
              <svg viewBox="0 0 86.6722412109375 117.4306640625" focusable="false">
                <g transform="matrix(1 0 0 1 -12.448911132812555 93.9453125)"><path d={APPLE_SHARE_PATH} fillRule="evenodd" /></g>
              </svg>
            </span>
            <span className="note-apple-action-icon note-apple-more">
              <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">
                <path d={APPLE_MORE_PATH} />
                <circle cx="30" cy="50" r="6" style={{ fill: '#e9b817', stroke: 'none' }} />
                <circle cx="50" cy="50" r="6" style={{ fill: '#e9b817', stroke: 'none' }} />
                <circle cx="70" cy="50" r="6" style={{ fill: '#e9b817', stroke: 'none' }} />
              </svg>
            </span>
          </span>
        </div>

        <div className="sheet-inner">
          {notes.map((note, index) => (
            <article
              className={`note-section${note.heading && note.headingAlignment !== 'center' ? ' has-heading' : ''}${isDocumentTitle(note, index) ? ' is-document-title' : ''}${hasDocumentTitle && index === 0 ? ' is-entry-title' : ''}`}
              key={`${note.heading}-${index}`}
            >
              {note.heading && note.headingAlignment !== 'center' ? (
                <header className="note-index">
                  <h2>{renderMarkdown ? <ShareImageMarkdownInlineText>{note.heading}</ShareImageMarkdownInlineText> : note.heading}</h2>
                </header>
              ) : null}

              {!note.titleOnly ? (
                <div className="note-copy">
                  {note.heading && note.headingAlignment === 'center' ? (
                    <div className="note-centered-line">
                      {renderMarkdown ? <ShareImageMarkdownText>{note.heading}</ShareImageMarkdownText> : <PlainText>{note.heading}</PlainText>}
                    </div>
                  ) : null}
                  {renderMarkdown
                    ? <ShareImageMarkdownText>{note.content || (note.headingAlignment === 'center' ? '' : ' ')}</ShareImageMarkdownText>
                    : <PlainText>{note.content || (note.headingAlignment === 'center' ? '' : ' ')}</PlainText>}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {showFooter || pageLabel ? (
          <div className={`sheet-footer${showFooter ? '' : ' is-page-only'}`}>
            {showFooter ? (
              <>
                <span className="sheet-footer-icon is-default-footer-logo" aria-hidden="true">
                  <img src={footerLogoUrl} alt="" width="48" height="48" />
                </span>
                <span className="sheet-footer-copy">
                  <strong className="sheet-footer-brand">{copy.footerBrand}</strong>
                  <span className="sheet-footer-via">{copy.footerVia}</span>
                </span>
              </>
            ) : null}
            {pageLabel ? <span className="sheet-footer-page">{pageLabel}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
