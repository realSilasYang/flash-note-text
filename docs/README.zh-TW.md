<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="閃念文本標誌">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <strong>繁體中文（台灣）</strong> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>閃念文本</h1>
  <p><strong>適用於 uTools 的輕量文字工作台，用來快速記錄、編輯 Markdown、開啟不同編碼的檔案，以及製作分享圖片。</strong></p>
</div>

閃念文本是一個 uTools 外掛，將純文字、Markdown 和程式碼編輯集中於同一個視窗，並提供歷史記錄、草稿恢復、文字排版、編碼識別、圖片分享和可選的 AI 功能。

## 贊助

如果閃念文本為您節省了臨時記錄、文字整理和圖片製作的時間，歡迎透過下方 QR Code 贊助作者。請選擇贊助方式：

<p align="center">
  <img src="../public/donate/wechat-pay.png" width="220" alt="微信支付贊助 QR Code">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="../public/donate/alipay.png" width="220" alt="支付寶贊助 QR Code">
</p>

## 功能

- 純文字、Markdown 和程式碼模式；Markdown 標記範圍內顯示原始碼，移出後恢復渲染。
- 歷史項目、自動儲存、草稿恢復、搜尋、預覽、重新命名、刪除和排序。
- 整理換行、空白、跳脫字元、引用序號、連結、標點和中英文間距。
- 使用 CodeMirror 和 Shiki 自動或手動選擇程式語言並顯示語法高亮。
- 支援 UTF-8/16/32、GBK、GB18030、Big5、Shift_JIS、EUC-KR、Windows-1252 和 Latin-1。
- 提供便箋、程式碼、小紅書、知乎、微信和 X 分享圖片工作台。
- 內建簡中、繁中、英文、日文、越南文、韓文、西文、法文、葡萄牙文、俄文、德文和義大利文介面。

## 安裝與開發

1. 安裝並啟動 [uTools](https://u.tools/)。
2. 從 [uTools 外掛頁](https://www.u-tools.cn/plugins/detail/%E9%97%AA%E5%BF%B5%E6%96%87%E6%9C%AC/) 直接安裝，也可從 [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) 下載外掛或在本機建置。
3. 在 uTools 開發者工具中載入產生的 `dist` 目錄。

```powershell
npm install
npm run release:build
```

完整使用說明、快捷鍵、資料邊界和開發指南請參閱[簡體中文 README](../README.md)。

## 授權

本專案採用 [MIT License](../LICENSE)。第三方字型、圖片和主題遵循各自授權條款。
