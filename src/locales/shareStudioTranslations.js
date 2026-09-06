const fontNames = {
  theme: 'Follow theme',
  'jetbrains-mono': 'JetBrains Mono',
  'geist-mono': 'Geist Mono',
  'ibm-plex-mono': 'IBM Plex Mono',
  'fira-code': 'Fira Code',
  'soehne-mono': 'Söhne Mono'
}

const themeNames = {
  vercel: 'Vercel', rabbit: 'Evil Rabbit', supabase: 'Supabase', tailwind: 'Tailwind', openai: 'OpenAI',
  mintlify: 'Mintlify', prisma: 'Prisma', clerk: 'Clerk', bitmap: 'Bitmap Red', noir: 'Noir',
  ice: 'Crystal Blue', sand: 'Desert Brown', forest: 'Forest Green', mono: 'Monochrome',
  breeze: 'Breeze Purple', candy: 'Candy Pink', crimson: 'Crimson', falcon: 'Falcon Gray',
  meadow: 'Meadow Green', midnight: 'Midnight Blue', raindrop: 'Raindrop Blue', sunset: 'Sunset Orange',
  cherry: 'Cherry Pink', volcano: 'Volcano Red', aurora: 'Aurora Green', amethyst: 'Crystal Purple',
  steel: 'Steel Gray', coffee: 'Coffee Brown', lavender: 'Galaxy Purple'
}

