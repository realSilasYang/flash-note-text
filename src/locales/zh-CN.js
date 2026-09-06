export default {
  app: { name: '闪念文本' },
  autoSave: { title: '自动保存条目', workflowDescription: '开启后，修改会自动写回当前条目', helpDescription: '顶部的自动保存按钮有开启和关闭两种状态。开启后，停止输入 150ms 即写回当前条目；关闭后，退出插件、切换条目或保存文件都不会把修改写入历史，当前内容仅保存为恢复草稿。', guideMessage: '• 自动保存按钮可暂停或恢复历史写入。关闭后，未提交内容仅作为恢复草稿保留，不会新增或覆盖历史条目。' },
  sidebar: { autoSaveEntries: '自动保存条目' },
  fileDialog: { textFiles: '文本文件', allFiles: '所有文件', defaultName: '闪念文本', saveButton: '保存', detachRequired: '请先按 Ctrl+D 将「闪念文本」分离为独立窗口' },
  common: { cancel: '取消', close: '关闭', clear: '清空', go: '跳转', applyRemove: '应用并删除' },
  settings: {
    title: '设置', theme: '主题模式', themeAuto: '自动适应', themeLight: '天光大亮', themeDark: '夜色温柔', language: '界面语言', languageAuto: '自动（跟随系统）',
    startup: '进入插件时', startupNew: '新建条目', startupRestore: '定位到上次查看的条目', shortcuts: '快捷键', toggleSidebar: '展开/折叠功能区侧栏', resetShortcut: '恢复默认快捷键',
    shortcutInvalid: '请使用 Ctrl、Alt 或 Meta 组合键，或 F1-F12 功能键', shortcutReserved: '该快捷键已被编辑器占用', retention: '历史记录保留方式', byCount: '按条数', byTime: '按时间',
    commonDuration: '常用保留时间', customDuration: '自定义：{duration}', exactDays: '精确天数', ageRange: '范围 {min} 天至 {max}', ageInvalid: '请输入 {min} 至 {max} 的整数天数',
    maxEntries: '最大条数', countRange: '范围 {min} 至 {max}', countInvalid: '请输入 {min} 至 {max} 的整数', wordWrap: '编辑区自动换行', rememberSidebarState: '记住功能栏展开/折叠状态'
  },
  editor: { loadingMarkdown: '正在加载 Markdown 编辑器', historyPreview: '历史条目预览', readOnlyPreview: '只读预览', noContent: '暂无内容', aria: '闪念文本编辑器', placeholder: '在此输入文本...' },
  search: { matches: '{count} 个匹配', noMatches: '无匹配', findReplace: '查找和替换', findDocument: '在文档中查找', find: '查找', previous: '上一个匹配', next: '下一个匹配', close: '关闭', closeBar: '关闭查找栏', replaceWith: '替换为', replace: '替换', all: '全部' },
  history: {
    newEntry: '新增条目', newEntryShortcut: '新增条目（Ctrl+N）', copyText: '复制文本', search: '搜索历史', searchScope: '搜索历史标题和内容', closeSearch: '关闭历史搜索', searching: '正在搜索...',
    results: '搜索结果 {visible}/{total}', title: '历史记录', clearAll: '清空全部历史', clear: '清空历史', noHistory: '暂无历史记录', searchingFull: '正在搜索标题和内容...', noMatching: '未找到匹配的历史记录',
    rename: '重命名历史条目', deleteNamed: '删除历史：{title}', settings: '设置', guide: '使用说明', openFile: '打开文件', openFileShortcut: '打开文件（Ctrl+O）', saveFile: '保存文件', saveFileShortcut: '保存文件（Ctrl+S）'
  },
  status: {
    characters: '{count} 个字符', unicodeText: 'Unicode 文本', editorStatus: '编辑器状态', collapseSidebarAria: '折叠侧栏（{shortcut}）', expandSidebarAria: '展开侧栏（{shortcut}）', collapseSidebar: '折叠侧栏', expandSidebar: '展开侧栏',
    totalCharacters: '总字符数', effectiveCharacters: '有效字符（不含空格）', cjkCharacters: 'CJK 基本汉字', wordsPhrases: '单词/词组', latinLetters: '拉丁字母', arabicDigits: '阿拉伯数字', punctuation: '标点符号', nonEmptyLines: '行数（不含空行）',
    editorMode: '编辑模式', zoom: '缩放：{zoom}%', zoomOut: '缩小', resetZoom: '重置缩放', zoomIn: '放大', lineEndingSaving: '保存时使用的换行格式', classicMac: '旧式 Mac（CR）', mixedPreserve: '混合（保留）',
    historyUnicode: '历史内容以 Unicode 文本存储', fileEncoding: '文件编码：{encoding}', savingEncoding: '保存时使用：{encoding}', lowConfidence: '自动识别置信度较低，如有乱码请切换编码重新读取。', candidates: '候选：', reloadEncoding: '按此编码重新读取'
  },
  dialogs: { clearTitle: '清空历史记录', clearBody: '确定清空全部 {count} 条历史记录吗？', retentionTitle: '应用历史保留设置', retentionBody: '新的保留范围会永久删除 {count} 条超出限制的历史记录。是否继续？', goToLine: '跳转到行', lineNumber: '行号（1-{count}）' },
  help: {
    startGuide: '开启新手引导', workflow: '核心工作流', history: '历史条目', historyDesc: '新建或聚焦一条临时内容', editor: '聚焦编辑', editorDesc: '编辑区只显示当前条目', autosave: '自动暂存', autosaveDesc: '修改自动写回同一历史条目', features: '常用功能', shortcuts: '快捷键速查', close: '关闭使用说明',
    featureEntryTitle: '条目式暂存', featureEntryDesc: 'Ctrl+N 会立即创建条目；编辑时覆盖当前条目，删除后自动聚焦下一条。', featureSearchTitle: '两种搜索范围', featureSearchDesc: '侧栏搜索会匹配全部条目的标题和内容；Ctrl+F、Ctrl+H 只处理当前条目。',
    featurePreviewTitle: '悬浮预览与排序', featurePreviewDesc: '在其他条目上悬浮 500ms 可于编辑区预览完整内容，也可以直接拖动整张卡片排序。', featureMarkdownTitle: '纯文本与 Markdown', featureMarkdownDesc: '纯文本和 Markdown 共用同一编辑区，Ctrl+/ 可切换当前条目的编辑模式。',
    featureEncodingTitle: '多编码文本文件', featureEncodingDesc: '打开文件时自动识别常用编码，也可手动重读；保存前可在底部信息栏选择输出编码。', featureEmptyTitle: '空条目自动清理', featureEmptyDesc: '既没有标题也没有内容的条目不会保留，不会无效占用历史记录容量。',
    shortcutNew: '新增条目', shortcutFind: '条目内查找', shortcutReplace: '条目内查找替换', shortcutMode: '切换纯文本 / Markdown', shortcutBold: '加粗', shortcutItalic: '斜体', shortcutOpen: '打开文件', shortcutSave: '保存文件', shortcutUndo: '撤销', shortcutRedo: '重做', shortcutGoLine: '跳转到行', shortcutZoom: '编辑器缩放', shortcutSidebar: '展开 / 折叠侧栏', shortcutRename: '重命名悬浮条目', shortcutDelete: '删除悬浮条目', shortcutEscape: '关闭当前功能区或弹窗'
  },
  guide: {
    skip: '跳过', back: '上一步', next: '下一步', finish: '完成',
    historyTitle: '历史记录与聚焦', historyMessage: '编辑区始终只属于当前聚焦条目。\n\n• 单击条目即可聚焦。\n• 在其他条目上悬浮 500ms 可临时预览。\n• 直接拖动整张卡片排序；悬浮时可按 {key:F2} 或 {key:Delete}。',
    actionsTitle: '常用条目操作', actionsMessage: '顶部只保留临时内容的高频操作。\n\n• {bold:新增}会创建并聚焦条目（{key:Ctrl+N}）。\n• {bold:复制}会复制当前显示的条目。\n• {bold:搜索}会同时匹配全部历史的标题和内容。',
    editorTitle: '纯文本与 Markdown 编辑', editorMessage: '在这里编辑聚焦条目，修改会自动写回同一条历史。\n\n• 右侧操作栏提供排版与图片分享。\n• {key:Ctrl+/} 切换纯文本和 Markdown。\n• {key:Ctrl+F} 查找，{key:Ctrl+H} 查找替换。\n• {key:Ctrl+Z} 与 {key:Ctrl+Shift+Z} 撤销、重做操作。',
    statusTitle: '文档状态与控制', statusMessage: '悬浮各信息区域即可打开对应控制。\n\n• 查看详细文档统计。\n• 切换编辑模式和缩放。\n• 选择换行格式和文件编码。\n• 最左区域用于展开或折叠侧栏。',
    toolsTitle: '文件、设置与帮助', toolsMessage: '全局工具集中在侧栏底部。\n\n• 设置主题、语言、历史保留规则和启动行为。\n• 从使用说明重新开启本引导。\n• 打开多编码文本文件，或将聚焦条目保存到每次指定的位置。'
  },
  notice: {
    draftSaveFailed: '保存恢复草稿失败', apiUnavailable: 'uTools 接口不可用', nothingUndo: '没有可撤销的操作', undone: '已撤销', undoFailed: '撤销失败', nothingRedo: '没有可重做的操作', redone: '已重做', redoFailed: '重做失败', saveFailed: '保存失败', textTooLong: '文本不能超过 {max} 个字符', fileRequiresUtools: '文件功能需要在 uTools 插件环境中运行', modeSaveFailed: '保存编辑模式失败', themeSaveFailed: '保存主题设置失败', languageSaveFailed: '保存语言设置失败', startupSaveFailed: '保存启动行为失败', shortcutSet: '功能区快捷键已设为 {shortcut}', shortcutSaveFailed: '保存功能区快捷键失败', runInUtools: '请在 uTools 中运行', draftRecovered: '已恢复未保存的草稿', localLoadFailed: '加载本地数据失败', startupApplyFailed: '应用启动行为失败', conflictCopyTitle: '本地冲突副本', conflictPreserved: '检测到同步冲突，已保留本地副本', syncFailed: '同步历史记录失败', copied: '已复制文本', copyFailed: '复制失败', openedLowConfidence: '已打开 {name}，编码识别置信度较低，请确认', opened: '已打开 {name}', saved: '已保存 {name}', nothingSave: '没有可保存的内容', noAssociatedFile: '当前内容还没有关联文件', reloadedEncoding: '已按 {encoding} 重新读取', boldMarkdownOnly: '加粗仅在 Markdown 模式中可用', italicMarkdownOnly: '斜体仅在 Markdown 模式中可用', lineRange: '请输入 1 到 {count} 之间的行号', zoomSaveFailed: '保存缩放设置失败', newEntry: '已新增空白条目', newEntryFailed: '新增条目失败', copyWindowKept: '复制失败，已保留当前窗口', deletedOne: '已删除 1 条历史', deleteFailed: '删除失败', titleUpdated: '历史标题已更新', renameFailed: '重命名失败', reorderFailed: '保存历史排序失败', historyCleared: '历史记录已清空', clearFailed: '清空失败，已重新同步剩余历史', retentionTimeSet: '历史保留时间已设为 {duration}', retentionCountSet: '历史上限已设为 {count} 条', settingsSaveFailed: '保存设置失败', wordWrapSaveFailed: '保存自动换行设置失败', tutorialCompleted: '新手引导已完成', noMatches: '未找到匹配项', enterFind: '请输入查找内容', replacedOne: '已替换 1 处', replacedMany: '已替换 {count} 处'
  },
  fileError: { binary: '该文件可能是二进制文件，无法作为文本打开', encodingLoss: '所选编码无法表示部分字符，请改用 UTF-8 或其他兼容编码', tooLarge: '文件过大，最多支持 {max} 个字符', notFile: '所选路径不是文件', textTooLong: '文本不能超过 {max} 个字符', generic: '文件操作失败' },
  error: { unknown: '未知错误', operation: '操作出现异常', background: '后台操作出现异常', details: '技术详情', close: '关闭', copyDetails: '复制详情', renderError: '界面渲染错误', reload: '重新加载', renderTitle: '界面暂时无法显示', renderBody: '请重新加载闪念文本。当前内容和历史记录通常仍保存在本地。' },
  mode: { text: '纯文本', markdown: 'Markdown' },
  lineEnding: { mixed: '混合（保留）', classicMac: '旧式 Mac（CR）' },
  time: { justNow: '刚刚' },
  age: { days: '{count} 天', months: '{count} 个月', years: '{count} 年' }
}
