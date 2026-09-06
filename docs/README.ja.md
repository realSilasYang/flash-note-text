<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="閃念文本 ロゴ">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <strong>日本語</strong> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>閃念文本</h1>
  <p><strong>uTools 向けの軽量テキストワークスペース。メモ、Markdown 編集、エンコードされたファイルの読み書き、共有画像の作成に対応します。</strong></p>
</div>

閃念文本は、プレーンテキスト、Markdown、コード編集を一つの画面にまとめた uTools プラグインです。履歴、下書き復元、テキスト整形、文字コード判定、画像共有、任意の AI 機能を利用できます。

## 主な機能

- プレーンテキスト、Markdown、コードモード。Markdown のマークアップ内ではソースを表示し、外側ではレンダリングします。
- 履歴、自動保存、下書き復元、検索、プレビュー、名前変更、削除、並べ替え。
- 改行、空白、エスケープ、引用番号、リンク、句読点、中日英の間隔を整形。
- CodeMirror と Shiki によるコード言語の自動・手動選択とシンタックスハイライト。
- UTF-8/16/32、GBK、GB18030、Big5、Shift_JIS、EUC-KR、Windows-1252、Latin-1。
- メモ、コード、小紅書、知乎、WeChat、X の共有画像。
- 中国語、英語、日本語、ベトナム語、韓国語、スペイン語、フランス語、ポルトガル語、ロシア語、ドイツ語、イタリア語など 14 言語の UI。

## インストールと開発

1. [uTools](https://u.tools/) をインストールして起動します。
2. [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) から取得するか、ローカルでビルドします。
3. uTools 開発者ツールで生成された `dist` ディレクトリを読み込みます。

```powershell
npm install
npm run release:build
```

詳しい使い方、ショートカット、データ境界、開発ガイドは[簡体字中国語 README](../README.md)を参照してください。

## ライセンス

[MIT License](../LICENSE) で公開しています。第三者のフォント、画像、テーマには各ライセンスが適用されます。