const noteControlLabels = {
  en: { copy: 'Copy image', font: 'Font', fontSize: 'Text size', textAlign: 'Text alignment', titleAlign: 'Title alignment', lineSpacing: 'Line spacing', contentPadding: 'Content padding', aspectRatio: 'Canvas ratio', aspectAuto: 'Adaptive', showTitle: 'Show title', footer: 'Show footer', pageNumber: 'Page number', fonts: { theme: 'Follow template', sans: 'Sans serif', serif: 'Serif', mono: 'Monospace' }, alignments: { left: 'Align left', center: 'Center', right: 'Align right' } },
  'zh-CN': { copy: '复制图片', font: '字体', fontSize: '字号', textAlign: '正文对齐', titleAlign: '标题对齐', lineSpacing: '行距', contentPadding: '内容留白', aspectRatio: '画幅比例', aspectAuto: '自适应', showTitle: '显示标题', footer: '显示页脚', pageNumber: '显示页码', fonts: { theme: '跟随模板', sans: '无衬线', serif: '衬线', mono: '等宽' }, alignments: { left: '左对齐', center: '居中', right: '右对齐' } },
  'zh-HK': { copy: '複製圖片', font: '字型', fontSize: '字號', textAlign: '內文對齊', titleAlign: '標題對齊', lineSpacing: '行距', contentPadding: '內容留白', aspectRatio: '畫幅比例', aspectAuto: '自適應', showTitle: '顯示標題', footer: '顯示頁尾', pageNumber: '顯示頁碼', fonts: { theme: '跟隨範本', sans: '無襯線', serif: '襯線', mono: '等寬' }, alignments: { left: '靠左', center: '置中', right: '靠右' } },
  'zh-TW': { copy: '複製圖片', font: '字型', fontSize: '字級', textAlign: '內文對齊', titleAlign: '標題對齊', lineSpacing: '行距', contentPadding: '內容留白', aspectRatio: '畫幅比例', aspectAuto: '自適應', showTitle: '顯示標題', footer: '顯示頁尾', pageNumber: '顯示頁碼', fonts: { theme: '跟隨範本', sans: '無襯線', serif: '襯線', mono: '等寬' }, alignments: { left: '靠左', center: '置中', right: '靠右' } },
  ja: { copy: '画像をコピー', font: 'フォント', fontSize: '文字サイズ', textAlign: '本文の配置', titleAlign: 'タイトルの配置', lineSpacing: '行間', contentPadding: '本文余白', aspectRatio: '画像比率', aspectAuto: '自動調整', showTitle: 'タイトルを表示', footer: 'フッターを表示', pageNumber: 'ページ番号', fonts: { theme: 'テンプレートに合わせる', sans: 'ゴシック体', serif: '明朝体', mono: '等幅' }, alignments: { left: '左揃え', center: '中央揃え', right: '右揃え' } },
  vi: { copy: 'Sao chép ảnh', font: 'Phông chữ', fontSize: 'Cỡ chữ', textAlign: 'Căn nội dung', titleAlign: 'Căn tiêu đề', lineSpacing: 'Giãn dòng', contentPadding: 'Lề nội dung', aspectRatio: 'Tỷ lệ khung', aspectAuto: 'Tự động', showTitle: 'Hiện tiêu đề', footer: 'Hiện chân trang', pageNumber: 'Số trang', fonts: { theme: 'Theo mẫu', sans: 'Không chân', serif: 'Có chân', mono: 'Đơn cách' }, alignments: { left: 'Căn trái', center: 'Căn giữa', right: 'Căn phải' } },
  ko: { copy: '이미지 복사', font: '글꼴', fontSize: '글자 크기', textAlign: '본문 정렬', titleAlign: '제목 정렬', lineSpacing: '줄 간격', contentPadding: '내용 여백', aspectRatio: '캔버스 비율', aspectAuto: '자동', showTitle: '제목 표시', footer: '바닥글 표시', pageNumber: '페이지 번호', fonts: { theme: '템플릿 따르기', sans: '고딕체', serif: '명조체', mono: '고정폭' }, alignments: { left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬' } },
  es: { copy: 'Copiar imagen', font: 'Fuente', fontSize: 'Tamaño del texto', textAlign: 'Alineación del texto', titleAlign: 'Alineación del título', lineSpacing: 'Interlineado', contentPadding: 'Margen del contenido', aspectRatio: 'Proporción del lienzo', aspectAuto: 'Adaptable', showTitle: 'Mostrar título', footer: 'Mostrar pie', pageNumber: 'Número de página', fonts: { theme: 'Según la plantilla', sans: 'Sin serifas', serif: 'Con serifas', mono: 'Monoespaciada' }, alignments: { left: 'Alinear a la izquierda', center: 'Centrar', right: 'Alinear a la derecha' } },
  fr: { copy: 'Copier l’image', font: 'Police', fontSize: 'Taille du texte', textAlign: 'Alignement du texte', titleAlign: 'Alignement du titre', lineSpacing: 'Interligne', contentPadding: 'Marges du contenu', aspectRatio: 'Proportion du canevas', aspectAuto: 'Adaptatif', showTitle: 'Afficher le titre', footer: 'Afficher le pied de page', pageNumber: 'Numéro de page', fonts: { theme: 'Selon le modèle', sans: 'Sans empattement', serif: 'Avec empattements', mono: 'Chasse fixe' }, alignments: { left: 'Aligner à gauche', center: 'Centrer', right: 'Aligner à droite' } },
  'pt-BR': { copy: 'Copiar imagem', font: 'Fonte', fontSize: 'Tamanho do texto', textAlign: 'Alinhamento do texto', titleAlign: 'Alinhamento do título', lineSpacing: 'Espaçamento entre linhas', contentPadding: 'Margem do conteúdo', aspectRatio: 'Proporção da tela', aspectAuto: 'Adaptável', showTitle: 'Mostrar título', footer: 'Mostrar rodapé', pageNumber: 'Número da página', fonts: { theme: 'Seguir modelo', sans: 'Sem serifa', serif: 'Serifada', mono: 'Monoespaçada' }, alignments: { left: 'Alinhar à esquerda', center: 'Centralizar', right: 'Alinhar à direita' } },
  'pt-PT': { copy: 'Copiar imagem', font: 'Tipo de letra', fontSize: 'Tamanho do texto', textAlign: 'Alinhamento do texto', titleAlign: 'Alinhamento do título', lineSpacing: 'Espaçamento entre linhas', contentPadding: 'Margem do conteúdo', aspectRatio: 'Proporção da tela', aspectAuto: 'Adaptável', showTitle: 'Mostrar título', footer: 'Mostrar rodapé', pageNumber: 'Número da página', fonts: { theme: 'Seguir modelo', sans: 'Sem serifa', serif: 'Serifada', mono: 'Monoespaçada' }, alignments: { left: 'Alinhar à esquerda', center: 'Centrar', right: 'Alinhar à direita' } },
  ru: { copy: 'Копировать изображение', font: 'Шрифт', fontSize: 'Размер текста', textAlign: 'Выравнивание текста', titleAlign: 'Выравнивание заголовка', lineSpacing: 'Межстрочный интервал', contentPadding: 'Поля содержимого', aspectRatio: 'Соотношение сторон', aspectAuto: 'Адаптивное', showTitle: 'Показывать заголовок', footer: 'Показывать нижний колонтитул', pageNumber: 'Номер страницы', fonts: { theme: 'По шаблону', sans: 'Без засечек', serif: 'С засечками', mono: 'Моноширинный' }, alignments: { left: 'По левому краю', center: 'По центру', right: 'По правому краю' } },
  de: { copy: 'Bild kopieren', font: 'Schriftart', fontSize: 'Schriftgröße', textAlign: 'Textausrichtung', titleAlign: 'Titelausrichtung', lineSpacing: 'Zeilenabstand', contentPadding: 'Inhaltsrand', aspectRatio: 'Seitenverhältnis', aspectAuto: 'Adaptiv', showTitle: 'Titel anzeigen', footer: 'Fußzeile anzeigen', pageNumber: 'Seitenzahl', fonts: { theme: 'Wie Vorlage', sans: 'Serifenlos', serif: 'Serifenschrift', mono: 'Festbreite' }, alignments: { left: 'Linksbündig', center: 'Zentriert', right: 'Rechtsbündig' } },
  it: { copy: 'Copia immagine', font: 'Carattere', fontSize: 'Dimensione testo', textAlign: 'Allineamento testo', titleAlign: 'Allineamento titolo', lineSpacing: 'Interlinea', contentPadding: 'Margine del contenuto', aspectRatio: 'Proporzioni tela', aspectAuto: 'Adattabile', showTitle: 'Mostra titolo', footer: 'Mostra piè di pagina', pageNumber: 'Numero di pagina', fonts: { theme: 'Segui modello', sans: 'Senza grazie', serif: 'Con grazie', mono: 'Monospaziato' }, alignments: { left: 'Allinea a sinistra', center: 'Centra', right: 'Allinea a destra' } }
}

const localizedThemes = {
  ja: {
    bitmap: 'ビットマップレッド', noir: 'ノワール', ice: 'クリスタルブルー', sand: 'デザートブラウン',
    forest: 'フォレストグリーン', mono: 'モノクローム', breeze: 'ブリーズパープル', candy: 'キャンディピンク',
    crimson: 'クリムゾン', falcon: 'ファルコングレー', meadow: 'メドウグリーン', midnight: 'ミッドナイトブルー',
    raindrop: 'レインドロップブルー', sunset: 'サンセットオレンジ', cherry: 'チェリーピンク',
    volcano: 'ボルケーノレッド', aurora: 'オーロラグリーン', amethyst: 'アメジスト',
    steel: 'スチールグレー', coffee: 'コーヒーブラウン', lavender: 'ギャラクシーパープル'
  },
  vi: {
    bitmap: 'Đỏ điểm ảnh', noir: 'Đen huyền', ice: 'Xanh pha lê', sand: 'Nâu sa mạc',
    forest: 'Xanh rừng', mono: 'Đơn sắc', breeze: 'Tím gió nhẹ', candy: 'Hồng kẹo',
    crimson: 'Đỏ ráng chiều', falcon: 'Xám cánh ưng', meadow: 'Xanh đồng cỏ', midnight: 'Xanh nửa đêm',
    raindrop: 'Xanh giọt mưa', sunset: 'Cam hoàng hôn', cherry: 'Hồng anh đào',
    volcano: 'Đỏ núi lửa', aurora: 'Xanh cực quang', amethyst: 'Tím thạch anh',
    steel: 'Xám thép', coffee: 'Nâu cà phê', lavender: 'Tím ngân hà'
  },
  ko: {
    bitmap: '비트맵 레드', noir: '느와르 블랙', ice: '크리스털 블루', sand: '데저트 브라운',
    forest: '포레스트 그린', mono: '모노크롬', breeze: '브리즈 퍼플', candy: '캔디 핑크',
    crimson: '크림슨', falcon: '팔콘 그레이', meadow: '메도 그린', midnight: '미드나이트 블루',
    raindrop: '레인드롭 블루', sunset: '선셋 오렌지', cherry: '체리 핑크',
    volcano: '볼케이노 레드', aurora: '오로라 그린', amethyst: '애머시스트',
    steel: '스틸 그레이', coffee: '커피 브라운', lavender: '갤럭시 퍼플'
  },
  es: {
    bitmap: 'Rojo píxel', noir: 'Negro nocturno', ice: 'Azul cristal', sand: 'Marrón desierto',
    forest: 'Verde bosque', mono: 'Monocromo', breeze: 'Violeta brisa', candy: 'Rosa caramelo',
    crimson: 'Carmesí', falcon: 'Gris halcón', meadow: 'Verde pradera', midnight: 'Azul medianoche',
    raindrop: 'Azul lluvia', sunset: 'Naranja atardecer', cherry: 'Rosa cerezo',
    volcano: 'Rojo volcán', aurora: 'Verde aurora', amethyst: 'Amatista',
    steel: 'Gris acero', coffee: 'Marrón café', lavender: 'Violeta galáctico'
  },
  fr: {
    bitmap: 'Rouge pixel', noir: 'Noir nocturne', ice: 'Bleu cristal', sand: 'Brun désert',
    forest: 'Vert forêt', mono: 'Niveaux de gris', breeze: 'Violet brise', candy: 'Rose bonbon',
    crimson: 'Cramoisi', falcon: 'Gris faucon', meadow: 'Vert prairie', midnight: 'Bleu nuit',
    raindrop: 'Bleu pluie', sunset: 'Orange couchant', cherry: 'Rose cerisier',
    volcano: 'Rouge volcan', aurora: 'Vert aurore', amethyst: 'Améthyste',
    steel: 'Gris acier', coffee: 'Brun café', lavender: 'Violet galaxie'
  },
  'pt-BR': {
    bitmap: 'Vermelho pixel', noir: 'Preto noturno', ice: 'Azul cristal', sand: 'Marrom deserto',
    forest: 'Verde floresta', mono: 'Monocromático', breeze: 'Roxo brisa', candy: 'Rosa doce',
    crimson: 'Carmesim', falcon: 'Cinza falcão', meadow: 'Verde campina', midnight: 'Azul meia-noite',
    raindrop: 'Azul chuva', sunset: 'Laranja pôr do sol', cherry: 'Rosa cerejeira',
    volcano: 'Vermelho vulcão', aurora: 'Verde aurora', amethyst: 'Ametista',
    steel: 'Cinza aço', coffee: 'Marrom café', lavender: 'Roxo galáxia'
  },
  'pt-PT': {
    bitmap: 'Vermelho píxel', noir: 'Preto nocturno', ice: 'Azul cristal', sand: 'Castanho deserto',
    forest: 'Verde floresta', mono: 'Monocromático', breeze: 'Roxo brisa', candy: 'Rosa doce',
    crimson: 'Carmesim', falcon: 'Cinzento falcão', meadow: 'Verde campina', midnight: 'Azul meia-noite',
    raindrop: 'Azul chuva', sunset: 'Laranja pôr do sol', cherry: 'Rosa cerejeira',
    volcano: 'Vermelho vulcão', aurora: 'Verde aurora', amethyst: 'Ametista',
    steel: 'Cinzento aço', coffee: 'Castanho café', lavender: 'Roxo galáxia'
  },
  ru: {
    bitmap: 'Пиксельный красный', noir: 'Ночной чёрный', ice: 'Хрустальный синий', sand: 'Пустынный коричневый',
    forest: 'Лесной зелёный', mono: 'Монохром', breeze: 'Лиловый бриз', candy: 'Конфетный розовый',
    crimson: 'Багровый', falcon: 'Соколиный серый', meadow: 'Луговой зелёный', midnight: 'Полуночный синий',
    raindrop: 'Дождевой синий', sunset: 'Закатный оранжевый', cherry: 'Вишнёвый розовый',
    volcano: 'Вулканический красный', aurora: 'Зелёное сияние', amethyst: 'Аметист',
    steel: 'Стальной серый', coffee: 'Кофейный коричневый', lavender: 'Галактический фиолетовый'
  },
  de: {
    bitmap: 'Pixelrot', noir: 'Nachtschwarz', ice: 'Kristallblau', sand: 'Wüstenbraun',
    forest: 'Waldgrün', mono: 'Monochrom', breeze: 'Brisenviolett', candy: 'Bonbonrosa',
    crimson: 'Karmesin', falcon: 'Falkengrau', meadow: 'Wiesengrün', midnight: 'Mitternachtsblau',
    raindrop: 'Regentropfenblau', sunset: 'Sonnenuntergangsorange', cherry: 'Kirschrosa',
    volcano: 'Vulkanrot', aurora: 'Polarlichtgrün', amethyst: 'Amethyst',
    steel: 'Stahlgrau', coffee: 'Kaffeebraun', lavender: 'Galaxieviolett'
  },
  it: {
    bitmap: 'Rosso pixel', noir: 'Nero notturno', ice: 'Blu cristallo', sand: 'Marrone deserto',
    forest: 'Verde foresta', mono: 'Monocromatico', breeze: 'Viola brezza', candy: 'Rosa confetto',
    crimson: 'Cremisi', falcon: 'Grigio falco', meadow: 'Verde prato', midnight: 'Blu mezzanotte',
    raindrop: 'Blu pioggia', sunset: 'Arancione tramonto', cherry: 'Rosa ciliegio',
    volcano: 'Rosso vulcano', aurora: 'Verde aurora', amethyst: 'Ametista',
    steel: 'Grigio acciaio', coffee: 'Marrone caffè', lavender: 'Viola galassia'
  }
}

const en = {
  chooseType: 'Choose an image type', noteImage: 'Note image', codeImage: 'Code screenshot',
  svgFiles: 'SVG images', copied: 'Image copied', copyFailed: 'Could not copy the image',
  note: {
    ...noteControlLabels.en,
    windowTitle: 'Note image', title: 'Title', optionalTitle: 'Optional', content: 'Content', template: 'Template',
    previousPage: 'Previous page', nextPage: 'Next page', export: 'Export PNG',
    pageHint: '{template}, {count} page(s)'
  },
  code: {
    title: 'Code screenshot', filename: 'File name', theme: 'Theme', presetThemes: 'Brand presets',
    colorThemes: 'Color themes', background: 'Show background', darkMode: 'Dark mode',
    lineNumbers: 'Show line numbers', padding: 'Outer padding', font: 'Font', language: 'Language',
    autoLanguage: 'Detect automatically', plainText: 'Plain text', width: 'Canvas width',
    scale: 'Export scale', exportPng: 'Save PNG', copyPng: 'Copy PNG', exportSvg: 'Save SVG',
    resize: 'Resize canvas', format: 'Format code', formatted: 'Code formatted',
    formatFailed: 'Could not format the code', formatUnsupported: 'This language cannot be formatted',
    fonts: fontNames, themes: themeNames
  }
}

export default {
  'zh-CN': {
    chooseType: '选择类型', noteImage: '便签图片', codeImage: '代码截图',
    svgFiles: 'SVG 图片', copied: '图片已复制', copyFailed: '复制图片失败',
    note: {
      ...noteControlLabels['zh-CN'],
      windowTitle: '便签图片', title: '标题', optionalTitle: '可选', content: '内容', template: '图片模板',
      previousPage: '上一页', nextPage: '下一页', export: '导出 PNG',
      pageHint: '{template}，共 {count} 页'
    },
    code: {
      title: '代码截图', filename: '文件名', theme: '主题', presetThemes: '品牌预设',
      colorThemes: '配色主题', background: '显示背景', darkMode: '深色模式',
      lineNumbers: '显示行号', padding: '外边距', font: '字体', language: '代码语言',
      autoLanguage: '自动识别', plainText: '纯文本', width: '画布宽度',
      scale: '导出倍率', exportPng: '保存 PNG', copyPng: '复制 PNG', exportSvg: '保存 SVG',
      resize: '调整画布宽度', format: '格式化代码', formatted: '代码格式化完成',
      formatFailed: '代码格式化失败', formatUnsupported: '当前语言不支持格式化',
      fonts: { ...fontNames, theme: '跟随主题' },
      themes: {
        ...themeNames, bitmap: '位图红', noir: '暗夜黑', ice: '冰晶蓝', sand: '沙漠褐', forest: '森林绿',
        mono: '素墨灰', breeze: '微风紫', candy: '糖果粉', crimson: '绯霞红', falcon: '鹰羽灰',
        meadow: '草原绿', midnight: '午夜蓝', raindrop: '雨滴蓝', sunset: '落日橙', cherry: '樱花粉',
        volcano: '火山红', aurora: '极光绿', amethyst: '水晶紫', steel: '钢铁灰', coffee: '咖啡棕', lavender: '星河紫'
      }
    }
  },
  'zh-HK': {
    chooseType: '選擇分享圖片類型', noteImage: '便箋圖片', codeImage: '程式碼截圖',
    svgFiles: 'SVG 圖片', copied: '圖片已複製', copyFailed: '無法複製圖片',
    note: { ...noteControlLabels['zh-HK'], windowTitle: '便箋圖片', title: '標題', optionalTitle: '選填', content: '內容', template: '圖片範本', previousPage: '上一頁', nextPage: '下一頁', export: '匯出 PNG', pageHint: '{template}，共 {count} 頁' },
    code: {
      title: '程式碼截圖', filename: '檔案名稱', theme: '主題', presetThemes: '品牌預設', colorThemes: '配色主題',
      background: '顯示背景', darkMode: '深色模式', lineNumbers: '顯示行號', padding: '外邊距', font: '字型',
      language: '程式語言', autoLanguage: '自動辨識', plainText: '純文字', width: '畫布寬度', scale: '匯出倍率',
      exportPng: '儲存 PNG', copyPng: '複製 PNG', exportSvg: '儲存 SVG', resize: '調整畫布寬度', format: '格式化程式碼', formatted: '程式碼格式化完成', formatFailed: '無法格式化程式碼', formatUnsupported: '此語言不支援格式化',
      fonts: { ...fontNames, theme: '跟隨主題' },
      themes: { ...themeNames, bitmap: '點陣紅', noir: '暗夜黑', ice: '冰晶藍', sand: '沙漠褐', forest: '森林綠', mono: '素墨灰', breeze: '微風紫', candy: '糖果粉', crimson: '緋霞紅', falcon: '鷹羽灰', meadow: '草原綠', midnight: '午夜藍', raindrop: '雨滴藍', sunset: '落日橙', cherry: '櫻花粉', volcano: '火山紅', aurora: '極光綠', amethyst: '水晶紫', steel: '鋼鐵灰', coffee: '咖啡棕', lavender: '星河紫' }
    }
  },
  'zh-TW': {
    chooseType: '選擇分享圖片類型', noteImage: '便箋圖片', codeImage: '程式碼截圖',
    svgFiles: 'SVG 圖片', copied: '圖片已複製', copyFailed: '無法複製圖片',
    note: { ...noteControlLabels['zh-TW'], windowTitle: '便箋圖片', title: '標題', optionalTitle: '選填', content: '內容', template: '圖片範本', previousPage: '上一頁', nextPage: '下一頁', export: '匯出 PNG', pageHint: '{template}，共 {count} 頁' },
    code: {
      title: '程式碼截圖', filename: '檔案名稱', theme: '主題', presetThemes: '品牌預設', colorThemes: '配色主題',
      background: '顯示背景', darkMode: '深色模式', lineNumbers: '顯示行號', padding: '外邊距', font: '字型',
      language: '程式語言', autoLanguage: '自動偵測', plainText: '純文字', width: '畫布寬度', scale: '匯出倍率',
      exportPng: '儲存 PNG', copyPng: '複製 PNG', exportSvg: '儲存 SVG', resize: '調整畫布寬度', format: '格式化程式碼', formatted: '程式碼格式化完成', formatFailed: '無法格式化程式碼', formatUnsupported: '此語言不支援格式化',
      fonts: { ...fontNames, theme: '跟隨主題' },
      themes: { ...themeNames, bitmap: '點陣紅', noir: '暗夜黑', ice: '冰晶藍', sand: '沙漠褐', forest: '森林綠', mono: '素墨灰', breeze: '微風紫', candy: '糖果粉', crimson: '緋霞紅', falcon: '鷹羽灰', meadow: '草原綠', midnight: '午夜藍', raindrop: '雨滴藍', sunset: '落日橙', cherry: '櫻花粉', volcano: '火山紅', aurora: '極光綠', amethyst: '水晶紫', steel: '鋼鐵灰', coffee: '咖啡棕', lavender: '星河紫' }
    }
  },
  en,
  ja: {
    chooseType: '共有画像の種類を選択', noteImage: 'ノート画像', codeImage: 'コード画像',
    svgFiles: 'SVG 画像', copied: '画像をコピーしました', copyFailed: '画像をコピーできませんでした',
    note: { ...noteControlLabels.ja, windowTitle: 'ノート画像', title: 'タイトル', optionalTitle: '任意', content: '内容', template: 'テンプレート', previousPage: '前のページ', nextPage: '次のページ', export: 'PNG を書き出す', pageHint: '{template}、全 {count} ページ' },
    code: {
      title: 'コード画像', filename: 'ファイル名', theme: 'テーマ', presetThemes: 'ブランドプリセット', colorThemes: 'カラーテーマ',
      background: '背景を表示', darkMode: 'ダークモード', lineNumbers: '行番号を表示', padding: '外側の余白', font: 'フォント',
      language: '言語', autoLanguage: '自動判定', plainText: 'プレーンテキスト', width: 'キャンバス幅', scale: '書き出し倍率',
      exportPng: 'PNG を保存', copyPng: 'PNG をコピー', exportSvg: 'SVG を保存', resize: 'キャンバス幅を変更', format: 'コードを整形', formatted: 'コードを整形しました', formatFailed: 'コードを整形できませんでした', formatUnsupported: 'この言語は整形できません',
      fonts: { ...fontNames, theme: 'テーマに合わせる' }, themes: { ...themeNames, ...localizedThemes.ja }
    }
  },
  vi: {
    chooseType: 'Chọn loại ảnh chia sẻ', noteImage: 'Ảnh ghi chú', codeImage: 'Ảnh chụp mã',
    svgFiles: 'Ảnh SVG', copied: 'Đã sao chép ảnh', copyFailed: 'Không thể sao chép ảnh',
    note: { ...noteControlLabels.vi, windowTitle: 'Ảnh ghi chú', title: 'Tiêu đề', optionalTitle: 'Không bắt buộc', content: 'Nội dung', template: 'Mẫu', previousPage: 'Trang trước', nextPage: 'Trang sau', export: 'Xuất PNG', pageHint: '{template}, {count} trang' },
    code: {
      title: 'Ảnh chụp mã', filename: 'Tên tệp', theme: 'Chủ đề', presetThemes: 'Mẫu thương hiệu', colorThemes: 'Chủ đề màu',
      background: 'Hiện nền', darkMode: 'Chế độ tối', lineNumbers: 'Hiện số dòng', padding: 'Lề ngoài', font: 'Phông chữ',
      language: 'Ngôn ngữ', autoLanguage: 'Tự động nhận diện', plainText: 'Văn bản thuần', width: 'Chiều rộng khung',
      scale: 'Tỷ lệ xuất', exportPng: 'Lưu PNG', copyPng: 'Sao chép PNG', exportSvg: 'Lưu SVG', resize: 'Đổi chiều rộng khung', format: 'Định dạng mã', formatted: 'Đã định dạng mã', formatFailed: 'Không thể định dạng mã', formatUnsupported: 'Ngôn ngữ này không hỗ trợ định dạng',
      fonts: { ...fontNames, theme: 'Theo chủ đề' }, themes: { ...themeNames, ...localizedThemes.vi }
    }
  },
  ko: {
    chooseType: '공유 이미지 종류 선택', noteImage: '메모 이미지', codeImage: '코드 스크린샷',
    svgFiles: 'SVG 이미지', copied: '이미지를 복사했습니다', copyFailed: '이미지를 복사하지 못했습니다',
    note: { ...noteControlLabels.ko, windowTitle: '메모 이미지', title: '제목', optionalTitle: '선택 사항', content: '내용', template: '템플릿', previousPage: '이전 페이지', nextPage: '다음 페이지', export: 'PNG 내보내기', pageHint: '{template}, 총 {count}페이지' },
    code: {
      title: '코드 스크린샷', filename: '파일 이름', theme: '테마', presetThemes: '브랜드 프리셋', colorThemes: '색상 테마',
      background: '배경 표시', darkMode: '다크 모드', lineNumbers: '줄 번호 표시', padding: '바깥 여백', font: '글꼴',
      language: '언어', autoLanguage: '자동 감지', plainText: '일반 텍스트', width: '캔버스 너비', scale: '내보내기 배율',
      exportPng: 'PNG 저장', copyPng: 'PNG 복사', exportSvg: 'SVG 저장', resize: '캔버스 너비 조절', format: '코드 서식 지정', formatted: '코드 서식을 지정했습니다', formatFailed: '코드 서식을 지정하지 못했습니다', formatUnsupported: '이 언어는 서식을 지정할 수 없습니다',
      fonts: { ...fontNames, theme: '테마에 맞춤' }, themes: { ...themeNames, ...localizedThemes.ko }
    }
  },
  es: {
    chooseType: 'Elegir tipo de imagen', noteImage: 'Imagen de nota', codeImage: 'Captura de código',
    svgFiles: 'Imágenes SVG', copied: 'Imagen copiada', copyFailed: 'No se pudo copiar la imagen',
    note: { ...noteControlLabels.es, windowTitle: 'Imagen de nota', title: 'Título', optionalTitle: 'Opcional', content: 'Contenido', template: 'Plantilla', previousPage: 'Página anterior', nextPage: 'Página siguiente', export: 'Exportar PNG', pageHint: '{template}, {count} página(s)' },
    code: {
      title: 'Captura de código', filename: 'Nombre del archivo', theme: 'Tema', presetThemes: 'Preajustes de marca', colorThemes: 'Temas de color',
      background: 'Mostrar fondo', darkMode: 'Modo oscuro', lineNumbers: 'Mostrar números de línea', padding: 'Margen exterior', font: 'Fuente',
      language: 'Lenguaje', autoLanguage: 'Detectar automáticamente', plainText: 'Texto sin formato', width: 'Ancho del lienzo', scale: 'Escala de exportación',
      exportPng: 'Guardar PNG', copyPng: 'Copiar PNG', exportSvg: 'Guardar SVG', resize: 'Ajustar ancho del lienzo', format: 'Formatear código', formatted: 'Código formateado', formatFailed: 'No se pudo formatear el código', formatUnsupported: 'Este lenguaje no admite formato',
      fonts: { ...fontNames, theme: 'Seguir el tema' }, themes: { ...themeNames, ...localizedThemes.es }
    }
  },
  fr: {
    chooseType: 'Choisir le type d’image', noteImage: 'Image de note', codeImage: 'Capture de code',
    svgFiles: 'Images SVG', copied: 'Image copiée', copyFailed: 'Impossible de copier l’image',
    note: { ...noteControlLabels.fr, windowTitle: 'Image de note', title: 'Titre', optionalTitle: 'Facultatif', content: 'Contenu', template: 'Modèle', previousPage: 'Page précédente', nextPage: 'Page suivante', export: 'Exporter en PNG', pageHint: 'Modèle {template}, pages : {count}' },
    code: {
      title: 'Capture de code', filename: 'Nom du fichier', theme: 'Thème', presetThemes: 'Préréglages de marque', colorThemes: 'Thèmes colorés',
      background: 'Afficher l’arrière-plan', darkMode: 'Mode sombre', lineNumbers: 'Afficher les numéros de ligne', padding: 'Marge extérieure', font: 'Police',
      language: 'Langage', autoLanguage: 'Détection automatique', plainText: 'Texte brut', width: 'Largeur du canevas', scale: 'Échelle d’exportation',
      exportPng: 'Enregistrer le PNG', copyPng: 'Copier le PNG', exportSvg: 'Enregistrer le SVG', resize: 'Redimensionner le canevas', format: 'Mettre le code en forme', formatted: 'Code mis en forme', formatFailed: 'Impossible de mettre le code en forme', formatUnsupported: 'Ce langage ne peut pas être mis en forme',
      fonts: { ...fontNames, theme: 'Suivre le thème' }, themes: { ...themeNames, ...localizedThemes.fr }
    }
  },
  'pt-BR': {
    chooseType: 'Escolher o tipo de imagem', noteImage: 'Imagem de nota', codeImage: 'Captura de código',
    svgFiles: 'Imagens SVG', copied: 'Imagem copiada', copyFailed: 'Não foi possível copiar a imagem',
    note: { ...noteControlLabels['pt-BR'], windowTitle: 'Imagem de nota', title: 'Título', optionalTitle: 'Opcional', content: 'Conteúdo', template: 'Modelo', previousPage: 'Página anterior', nextPage: 'Próxima página', export: 'Exportar PNG', pageHint: '{template}, {count} página(s)' },
    code: {
      title: 'Captura de código', filename: 'Nome do arquivo', theme: 'Tema', presetThemes: 'Predefinições de marca', colorThemes: 'Temas de cores',
      background: 'Mostrar fundo', darkMode: 'Modo escuro', lineNumbers: 'Mostrar números de linha', padding: 'Margem externa', font: 'Fonte',
      language: 'Linguagem', autoLanguage: 'Detectar automaticamente', plainText: 'Texto simples', width: 'Largura da tela', scale: 'Escala de exportação',
      exportPng: 'Salvar PNG', copyPng: 'Copiar PNG', exportSvg: 'Salvar SVG', resize: 'Redimensionar a tela', format: 'Formatar código', formatted: 'Código formatado', formatFailed: 'Não foi possível formatar o código', formatUnsupported: 'Esta linguagem não pode ser formatada',
      fonts: { ...fontNames, theme: 'Seguir o tema' }, themes: { ...themeNames, ...localizedThemes['pt-BR'] }
    }
  },
  'pt-PT': {
    chooseType: 'Escolher o tipo de imagem', noteImage: 'Imagem de nota', codeImage: 'Captura de código',
    svgFiles: 'Imagens SVG', copied: 'Imagem copiada', copyFailed: 'Não foi possível copiar a imagem',
    note: { ...noteControlLabels['pt-PT'], windowTitle: 'Imagem de nota', title: 'Título', optionalTitle: 'Opcional', content: 'Conteúdo', template: 'Modelo', previousPage: 'Página anterior', nextPage: 'Página seguinte', export: 'Exportar PNG', pageHint: '{template}, {count} página(s)' },
    code: {
      title: 'Captura de código', filename: 'Nome do ficheiro', theme: 'Tema', presetThemes: 'Predefinições de marca', colorThemes: 'Temas de cores',
      background: 'Mostrar fundo', darkMode: 'Modo escuro', lineNumbers: 'Mostrar números de linha', padding: 'Margem exterior', font: 'Tipo de letra',
      language: 'Linguagem', autoLanguage: 'Detetar automaticamente', plainText: 'Texto simples', width: 'Largura da tela', scale: 'Escala de exportação',
      exportPng: 'Guardar PNG', copyPng: 'Copiar PNG', exportSvg: 'Guardar SVG', resize: 'Redimensionar a tela', format: 'Formatar código', formatted: 'Código formatado', formatFailed: 'Não foi possível formatar o código', formatUnsupported: 'Esta linguagem não pode ser formatada',
      fonts: { ...fontNames, theme: 'Seguir o tema' }, themes: { ...themeNames, ...localizedThemes['pt-PT'] }
    }
  },
  ru: {
    chooseType: 'Выберите тип изображения', noteImage: 'Изображение заметки', codeImage: 'Снимок кода',
    svgFiles: 'Изображения SVG', copied: 'Изображение скопировано', copyFailed: 'Не удалось скопировать изображение',
    note: { ...noteControlLabels.ru, windowTitle: 'Изображение заметки', title: 'Заголовок', optionalTitle: 'Необязательно', content: 'Содержимое', template: 'Шаблон', previousPage: 'Предыдущая страница', nextPage: 'Следующая страница', export: 'Экспорт PNG', pageHint: '{template}, стр.: {count}' },
    code: {
      title: 'Снимок кода', filename: 'Имя файла', theme: 'Тема', presetThemes: 'Фирменные шаблоны', colorThemes: 'Цветовые темы',
      background: 'Показывать фон', darkMode: 'Тёмный режим', lineNumbers: 'Показывать номера строк', padding: 'Внешний отступ', font: 'Шрифт',
      language: 'Язык', autoLanguage: 'Определять автоматически', plainText: 'Обычный текст', width: 'Ширина холста', scale: 'Масштаб экспорта',
      exportPng: 'Сохранить PNG', copyPng: 'Копировать PNG', exportSvg: 'Сохранить SVG', resize: 'Изменить ширину холста', format: 'Форматировать код', formatted: 'Код отформатирован', formatFailed: 'Не удалось отформатировать код', formatUnsupported: 'Этот язык нельзя форматировать',
      fonts: { ...fontNames, theme: 'По теме' }, themes: { ...themeNames, ...localizedThemes.ru }
    }
  },
  de: {
    chooseType: 'Bildtyp auswählen', noteImage: 'Notizbild', codeImage: 'Code-Screenshot',
    svgFiles: 'SVG-Bilder', copied: 'Bild kopiert', copyFailed: 'Bild konnte nicht kopiert werden',
    note: { ...noteControlLabels.de, windowTitle: 'Notizbild', title: 'Titel', optionalTitle: 'Wahlweise', content: 'Inhalt', template: 'Vorlage', previousPage: 'Vorherige Seite', nextPage: 'Nächste Seite', export: 'PNG exportieren', pageHint: '{template}, {count} Seite(n)' },
    code: {
      title: 'Code-Screenshot', filename: 'Dateiname', theme: 'Design', presetThemes: 'Markenvorlagen', colorThemes: 'Farbdesigns',
      background: 'Hintergrund anzeigen', darkMode: 'Dunkler Modus', lineNumbers: 'Zeilennummern anzeigen', padding: 'Außenabstand', font: 'Schriftart',
      language: 'Sprache', autoLanguage: 'Automatisch erkennen', plainText: 'Nur Text', width: 'Leinwandbreite', scale: 'Exportskalierung',
      exportPng: 'PNG speichern', copyPng: 'PNG kopieren', exportSvg: 'SVG speichern', resize: 'Leinwandbreite ändern', format: 'Code formatieren', formatted: 'Code formatiert', formatFailed: 'Code konnte nicht formatiert werden', formatUnsupported: 'Diese Sprache kann nicht formatiert werden',
      fonts: { ...fontNames, theme: 'Dem Design folgen' }, themes: { ...themeNames, ...localizedThemes.de }
    }
  },
  it: {
    chooseType: 'Scegliere il tipo di immagine', noteImage: 'Immagine nota', codeImage: 'Schermata del codice',
    svgFiles: 'Immagini SVG', copied: 'Immagine copiata', copyFailed: 'Impossibile copiare l’immagine',
    note: { ...noteControlLabels.it, windowTitle: 'Immagine nota', title: 'Titolo', optionalTitle: 'Facoltativo', content: 'Contenuto', template: 'Modello', previousPage: 'Pagina precedente', nextPage: 'Pagina successiva', export: 'Esporta PNG', pageHint: '{template}, {count} pagina/e' },
    code: {
      title: 'Schermata del codice', filename: 'Nome file', theme: 'Tema', presetThemes: 'Preimpostazioni del marchio', colorThemes: 'Temi colore',
      background: 'Mostra sfondo', darkMode: 'Modalità scura', lineNumbers: 'Mostra numeri di riga', padding: 'Margine esterno', font: 'Carattere',
      language: 'Linguaggio', autoLanguage: 'Rileva automaticamente', plainText: 'Testo normale', width: 'Larghezza area', scale: 'Scala di esportazione',
      exportPng: 'Salva PNG', copyPng: 'Copia PNG', exportSvg: 'Salva SVG', resize: 'Ridimensiona area', format: 'Formatta codice', formatted: 'Codice formattato', formatFailed: 'Impossibile formattare il codice', formatUnsupported: 'Questo linguaggio non può essere formattato',
      fonts: { ...fontNames, theme: 'Segui il tema' }, themes: { ...themeNames, ...localizedThemes.it }
    }
  }
}
