<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Flash Note Text 로고">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <a href="./README.vi.md">Tiếng Việt</a> · <strong>한국어</strong> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>uTools를 위한 가벼운 텍스트 작업 공간: 빠른 기록, Markdown 편집, 다양한 인코딩 파일 열기, 공유 이미지 만들기를 지원합니다.</strong></p>
</div>

Flash Note Text는 임시 메모와 텍스트 변환을 위한 uTools 플러그인입니다. 일반 텍스트, Markdown, 코드 편집을 기록, 초안 복구, 텍스트 정리, 인코딩 감지, 이미지 공유 및 선택적 AI 기능과 함께 제공합니다.

## 주요 기능

- 일반 텍스트, Markdown, 코드 모드. Markdown 마크업 안에서는 소스가 보이고 밖에서는 렌더링됩니다.
- 기록, 자동 저장, 초안 복구, 검색, 미리보기, 이름 변경, 삭제, 순서 변경.
- 줄바꿈, 공백, 이스케이프, 인용 번호, 링크, 문장 부호와 CJK/라틴 문자 간격 정리.
- CodeMirror와 Shiki를 이용한 코드 언어 자동 또는 수동 선택 및 구문 강조.
- UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252, Latin-1 지원.
- 메모, 코드, Xiaohongshu, Zhihu, WeChat, X 공유 이미지 제작.
- 중국어, 영어, 일본어, 베트남어, 한국어, 스페인어, 프랑스어, 포르투갈어, 러시아어, 독일어, 이탈리아어 등 14개 UI 언어.

## 설치 및 개발

1. [uTools](https://u.tools/)를 설치하고 실행합니다.
2. [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases)에서 받거나 직접 빌드합니다.
3. uTools 개발자 도구에서 생성된 `dist` 폴더를 불러옵니다.

```powershell
npm install
npm run release:build
```

전체 사용법, 단축키, 데이터 경계와 개발 안내는 [중국어 간체 README](../README.md)를 참고하세요.

## 라이선스

[MIT License](../LICENSE)로 배포됩니다. 타사 글꼴, 이미지, 테마는 각자의 라이선스를 따릅니다.
