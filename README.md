<div align="center">
  <img src="./public/logo.png" width="112" height="112" alt="闪念文本 Logo">

  <h1>闪念文本 · Flash Note Text</h1>

  <p><strong>面向 uTools 的轻量文本工作台：快速记录、整理 Markdown、打开编码文件，并把内容导出为可分享的图片。</strong></p>

  <p>
    <a href="https://github.com/realSilasYang/flash-note-text/releases"><img src="https://img.shields.io/github/v/release/realSilasYang/flash-note-text?style=flat-square&amp;label=version" alt="最新版本"></a>
    <a href="https://github.com/realSilasYang/flash-note-text/releases"><img src="https://img.shields.io/github/downloads/realSilasYang/flash-note-text/total?style=flat-square&amp;label=downloads" alt="GitHub 下载量"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/github/license/realSilasYang/flash-note-text?style=flat-square" alt="MIT 许可证"></a>
    <a href="https://github.com/realSilasYang/flash-note-text/issues"><img src="https://img.shields.io/github/issues/realSilasYang/flash-note-text?style=flat-square" alt="GitHub Issues"></a>
  </p>

  <p>
    <a href="#功能概览">功能概览</a> ·
    <a href="#用户使用指南">用户指南</a> ·
    <a href="#快捷键">快捷键</a> ·
    <a href="#开发与构建">开发与构建</a> ·
    <a href="https://github.com/realSilasYang/flash-note-text/issues">问题反馈</a>
  </p>
</div>

闪念文本是一款 uTools 插件，适合临时记录、整理和转换文本。它把纯文本、Markdown 和代码编辑集中在一个窗口中，并用历史记录、恢复草稿、编码识别和图片分享覆盖从输入到输出的常用流程。项目使用 React、CodeMirror、Milkdown 和 webpack 构建。

## 功能概览

- **三种编辑模式**：纯文本、Markdown 和代码模式；代码模式提供语言识别与语法高亮。
- **历史与恢复**：自动保存可按设置启用或关闭，支持历史条目、编辑位置、光标位置和未提交草稿恢复。
- **文本排版**：整理断行、空白、换行转义、引用序号、链接、标点和中英文间距；同时提供 Markdown 常用格式快捷操作。
- **文件编码**：打开和保存 UTF-8、UTF-16、UTF-32、GBK、GB18030、Big5、Shift_JIS、EUC-KR、Windows-1252、Latin-1 等文本编码，并支持 LF、CRLF、CR 和混合换行。
- **图片分享**：生成便签、代码截图、小红书、知乎、微信公众号和 X 分享图片，可调整模板、主题、排版和导出参数。
- **可选 AI**：配置兼容服务后，可辅助整理当前文本或生成分享内容；不配置时不影响其他功能。
- **本地优先**：历史正文和恢复草稿保存在本机 uTools 存储中，网络请求只在主动使用 AI 或小红书相关功能时发生。

## 安装与启动

