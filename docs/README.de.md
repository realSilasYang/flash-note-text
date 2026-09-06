<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Flash Note Text Logo">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <strong>Deutsch</strong> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>Ein leichtes Textarbeitsfenster für uTools: schnelle Notizen, Markdown, Dateien mit verschiedenen Kodierungen und teilbare Bilder.</strong></p>
</div>

Flash Note Text ist ein uTools-Plugin für temporäre Notizen und Textkonvertierung. Es verbindet die Bearbeitung von Klartext, Markdown und Code mit Verlauf, Entwurfswiederherstellung, Formatierung, Kodierungserkennung, Bildfreigabe und optionaler KI.

## Unterstützen

Wenn Flash Note Text beim Erfassen, Formatieren oder Teilen von Text Zeit spart, können Sie den Autor über die folgenden QR-Codes unterstützen. Wählen Sie eine Zahlungsmethode:

<p align="center">
  <img src="../public/donate/wechat-pay.png" width="220" alt="WeChat Pay Spenden-QR-Code">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="../public/donate/alipay.png" width="220" alt="Alipay Spenden-QR-Code">
</p>

## Funktionen

- Klartext-, Markdown- und Code-Modus; innerhalb der Markdown-Auszeichnung wird der Quelltext angezeigt, außerhalb das gerenderte Ergebnis.
- Verlauf, automatische Speicherung, Entwurfswiederherstellung, Suche, Vorschau, Umbenennen, Löschen und Sortieren.
- Bereinigung von Zeilenumbrüchen, Leerzeichen, Escape-Zeichen, Zitatnummern, Links, Interpunktion und CJK/lateinischen Abständen.
- Automatische oder manuelle Sprachauswahl mit CodeMirror und Shiki.
- Unterstützung für UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252 und Latin-1.
- Bilder für Notizen, Code, Xiaohongshu, Zhihu, WeChat und X.
- Benutzeroberfläche in 14 Sprachen, darunter Deutsch, Englisch, Chinesisch, Japanisch, Vietnamesisch, Koreanisch, Spanisch, Französisch, Portugiesisch, Russisch und Italienisch.

## Installation und Entwicklung

1. [uTools](https://u.tools/) installieren und starten.
2. Über die [uTools-Pluginseite](https://www.u-tools.cn/plugins/detail/%E9%97%AA%E5%BF%B5%E6%96%87%E6%9C%AC/) installieren, ein Paket aus [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) laden oder lokal bauen.
3. Das erzeugte Verzeichnis `dist` in den uTools-Entwicklertools laden.

```powershell
npm install
npm run release:build
```

Die vollständige Anleitung, Tastenkürzel, Datengrenzen und Entwicklerhinweise stehen im [README auf vereinfachtem Chinesisch](../README.md).

## Lizenz

Veröffentlicht unter der [MIT License](../LICENSE). Schriften, Bilder und Themes von Drittanbietern behalten ihre eigenen Lizenzen.
