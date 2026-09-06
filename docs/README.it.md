<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Logo di Flash Note Text">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <strong>Italiano</strong></p>
  <h1>Flash Note Text</h1>
  <p><strong>Uno spazio di lavoro testuale leggero per uTools: appunti rapidi, Markdown, file con diverse codifiche e immagini da condividere.</strong></p>
</div>

Flash Note Text è un plugin uTools per appunti temporanei e conversione del testo. Riunisce la modifica di testo semplice, Markdown e codice con cronologia, recupero delle bozze, formattazione, rilevamento della codifica, immagini condivisibili e IA opzionale.

## Sostieni il progetto

Se Flash Note Text ti fa risparmiare tempo per annotare, formattare o condividere testo, puoi sostenere l’autore tramite i codici QR qui sotto. Scegli un metodo di pagamento:

<p align="center">
  <img src="../public/donate/wechat-pay.png" width="220" alt="Codice QR per donazione WeChat Pay">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="../public/donate/alipay.png" width="220" alt="Codice QR per donazione Alipay">
</p>

## Funzionalità

- Modalità testo semplice, Markdown e codice; dentro la marcatura Markdown mostra il sorgente, fuori mostra il risultato renderizzato.
- Cronologia, salvataggio automatico, recupero delle bozze, ricerca, anteprima, rinomina, eliminazione e riordino.
- Pulizia di interruzioni di riga, spazi, escape, numeri di citazione, collegamenti, punteggiatura e spazi CJK/latini.
- Selezione automatica o manuale del linguaggio con CodeMirror e Shiki.
- Supporto per UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252 e Latin-1.
- Immagini per note, codice, Xiaohongshu, Zhihu, WeChat e X.
- Interfaccia in 14 lingue, tra cui italiano, inglese, cinese, giapponese, vietnamita, coreano, spagnolo, francese, portoghese, russo e tedesco.

## Installazione e sviluppo

1. Installa e avvia [uTools](https://u.tools/).
2. Scarica un pacchetto da [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) oppure compila localmente.
3. Carica la cartella `dist` generata negli strumenti per sviluppatori di uTools.

```powershell
npm install
npm run release:build
```

Consulta il [README in cinese semplificato](../README.md) per la guida completa, le scorciatoie, i limiti dei dati e lo sviluppo.

## Licenza

Distribuito con [MIT License](../LICENSE). Font, immagini e temi di terze parti mantengono le proprie licenze.