1. 安装并启动 [uTools](https://u.tools/)。
2. 从 GitHub Releases 下载插件包，或在本地完成构建后加载 `dist` 目录。
3. 在 uTools 中搜索“闪念文本”“闪念”或“文本编辑”打开插件。

开发版本可以直接运行 `npm run release:build`，然后在 uTools 开发者工具中选择项目生成的 `dist` 目录。正式发布时请使用构建后的 `dist` 内容，不要把 `node_modules` 或源码目录作为插件目录加载。

## 用户使用指南

### 日常编辑

新建内容会显示在历史侧栏。编辑已有条目时会更新原条目，不会自动创建副本；空标题且没有正文的条目不会写入历史。再次进入插件时，默认恢复上次查看的条目和编辑位置，也可以在设置中改为每次新建条目。

底部编辑模式可以切换纯文本、Markdown 和代码。Markdown 模式支持标题、强调、链接、引用、列表、代码块等常用格式；光标位于格式作用范围内时显示源码，移出范围后恢复渲染，适合直接检查和修改标记。

### 文本排版

在文本排版菜单中选择需要的规则即可处理当前内容：

- 整理段落断行，合并不必要的换行并保留段落边界。
- 在显示换行符、反斜杠和制表符的文本与真实控制字符之间转换。
- 清理行首行尾空白、重复空格、重复空行和不可见空白。
- 清理连续的 Markdown 引用序号，例如 `[4][5][6]`，并保留正文与句末标点。
- 统一链接、标点和中英文或中数字之间的间距。
- 使用 Markdown 快捷操作快速插入或切换标题、粗体、斜体、删除线、链接、列表、引用、代码块和分隔线。

排版操作会写入编辑器撤销历史；执行后可使用撤销快捷键恢复原文。处理前建议先确认当前编辑模式和选区，避免把代码或有特殊格式要求的文本当作普通文章整理。

### 打开与保存文件

使用打开文件或保存文件命令选择路径。打开文件后，底部编码区域会显示识别结果和候选编码，可切换编码并重新读取。保存到无法表示当前字符的传统编码时，插件会停止保存并提示选择兼容编码，避免静默产生问号或乱码。

### 分享图片

分享菜单提供便签图片、代码截图、小红书卡片和长文图片、知乎图片、微信公众号图片以及 X 图片。预览中可以调整模板、配色、字体、作者信息和导出参数；复制或保存成功后会显示通知。小红书登录只在官方窗口中完成，插件不会读取或明文保存账号、验证码、Cookie 或 Token。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl+N` | 新建条目 |
| `Ctrl+F` | 查找当前内容 |
| `Ctrl+H` | 查找和替换当前内容 |
| `Ctrl+O` | 打开文本文件 |
| `Ctrl+S` | 选择位置并保存文件 |
| `Ctrl+G` | 跳转到行 |
| `Ctrl+/` | 切换纯文本 / Markdown |
| `Ctrl+B` / `Ctrl+I` | Markdown 加粗 / 斜体 |
| `Ctrl+=` / `Ctrl+-` / `Ctrl+0` | 放大 / 缩小 / 重置缩放 |
| `Ctrl+Z` / `Ctrl+Shift+Z` | 撤销 / 重做 |
| `Ctrl+Enter` | 复制内容并退出 |
| `Alt+Z` | 展开 / 折叠侧栏 |
| `F2` / `Delete` | 重命名 / 删除当前历史卡片 |
| `Alt+↑` / `Alt+↓` | 调整历史卡片顺序 |

Markdown 模式还支持 `Alt+0` 至 `Alt+6` 设置正文或标题，以及 `Ctrl+Shift+[`、`Ctrl+Shift+]`、`Ctrl+Shift+K`、`Ctrl+Shift+M`、`Ctrl+Shift+Q`、`Ctrl+Shift+X` 等块级格式快捷键。快捷键可在插件内“查看使用说明”的速查表中查看。

## 数据与隐私

历史正文、历史索引、恢复草稿和编辑位置均保存在本机。自动保存关闭时，未提交内容只保留为当前会话的恢复草稿；删除条目或清空历史时，会同步清理相关草稿和位置数据。uTools 推送远端数据时，正在编辑的条目优先保留本地内容。

AI 和小红书分享属于可选网络功能。AI 请求只发送用户主动提交的内容和必要配置；小红书自动化只在官方页面中完成登录与生成，不进入发布步骤。项目本身不内置 API 密钥，也不会把密钥写入仓库或构建产物。

## 开发与构建

需要 Node.js 和 npm。

```powershell
npm install
npm run build
npm run verify-release
```

开发时可以使用 `npm run dev` 启动 webpack 监听。发布构建使用：

```powershell
npm run release:build
```

该命令会清理并重建 `dist`，检查版本号、插件清单、静态资源、敏感文件和 source map。提交代码前请确认 `npm run release:build` 通过；`dist` 和 `node_modules` 已加入 `.gitignore`，不应提交到源码仓库。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `src/` | React 界面、编辑器、格式化、编码、分享和本地状态逻辑 |
| `public/` | uTools 插件清单、入口页面、预加载脚本和静态资源 |
| `scripts/` | 清理与发布校验脚本 |
| `webpack.config.js` | 开发和生产构建配置 |
| `dist/` | 本地构建生成的可加载插件目录，不纳入 Git |

## 许可证

本项目以 [MIT License](./LICENSE) 开源。代码截图主题中的字体、图片和其他第三方资源仍遵循各自的许可证或使用条款。

欢迎通过 [Issues](https://github.com/realSilasYang/flash-note-text/issues) 报告问题、提出功能建议或提交改进。
