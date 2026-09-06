<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Logo Flash Note Text">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <strong>Français</strong> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>Un espace de travail texte léger pour uTools : prise de notes, édition Markdown, fichiers encodés et images à partager.</strong></p>
</div>

Flash Note Text est un plugin uTools pour les notes temporaires et la conversion de texte. Il réunit l’édition de texte brut, Markdown et code avec historique, récupération des brouillons, mise en forme, détection d’encodage, partage d’images et IA optionnelle.

## Fonctionnalités

- Modes texte brut, Markdown et code ; le balisage Markdown s’affiche comme source dans sa portée et est rendu à l’extérieur.
- Historique, sauvegarde automatique, récupération, recherche, aperçu, renommage, suppression et réorganisation.
- Nettoyage des retours à la ligne, espaces, échappements, numéros de citation, liens, ponctuation et espaces CJK/latins.
- Sélection automatique ou manuelle du langage avec CodeMirror et Shiki.
- Prise en charge de UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252 et Latin-1.
- Images de notes, de code, Xiaohongshu, Zhihu, WeChat et X.
- Interface en 14 langues, dont le français, l’anglais, le chinois, le japonais, le vietnamien, le coréen, l’espagnol, le portugais, le russe, l’allemand et l’italien.

## Installation et développement

1. Installez et lancez [uTools](https://u.tools/).
2. Téléchargez un paquet depuis [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) ou compilez localement.
3. Chargez le dossier `dist` produit dans les outils de développement uTools.

```powershell
npm install
npm run release:build
```

Consultez le [README en chinois simplifié](../README.md) pour le guide complet, les raccourcis, les limites de données et le développement.

## Licence

Publié sous [MIT License](../LICENSE). Les polices, images et thèmes tiers conservent leurs propres licences.
