<div align="center">
  <img src="./public/logo.png" width="112" height="112" alt="闪念文本 Logo">

  <p><strong>简体中文</strong> · <a href="./docs/README.zh-HK.md">繁體中文（香港）</a> · <a href="./docs/README.zh-TW.md">繁體中文（台灣）</a> · <a href="./docs/README.en.md">English</a> · <a href="./docs/README.ja.md">日本語</a> · <a href="./docs/README.vi.md">Tiếng Việt</a> · <a href="./docs/README.ko.md">한국어</a> · <a href="./docs/README.es.md">Español</a> · <a href="./docs/README.fr.md">Français</a> · <a href="./docs/README.pt-BR.md">Português (Brasil)</a> · <a href="./docs/README.pt-PT.md">Português (Portugal)</a> · <a href="./docs/README.ru.md">Русский</a> · <a href="./docs/README.de.md">Deutsch</a> · <a href="./docs/README.it.md">Italiano</a></p>

  <h1>闪念文本 · Flash Note Text</h1>

  <p><strong>面向 uTools 的轻量文本工作台：快速记录、整理 Markdown、打开编码文件，并把内容导出为可分享的图片。</strong></p>

  <p>
    <a href="https://github.com/realSilasYang/flash-note-text/releases"><img src="https://img.shields.io/github/v/release/realSilasYang/flash-note-text?style=flat-square&amp;label=version" alt="最新版本"></a>
    <a href="https://github.com/realSilasYang/flash-note-text/releases"><img src="https://img.shields.io/github/downloads/realSilasYang/flash-note-text/total?style=flat-square&amp;label=downloads" alt="GitHub 下载量"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/github/license/realSilasYang/flash-note-text?style=flat-square" alt="MIT 许可证"></a>
    <a href="https://github.com/realSilasYang/flash-note-text/issues"><img src="https://img.shields.io/github/issues/realSilasYang/flash-note-text?style=flat-square" alt="GitHub Issues"></a>
  </p>

  <p>
    <a href="#界面概览">界面概览</a> ·
    <a href="#用户使用指南">用户指南</a> ·
    <a href="#快捷键">快捷键</a> ·
    <a href="#开发者指南">开发者指南</a> ·
    <a href="https://github.com/realSilasYang/flash-note-text/issues">问题反馈</a>
  </p>
</div>

闪念文本是一款 uTools 插件，适合临时记录、整理和转换文本。它把纯文本、Markdown 和代码编辑集中在一个窗口中，并用历史记录、恢复草稿、编码识别和图片分享覆盖从输入到输出的常用流程。项目使用 React、CodeMirror、Milkdown 和 webpack 构建，源码以 MIT 许可证开放。

## 界面概览

界面由历史侧栏、编辑区和底部状态栏组成：

- **历史侧栏**：新建、搜索、重命名、删除、排序和切换历史条目；悬浮条目约 500ms 可在编辑区只读预览。
- **编辑区**：按条目独立保存内容，可在纯文本、Markdown 和代码模式之间切换。Markdown 光标位于格式作用范围内时显示源码，移出范围后恢复渲染。
- **操作栏**：提供查找替换、文本排版、图片分享、AI、打开和保存文件等操作。
- **状态栏**：显示字符统计、编辑模式、缩放、换行格式、文件编码和代码语言，可直接切换对应状态。
- **设置与使用说明**：可设置主题、界面语言、启动行为、历史保留方式、自动换行、侧栏快捷键、AI 参数和图片保存目录。

## 功能概览

