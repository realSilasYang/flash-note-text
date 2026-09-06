<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Логотип Flash Note Text">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <strong>Русский</strong> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>Лёгкое текстовое рабочее пространство для uTools: быстрые заметки, Markdown, файлы с разными кодировками и изображения для публикации.</strong></p>
</div>

Flash Note Text — плагин uTools для временных заметок и преобразования текста. Он объединяет редакторы обычного текста, Markdown и кода с историей, восстановлением черновиков, форматированием, определением кодировки, обменом изображениями и опциональным ИИ.

## Возможности

- Режимы обычного текста, Markdown и кода; внутри Markdown-разметки показывается исходный текст, снаружи — результат.
- История, автосохранение, восстановление черновиков, поиск, предпросмотр, переименование, удаление и сортировка.
- Очистка переносов строк, пробелов, экранирования, номеров цитат, ссылок, пунктуации и интервалов CJK/латиницы.
- Автоматический или ручной выбор языка кода с CodeMirror и Shiki.
- Поддержка UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252 и Latin-1.
- Изображения заметок, кода, Xiaohongshu, Zhihu, WeChat и X.
- Интерфейс на 14 языках, включая русский, английский, китайский, японский, вьетнамский, корейский, испанский, французский, португальский, немецкий и итальянский.

## Установка и разработка

1. Установите и запустите [uTools](https://u.tools/).
2. Скачайте пакет из [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) или соберите проект локально.
3. Загрузите созданную папку `dist` в инструментах разработчика uTools.

```powershell
npm install
npm run release:build
```

Полное руководство, сочетания клавиш, границы данных и описание разработки доступны в [README на упрощённом китайском](../README.md).

## Лицензия

Проект распространяется по [MIT License](../LICENSE). Сторонние шрифты, изображения и темы имеют собственные лицензии.
