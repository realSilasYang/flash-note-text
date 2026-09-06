import { lazy, memo } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CodeImageStudio from './CodeImageStudio.jsx'
import GeneratedImageStudio from './GeneratedImageStudio.jsx'
import NoteImageStudio from './NoteImageStudio.jsx'
import './shareStudio.less'

const XiaohongshuImageStudio = lazy(() => import(/* webpackChunkName: "xiaohongshu-image-studio" */ './XiaohongshuImageStudio.jsx'))
const SocialImageStudio = lazy(() => import(/* webpackChunkName: "social-image-studio" */ './SocialImageStudio.jsx'))

function ShareStudioDialog ({ aiImageGenerationPrompt = '', aiModel = '', data, directAi = null, imageSaveDirectory = '', isDark = true, language, onClose, onExported, onNotify, open }) {
  const kind = data?.kind === 'code'
    ? 'code'
    : data?.kind === 'generated-image'
      ? 'generated-image'
    : data?.kind === 'xiaohongshu' || data?.kind === 'xiaohongshu-long'
      ? data.kind
      : data?.kind === 'x' || data?.kind === 'zhihu' || data?.kind === 'wechat'
        ? data.kind
      : 'note'
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === 'escapeKeyDown') onClose()
      }}
      fullScreen
      disableEnforceFocus
      disableRestoreFocus
      aria-labelledby="share-studio-title"
      PaperProps={{ className: `share-studio-paper ${isDark ? 'is-dark' : 'is-light'}` }}
    >
      <DialogContent className="share-studio-dialog-content">
        {kind === 'generated-image' ? (
          <GeneratedImageStudio aiImageGenerationPrompt={aiImageGenerationPrompt} aiModel={aiModel} content={data?.content || ''} directAi={directAi} initialData={data} imageSaveDirectory={imageSaveDirectory} language={language} onClose={onClose} onExported={onExported} onNotify={onNotify} />
        ) : kind === 'code' ? (
          <CodeImageStudio initialData={data} imageSaveDirectory={imageSaveDirectory} isDark={isDark} language={language} onClose={onClose} onExported={onExported} onNotify={onNotify} />
        ) : kind === 'xiaohongshu' || kind === 'xiaohongshu-long' ? (
          <XiaohongshuImageStudio initialData={data} imageSaveDirectory={imageSaveDirectory} isDark={isDark} language={language} onClose={onClose} onExported={onExported} onNotify={onNotify} />
        ) : kind === 'x' || kind === 'zhihu' || kind === 'wechat' ? (
          <SocialImageStudio initialData={data} imageSaveDirectory={imageSaveDirectory} isDark={isDark} language={language} onClose={onClose} onExported={onExported} onNotify={onNotify} />
        ) : (
          <NoteImageStudio initialData={data} imageSaveDirectory={imageSaveDirectory} isDark={isDark} language={language} onClose={onClose} onExported={onExported} onNotify={onNotify} />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default memo(ShareStudioDialog)