- **三种编辑模式**：纯文本、Markdown 和代码模式；Markdown 支持所见即所得与源码编辑，代码模式支持语言识别、语言选择和语法高亮。
- **历史与恢复**：自动保存可按设置启用或关闭，支持历史条目、编辑位置、光标位置和未提交草稿恢复。
- **文本排版**：整理断行、空白、换行转义、引用序号、链接、标点和中英文间距；同时提供 Markdown 常用格式快捷操作。
- **多编码文件**：自动识别或手动选择文本编码，支持多种 Unicode、中文、日文、韩文和西文编码，并保留常见换行格式。
- **图片分享**：生成便签、代码截图、小红书、知乎、微信公众号和 X 分享图片，可调整模板、主题、排版和导出参数。
- **可选 AI**：配置兼容服务后，可辅助整理当前文本或生成分享图片；不配置时不影响本地编辑功能。
- **本地优先**：历史正文和恢复草稿保存在本机 uTools 存储中，网络请求只在主动使用 AI 或小红书相关功能时发生。

## 支持的语言

### 界面语言

插件内置 14 套完整界面文案，可在“设置 → 界面语言”中选择，也可以跟随系统语言自动切换。当前支持：

| 语言 | 语言代码 |
| --- | --- |
| 简体中文 | `zh-CN` |
| 繁體中文（香港） | `zh-HK` |
| 繁體中文（台灣） | `zh-TW` |
| English | `en` |
| 日本語 | `ja` |
| Tiếng Việt | `vi` |
| 한국어 | `ko` |
| Español | `es` |
| Français | `fr` |
| Português (Brasil) | `pt-BR` |
| Português (Portugal) | `pt-PT` |
| Русский | `ru` |
| Deutsch | `de` |
| Italiano | `it` |

自动模式会根据系统语言选择对应目录；简体中文、繁体中文和葡萄牙语会按地区细分。未注册的系统语言回退到简体中文。界面语言目录位于 [`src/locales/`](./src/locales)，新增翻译时应保持所有稳定键和参数一致。

### 代码语言

代码模式的语言选项来自 CodeMirror Language Data，并支持异步加载语法规则。文件打开时会按扩展名或文件名自动识别，也可以在底部语言菜单中手动选择。常见自动识别语言包括：

| 类别 | 语言 |
| --- | --- |
| Web | HTML、CSS、SCSS、Sass、LESS、JavaScript、JSX、TypeScript、TSX、Vue、XML |
| 系统与编译型 | C、C++、C#、Go、Java、Kotlin、Rust、Swift、Dart、Objective-C、Objective-C++ |
| 脚本与数据 | Python、Ruby、PHP、Lua、Perl、R、Shell、PowerShell、VBScript、SQL、JSON、YAML、TOML、INI、Properties |
| 函数式与科学 | Haskell、F#、Erlang、Julia、Scala、Scheme、LaTeX |
| 配置与硬件 | Dockerfile、CMake、ProtoBuf、Verilog、SystemVerilog、VHDL、WebAssembly |

完整语言列表以运行时语言选择器为准；无法识别的文件可以使用纯文本或手动指定语言。代码语言识别与界面语言相互独立。

### 文件编码与换行

可打开、保存并手动转换以下编码：

- UTF-8、UTF-8 BOM
- UTF-16 LE/BE、UTF-32 LE/BE（含 BOM）
- GBK、GB18030、Big5
- Shift_JIS、EUC-KR
- Windows-1252、Latin-1

LF、CRLF、CR 和混合换行均可识别；未主动修改混合换行格式时会按原位置保留，新增行使用原文件的主导换行格式。保存到不能表示当前字符的传统编码时，插件会中止保存并提示改用兼容编码，避免静默写入问号或乱码。

## 安装与启动

