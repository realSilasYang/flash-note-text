<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Flash Note Text logo">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <strong>English</strong> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>A lightweight uTools workspace for capturing text, editing Markdown, opening encoded files, and exporting shareable images.</strong></p>
</div>

Flash Note Text is a uTools plugin for temporary notes and text conversion. It combines plain text, Markdown, and code editing with history, draft recovery, encoding detection, formatting tools, optional AI, and image sharing.

## Donate

If Flash Note Text saves you time when capturing, formatting, or sharing text, you are welcome to support the author through the QR codes below. Please choose a payment method:

<p align="center">
  <img src="../public/donate/wechat-pay.png" width="220" alt="WeChat Pay donation QR code">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="../public/donate/alipay.png" width="220" alt="Alipay donation QR code">
</p>

## Features

- Plain text, Markdown, and code modes with source view inside Markdown markup and rendered view outside it.
- History entries, optional auto-save, draft recovery, cursor position recovery, search, preview, rename, delete, and reorder.
- Text formatting for line breaks, whitespace, escapes, citation numbers, links, punctuation, and CJK/Latin spacing.
- Code highlighting with automatic or manual language selection through CodeMirror and Shiki.
- UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252, and Latin-1 file support.
- Note, code, Xiaohongshu, Zhihu, WeChat, and X image sharing studios.
- Optional compatible AI services. Local editing works without network configuration.
- Fourteen interface languages: Simplified Chinese, Traditional Chinese (Hong Kong/Taiwan), English, Japanese, Vietnamese, Korean, Spanish, French, Portuguese (Brazil/Portugal), Russian, German, and Italian.

## Install and run

1. Install and launch [uTools](https://u.tools/).
2. Install it from the [uTools plugin page](https://www.u-tools.cn/plugins/detail/%E9%97%AA%E5%BF%B5%E6%96%87%E6%9C%AC/), download a package from [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases), or build the plugin locally.
3. Load the generated `dist` directory in the uTools developer tools and search for Flash Note Text.

## Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | New entry |
| `Ctrl+F` / `Ctrl+H` | Find / find and replace |
| `Ctrl+O` / `Ctrl+S` | Open / save a text file |
| `Ctrl+/` | Toggle plain text and Markdown |
| `Ctrl+B` / `Ctrl+I` | Markdown bold / italic |
| `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z` | Undo / delete line / redo |
| `F2` / `Delete` | Rename / delete the focused history entry |
| `Alt+Z` | Toggle the sidebar |

## Development

```powershell
npm install
npm run dev
npm run release:build
```

The release build cleans and rebuilds `dist`, then checks the version, plugin manifest, copied assets, sensitive files, and source maps. Do not commit `node_modules` or `dist`.

For the complete user guide, language details, data boundaries, project structure, and release notes, see the [Simplified Chinese README](../README.md).

## License

Released under the [MIT License](../LICENSE). Third-party fonts, images, and themes retain their own licenses.
