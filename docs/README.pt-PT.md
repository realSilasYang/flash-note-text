<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Logótipo do Flash Note Text">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <strong>Português (Portugal)</strong> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>Um espaço de trabalho de texto leve para o uTools: notas rápidas, edição Markdown, ficheiros com várias codificações e imagens para partilhar.</strong></p>
</div>

Flash Note Text é um plugin do uTools para notas temporárias e conversão de texto. Reúne a edição de texto simples, Markdown e código com histórico, recuperação de rascunhos, formatação, deteção de codificação, partilha de imagens e IA opcional.

## Apoiar o projeto

Se o Flash Note Text lhe poupa tempo ao registar, formatar ou partilhar texto, pode apoiar o autor através dos códigos QR abaixo. Escolha um método de pagamento:

<p align="center">
  <img src="../public/donate/wechat-pay.png" width="220" alt="Código QR para doação via WeChat Pay">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="../public/donate/alipay.png" width="220" alt="Código QR para doação via Alipay">
</p>

## Funcionalidades

- Modos de texto simples, Markdown e código; mostra o código-fonte dentro da marcação Markdown e o resultado renderizado fora dela.
- Histórico, gravação automática, recuperação de rascunhos, pesquisa, pré-visualização, renomeação, eliminação e ordenação.
- Limpeza de quebras de linha, espaços, escapes, números de citação, ligações, pontuação e espaçamento CJK/latino.
- Seleção automática ou manual da linguagem de código com CodeMirror e Shiki.
- Suporte para UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252 e Latin-1.
- Imagens de notas, código, Xiaohongshu, Zhihu, WeChat e X.
- Interface em 14 idiomas, incluindo português, inglês, chinês, japonês, vietnamita, coreano, espanhol, francês, russo, alemão e italiano.

## Instalação e desenvolvimento

1. Instale e abra o [uTools](https://u.tools/).
2. Instale diretamente a partir da [página do plugin uTools](https://www.u-tools.cn/plugins/detail/%E9%97%AA%E5%BF%B5%E6%96%87%E6%9C%AC/), transfira um pacote de [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) ou compile localmente.
3. Carregue a pasta `dist` gerada nas ferramentas de desenvolvimento do uTools.

```powershell
npm install
npm run release:build
```

Consulte o [README em chinês simplificado](../README.md) para o guia completo, atalhos, limites de dados e desenvolvimento.

## Licença

Publicado sob a [MIT License](../LICENSE). Tipos de letra, imagens e temas de terceiros mantêm as suas próprias licenças.