1. 安装并启动 [uTools](https://u.tools/)。
2. 从 [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) 下载插件包，或在本地完成构建后加载 `dist` 目录。
3. 在 uTools 中搜索“闪念文本”“闪念”或“文本编辑”打开插件。

开发版本可以直接运行 `npm run release:build`，然后在 uTools 开发者工具中选择项目生成的 `dist` 目录。正式发布时请使用构建后的 `dist` 内容，不要把 `node_modules` 或源码目录作为插件目录加载。

## 打赏

如果闪念文本为您节省了临时记录、文本整理和图片制作的时间，欢迎通过下方二维码打赏作者。请选择支持方式：

<p align="center">
  <img src="public/donate/wechat-pay.png" width="220" alt="微信支付打赏二维码">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/donate/alipay.png" width="220" alt="支付宝打赏二维码">
</p>

## 用户使用指南

### 1. 初次使用

首次打开插件会创建一个空白编辑条目。输入标题或内容后，条目会出现在历史侧栏；既没有标题也没有内容的空条目不会写入数据库。默认再次进入插件时恢复上次查看的条目及光标位置，也可以在设置中改为每次新建条目。

顶部自动保存按钮有开启和关闭两种状态：开启时，停止输入约 150ms 后写回当前历史条目；关闭时，修改只保留为恢复草稿，不会新增或覆盖历史正文。

### 2. 历史条目、搜索与预览

单击历史卡片可切换当前条目；编辑已有条目会覆盖原条目，不会自动制造副本。侧栏搜索会同时匹配历史标题和正文，编辑区内的 `Ctrl+F` 与 `Ctrl+H` 只处理当前条目。悬浮其他卡片约 500ms 后，编辑区会进入只读预览，移开卡片即可返回当前条目。

历史卡片支持 `F2` 重命名、`Delete` 删除和 `Alt+↑` / `Alt+↓` 调整顺序。删除最后一张卡片后会优先聚焦前一张；删除或清空历史时会同步清理关联的恢复草稿和编辑位置。

### 3. 编辑模式与 Markdown

底部编辑模式区域可切换：

- **纯文本**：适合临时记录，不解析 Markdown 标记。
- **Markdown**：支持标题、强调、链接、引用、列表、代码块、表格和分隔线。光标进入成对语法符号的包裹范围时显示源码，移出范围后恢复 Markdown 样式，便于检查标记边界。
- **代码**：支持自动识别或手动选择语言，使用 CodeMirror 和 Shiki 提供语法高亮、行号、括号匹配和代码编辑快捷键。

Markdown 模式还支持 `Alt+0` 切回正文、`Alt+1` 至 `Alt+6` 设置标题，以及 `Ctrl+Shift+[`、`Ctrl+Shift+]`、`Ctrl+Shift+K`、`Ctrl+Shift+M`、`Ctrl+Shift+Q`、`Ctrl+Shift+X` 等块级格式快捷键。

### 4. 文本排版

在文本排版菜单中选择需要的规则即可处理当前内容：

- 整理段落断行，合并不必要的换行并保留段落边界。
- 在显示换行符、反斜杠和制表符的文本与真实控制字符之间转换。
- 清理行首行尾空白、重复空格、重复空行和不可见空白。
- 清理连续的 Markdown 引用序号，例如 `[4][5][6]`，并保留正文与句末标点。
- 统一链接、标点和中英文或中数字之间的间距。
- 使用 Markdown 快捷操作快速插入或切换标题、粗体、斜体、删除线、链接、列表、引用、代码块和分隔线。

排版操作会写入编辑器撤销历史；执行后可使用撤销快捷键恢复原文。处理前建议先确认当前编辑模式和选区，避免把代码或有特殊格式要求的文本当作普通文章整理。

### 5. 打开与保存文件

使用打开文件或保存文件命令选择路径。打开文件后，底部编码区域会显示识别结果和候选编码，可切换编码并重新读取。保存文件每次都会要求选择位置；当前条目不会因为保存文件而自动绑定为固定路径。

编辑器内部统一使用 JavaScript Unicode 字符串，只有打开和保存文件时执行字节编码转换。文件过大、被识别为二进制或所选编码无法表示内容时，插件会停止操作并给出提示。

### 6. 图片分享与 AI

分享菜单提供便签图片、代码截图、小红书卡片和长文图片、知乎图片、微信公众号图片以及 X 图片。预览中可以调整模板、配色、字体、作者信息和导出参数；复制或保存成功后会显示通知。小红书登录只在官方窗口中完成，插件不会读取或明文保存账号、验证码、Cookie 或 Token。

AI 功能需要在设置中配置兼容服务地址、模型和密钥。文本整理 AI 只会在用户主动提交后运行；结果应用前仍可编辑和撤销。AI 配置为空时，其他编辑、文件和图片功能照常可用。

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
| `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z` | 撤销、删除行 / 重做 |
| `Ctrl+Enter` | 复制内容并退出 |
| `Alt+Z` | 展开 / 折叠侧栏，可在设置中修改 |
| `F2` / `Delete` | 重命名 / 删除当前聚焦的历史卡片 |
| `Alt+↑` / `Alt+↓` | 用键盘调整历史卡片顺序 |

快捷键速查也可以从侧栏底部的“使用说明”打开。快捷键设置会保存在本机；发生冲突时，插件会提示改用其他组合键。

## 数据与隐私

历史正文写入 uTools 本地数据库，历史索引、恢复草稿和编辑位置写入本机存储。自动保存关闭时，未提交内容只保留为当前会话的恢复草稿；插件退出时不会把它写成正式历史正文。条目切换、删除、输入法组合输入和设置变化都会使旧的延时保存任务失效。

AI 和小红书分享属于可选网络功能。AI 请求只发送用户主动提交的内容和必要配置；小红书自动化只在官方页面中完成登录与生成，不进入发布步骤。项目本身不内置 API 密钥，也不会把密钥写入仓库或构建产物。

## 开发者指南

### 1. 项目结构

| 路径 | 用途 |
| --- | --- |
| `src/App.js` | 主界面、编辑会话、历史操作和功能协调 |
| `src/components/` | 编辑器、侧栏、设置、使用说明和图片工作台组件 |
| `src/locales/` | 14 套界面语言及功能模块文案 |
| `src/markdown*.js` | Markdown 文档、快捷操作和高亮逻辑 |
| `src/textFormatting.js` | 文本排版和清理规则 |
| `src/encoding.js` | 编码识别、换行分析和文件读写转换 |
| `src/services/` | uTools 宿主、AI、文件和图片服务边界 |
| `public/` | uTools 插件清单、入口页面、预加载脚本和静态资源 |
| `scripts/` | 清理和发布校验脚本 |
| `webpack.config.js` | 开发和生产构建配置 |
| `dist/` | 本地构建生成的可加载插件目录，不纳入 Git |

### 2. 状态与持久化边界

编辑器内容由当前编辑会话管理；历史条目、恢复草稿、编辑位置和显示设置分开保存。输入过程中优先写入恢复草稿，自动保存任务绑定具体条目和编辑版本，避免快速切换条目后把旧内容写入新条目。正在编辑的条目收到 uTools 同步数据时保留本地内容，其他条目继续同步。

### 3. 本地开发

需要 Node.js 和 npm：

```powershell
npm install
npm run dev
```

`npm run dev` 启动 webpack 监听；构建后的 `dist` 目录可以在 uTools 开发者工具中加载。日常生产构建和发布校验：

```powershell
npm run build
npm run verify-release
npm run release:build
```

`release:build` 会清理并重建 `dist`，检查版本号、插件清单、静态资源、敏感文件和 source map。提交代码前应至少运行该命令；`dist` 与 `node_modules` 已加入 `.gitignore`。

### 4. 发布与贡献

发布前请确认 `package.json` 和 `public/plugin.json` 使用同一正式版本号，执行 `npm run release:build` 并检查 `dist` 中没有调试文件、备份文件、密钥或 source map。GitHub 仓库只提交源码、文档、清单和必要的静态资源，不提交依赖目录或构建产物。

欢迎通过 [Issues](https://github.com/realSilasYang/flash-note-text/issues) 报告问题、提出功能建议或提交改进。涉及界面文案的修改应同步检查所有语言目录；涉及文件读写、AI 或数据保存的修改应补充对应的回归验证。

## 许可证

本项目以 [MIT License](./LICENSE) 开源。代码截图主题中的字体、图片和其他第三方资源仍遵循各自的许可证或使用条款。
