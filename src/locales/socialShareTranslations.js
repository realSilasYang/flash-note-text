const en = {
  xImage: 'Twitter card',
  zhihuImage: 'Zhihu image',
  wechatImage: 'WeChat article image',
  social: {
    export: 'Save PNG',
    copy: 'Copy image',
    displayName: 'Display name',
    handle: 'Handle',
    likes: 'Engagement',
    source: 'Source',
    author: 'Author',
    articleTitle: 'Footer title',
    link: 'QR code link',
    theme: 'Color theme',
    assets: 'Images',
    avatar: 'Avatar',
    qrImage: 'Image',
    reset: 'Reset',
    blackText: 'Solid black text range',
    xTitle: 'Twitter card',
    zhihuTitle: 'Zhihu image',
    wechatTitle: 'WeChat article image'
  }
}

const zhCN = {
  xImage: 'X 分享图片',
  zhihuImage: '知乎分享图片',
  wechatImage: '微信公众号图片',
  social: {
    export: '保存 PNG',
    copy: '复制图片',
    displayName: '显示名称',
    handle: '账号',
    likes: '互动数据',
    source: '来源',
    author: '作者',
    articleTitle: '页脚标题',
    link: '二维码链接',
    theme: '配色',
    assets: '图片',
    avatar: '头像',
    qrImage: '图片',
    reset: '重置',
    blackText: '选择清晰显示文本范围',
    xTitle: 'X 分享图片',
    zhihuTitle: '知乎分享图片',
    wechatTitle: '微信公众号图片'
  }
}

const zhHK = {
  ...zhCN,
  xImage: 'X 分享圖片',
  zhihuImage: '知乎分享圖片',
  wechatImage: '微信公眾號圖片',
  social: { ...zhCN.social, export: '儲存 PNG', copy: '複製圖片', displayName: '顯示名稱', handle: '帳號', source: '來源', author: '作者', articleTitle: '頁尾標題', link: '二維碼連結', theme: '配色', assets: '圖片', avatar: '頭像', qrImage: '圖片', reset: '重設', blackText: '純黑文字範圍', xTitle: 'X 分享圖片', zhihuTitle: '知乎分享圖片', wechatTitle: '微信公眾號圖片' }
}

const zhTW = {
  ...zhHK,
  wechatImage: '微信公眾號圖片',
  social: { ...zhHK.social, handle: '帳號', link: 'QR Code 連結', qrImage: '圖片' }
}

const ja = {
  xImage: 'Twitter 共有画像',
  zhihuImage: '知乎共有画像',
  wechatImage: 'WeChat 公式アカウント画像',
  social: {
    export: 'PNG を保存', copy: '画像をコピー', displayName: '表示名', handle: 'アカウント', likes: '反応数', source: '出典',
    author: '著者', articleTitle: 'フッタータイトル', link: 'QR コードのリンク', theme: '配色', assets: '画像', avatar: 'アバター',
    qrImage: '画像', reset: 'リセット', blackText: '黒字にする範囲', xTitle: 'Twitter 共有画像', zhihuTitle: '知乎共有画像', wechatTitle: 'WeChat 公式アカウント画像'
  }
}

const vi = {
  xImage: 'Ảnh chia sẻ Twitter', zhihuImage: 'Ảnh chia sẻ Zhihu', wechatImage: 'Ảnh tài khoản công khai WeChat',
  social: {
    export: 'Lưu PNG', copy: 'Sao chép ảnh', displayName: 'Tên hiển thị', handle: 'Tài khoản', likes: 'Lượt tương tác', source: 'Nguồn',
    author: 'Tác giả', articleTitle: 'Tiêu đề chân trang', link: 'Liên kết mã QR', theme: 'Phối màu', assets: 'Hình ảnh', avatar: 'Ảnh đại diện',
    qrImage: 'Hình ảnh', reset: 'Đặt lại', blackText: 'Phạm vi chữ màu đen', xTitle: 'Ảnh chia sẻ Twitter', zhihuTitle: 'Ảnh chia sẻ Zhihu', wechatTitle: 'Ảnh tài khoản công khai WeChat'
  }
}

const ko = {
  xImage: 'Twitter 공유 이미지', zhihuImage: 'Zhihu 공유 이미지', wechatImage: 'WeChat 공식 계정 이미지',
  social: {
    export: 'PNG 저장', copy: '이미지 복사', displayName: '표시 이름', handle: '계정', likes: '반응 수', source: '출처',
    author: '작성자', articleTitle: '바닥글 제목', link: 'QR 코드 링크', theme: '색상', assets: '이미지', avatar: '프로필 이미지',
    qrImage: '이미지', reset: '재설정', blackText: '검은색 텍스트 범위', xTitle: 'Twitter 공유 이미지', zhihuTitle: 'Zhihu 공유 이미지', wechatTitle: 'WeChat 공식 계정 이미지'
  }
}

const es = {
  xImage: 'Imagen para Twitter', zhihuImage: 'Imagen para Zhihu', wechatImage: 'Imagen de cuenta oficial de WeChat',
  social: {
    export: 'Guardar PNG', copy: 'Copiar imagen', displayName: 'Nombre visible', handle: 'Cuenta', likes: 'Interacciones', source: 'Fuente',
    author: 'Autor', articleTitle: 'Título del pie', link: 'Enlace del código QR', theme: 'Colores', assets: 'Imágenes', avatar: 'Foto de perfil',
    qrImage: 'Imagen', reset: 'Restablecer', blackText: 'Rango de texto negro', xTitle: 'Imagen para Twitter', zhihuTitle: 'Imagen para Zhihu', wechatTitle: 'Imagen de cuenta oficial de WeChat'
  }
}

const fr = {
  xImage: 'Image pour Twitter', zhihuImage: 'Image pour Zhihu', wechatImage: 'Image de compte officiel WeChat',
  social: {
    export: 'Enregistrer le PNG', copy: 'Copier l’image', displayName: 'Nom affiché', handle: 'Compte', likes: 'Interactions', source: 'Provenance',
    author: 'Auteur', articleTitle: 'Titre du pied de page', link: 'Lien du code QR', theme: 'Couleurs', assets: 'Fichiers image', avatar: 'Photo de profil',
    qrImage: 'Image', reset: 'Réinitialiser', blackText: 'Plage de texte noir', xTitle: 'Image pour Twitter', zhihuTitle: 'Image pour Zhihu', wechatTitle: 'Image de compte officiel WeChat'
  }
}

const ptBR = {
  xImage: 'Imagem para Twitter', zhihuImage: 'Imagem para Zhihu', wechatImage: 'Imagem de conta oficial do WeChat',
  social: {
    export: 'Salvar PNG', copy: 'Copiar imagem', displayName: 'Nome de exibição', handle: 'Conta', likes: 'Interações', source: 'Origem',
    author: 'Autor', articleTitle: 'Título do rodapé', link: 'Link do código QR', theme: 'Cores', assets: 'Imagens', avatar: 'Foto de perfil',
    qrImage: 'Imagem', reset: 'Redefinir', blackText: 'Intervalo de texto preto', xTitle: 'Imagem para Twitter', zhihuTitle: 'Imagem para Zhihu', wechatTitle: 'Imagem de conta oficial do WeChat'
  }
}

const ptPT = {
  ...ptBR,
  social: { ...ptBR.social, export: 'Guardar PNG', displayName: 'Nome apresentado', source: 'Fonte', reset: 'Repor' }
}

const ru = {
  xImage: 'Изображение для Twitter', zhihuImage: 'Изображение для Zhihu', wechatImage: 'Изображение официального аккаунта WeChat',
  social: {
    export: 'Сохранить PNG', copy: 'Копировать изображение', displayName: 'Отображаемое имя', handle: 'Аккаунт', likes: 'Реакции', source: 'Источник',
    author: 'Автор', articleTitle: 'Заголовок внизу', link: 'Ссылка QR-кода', theme: 'Цветовая схема', assets: 'Изображения', avatar: 'Аватар',
    qrImage: 'Изображение', reset: 'Сбросить', blackText: 'Диапазон чёрного текста', xTitle: 'Изображение для Twitter', zhihuTitle: 'Изображение для Zhihu', wechatTitle: 'Изображение официального аккаунта WeChat'
  }
}

const de = {
  xImage: 'Bild für Twitter', zhihuImage: 'Bild für Zhihu', wechatImage: 'Bild für ein offizielles WeChat-Konto',
  social: {
    export: 'PNG speichern', copy: 'Bild kopieren', displayName: 'Anzeigename', handle: 'Konto', likes: 'Interaktionen', source: 'Quelle',
    author: 'Autor', articleTitle: 'Fußzeilentitel', link: 'QR-Code-Link', theme: 'Farben', assets: 'Bilder', avatar: 'Profilbild',
    qrImage: 'Bild', reset: 'Zurücksetzen', blackText: 'Bereich mit schwarzem Text', xTitle: 'Bild für Twitter', zhihuTitle: 'Bild für Zhihu', wechatTitle: 'Bild für ein offizielles WeChat-Konto'
  }
}

const it = {
  xImage: 'Immagine per Twitter', zhihuImage: 'Immagine per Zhihu', wechatImage: 'Immagine dell’account ufficiale WeChat',
  social: {
    export: 'Salva PNG', copy: 'Copia immagine', displayName: 'Nome visualizzato', handle: 'Account', likes: 'Interazioni', source: 'Fonte',
    author: 'Autore', articleTitle: 'Titolo a piè di pagina', link: 'Collegamento del codice QR', theme: 'Colori', assets: 'Immagini', avatar: 'Immagine del profilo',
    qrImage: 'Immagine', reset: 'Reimposta', blackText: 'Intervallo di testo nero', xTitle: 'Immagine per Twitter', zhihuTitle: 'Immagine per Zhihu', wechatTitle: 'Immagine dell’account ufficiale WeChat'
  }
}

const canvasLabels = {
  'zh-CN': { verified: '已认证', scanSupport: '微信扫码·赞赏闪念文本', grayText: '提示文本', defaultLikes: '0 次互动', themeLight: '白底黑字', themeInk: '墨底金字', themeBlue: '蓝底白字', themeIndigo: '靛底白字', themeCyan: '青底白字', brandMark: '平台标识', twitterBird: '蓝色小鸟' },
  'zh-HK': { verified: '已認證', scanSupport: '微信掃碼 · 支援閃念文字', grayText: '提示文字', defaultLikes: '0 次互動', themeLight: '白底黑字', themeInk: '墨底金字', themeBlue: '藍底白字', themeIndigo: '靛底白字', themeCyan: '青底白字', brandMark: '平台標識', twitterBird: '藍色小鳥' },
  'zh-TW': { verified: '已驗證', scanSupport: '微信掃碼 · 支援閃念文字', grayText: '提示文字', defaultLikes: '0 次互動', themeLight: '白底黑字', themeInk: '墨底金字', themeBlue: '藍底白字', themeIndigo: '靛底白字', themeCyan: '青底白字', brandMark: '平台標識', twitterBird: '藍色小鳥' },
  en: { verified: 'Verified', scanSupport: 'Scan with WeChat · Support Flash Note Text', grayText: 'Hint text', defaultLikes: '0 likes', themeLight: 'White/black', themeInk: 'Ink/gold', themeBlue: 'Blue/white', themeIndigo: 'Indigo/white', themeCyan: 'Cyan/white', brandMark: 'Brand mark', twitterBird: 'Twitter bird' },
  ja: { verified: '認証済み', scanSupport: 'WeChat でスキャン · 闪念文本をサポート', grayText: 'ヒントテキスト', defaultLikes: '0 いいね', themeLight: '白地黒文字', themeInk: '墨地金文字', themeBlue: '青地白文字', themeIndigo: '藍地白文字', themeCyan: '青緑地白文字', brandMark: 'ブランドマーク', twitterBird: '青い鳥' },
  vi: { verified: 'Đã xác minh', scanSupport: 'Quét bằng WeChat · Ủng hộ 闪念文本', grayText: 'Văn bản gợi ý', defaultLikes: '0 lượt thích', themeLight: 'Nền trắng/chữ đen', themeInk: 'Nền mực/chữ vàng', themeBlue: 'Nền xanh/chữ trắng', themeIndigo: 'Nền chàm/chữ trắng', themeCyan: 'Nền lam ngọc/chữ trắng', brandMark: 'Dấu hiệu thương hiệu', twitterBird: 'Chim xanh Twitter' },
  ko: { verified: '인증됨', scanSupport: 'WeChat으로 스캔 · 闪念文本 후원', grayText: '안내 텍스트', defaultLikes: '좋아요 0개', themeLight: '흰 바탕/검은 글씨', themeInk: '먹색 바탕/금색 글씨', themeBlue: '파란 바탕/흰 글씨', themeIndigo: '남색 바탕/흰 글씨', themeCyan: '청록 바탕/흰 글씨', brandMark: '브랜드 마크', twitterBird: '파란 트위터 새' },
  es: { verified: 'Verificado', scanSupport: 'Escanea con WeChat · Apoya a 闪念文本', grayText: 'Texto de aviso', defaultLikes: '0 Me gusta', themeLight: 'Fondo blanco/texto negro', themeInk: 'Fondo tinta/texto dorado', themeBlue: 'Fondo azul/texto blanco', themeIndigo: 'Fondo índigo/texto blanco', themeCyan: 'Fondo cian/texto blanco', brandMark: 'Marca de la plataforma', twitterBird: 'Pájaro azul de Twitter' },
  fr: { verified: 'Vérifié', scanSupport: 'Scannez avec WeChat · Soutenez 闪念文本', grayText: 'Texte indicatif', defaultLikes: '0 J’aime', themeLight: 'Fond blanc/texte noir', themeInk: 'Fond encre/texte doré', themeBlue: 'Fond bleu/texte blanc', themeIndigo: 'Fond indigo/texte blanc', themeCyan: 'Fond cyan/texte blanc', brandMark: 'Logo de la plateforme', twitterBird: 'Oiseau bleu de Twitter' },
  'pt-BR': { verified: 'Verificado', scanSupport: 'Escaneie com o WeChat · Apoie o 闪念文本', grayText: 'Texto de aviso', defaultLikes: '0 curtidas', themeLight: 'Fundo branco/texto preto', themeInk: 'Fundo tinta/texto dourado', themeBlue: 'Fundo azul/texto branco', themeIndigo: 'Fundo índigo/texto branco', themeCyan: 'Fundo ciano/texto branco', brandMark: 'Marca da plataforma', twitterBird: 'Pássaro azul do Twitter' },
  'pt-PT': { verified: 'Verificado', scanSupport: 'Leia com o WeChat · Apoie o 闪念文本', grayText: 'Texto de aviso', defaultLikes: '0 gostos', themeLight: 'Fundo branco/texto preto', themeInk: 'Fundo tinta/texto dourado', themeBlue: 'Fundo azul/texto branco', themeIndigo: 'Fundo índigo/texto branco', themeCyan: 'Fundo ciano/texto branco', brandMark: 'Marca da plataforma', twitterBird: 'Pássaro azul do Twitter' },
  ru: { verified: 'Подтверждено', scanSupport: 'Сканируйте в WeChat · Поддержите 闪念文本', grayText: 'Текст-подсказка', defaultLikes: '0 отметок «Нравится»', themeLight: 'Белый фон/чёрный текст', themeInk: 'Чернильный фон/золотой текст', themeBlue: 'Синий фон/белый текст', themeIndigo: 'Индиго фон/белый текст', themeCyan: 'Бирюзовый фон/белый текст', brandMark: 'Знак платформы', twitterBird: 'Синяя птица Twitter' },
  de: { verified: 'Verifiziert', scanSupport: 'Mit WeChat scannen · 闪念文本 unterstützen', grayText: 'Hinweistext', defaultLikes: '0 „Gefällt mir“', themeLight: 'Weißer Grund/schwarzer Text', themeInk: 'Tintengrund/goldener Text', themeBlue: 'Blauer Grund/weißer Text', themeIndigo: 'Indigogrund/weißer Text', themeCyan: 'Cyangrund/weißer Text', brandMark: 'Plattformlogo', twitterBird: 'Blauer Twitter-Vogel' },
  it: { verified: 'Verificato', scanSupport: 'Scansiona con WeChat · Sostieni 闪念文本', grayText: 'Testo di suggerimento', defaultLikes: '0 Mi piace', themeLight: 'Sfondo bianco/testo nero', themeInk: 'Sfondo inchiostro/testo oro', themeBlue: 'Sfondo blu/testo bianco', themeIndigo: 'Sfondo indaco/testo bianco', themeCyan: 'Sfondo ciano/testo bianco', brandMark: 'Marchio della piattaforma', twitterBird: 'Uccellino blu di Twitter' }
}

const withCanvasLabels = (code, locale) => ({
  ...locale,
  social: { ...locale.social, ...canvasLabels[code] }
})

export default {
  'zh-CN': withCanvasLabels('zh-CN', zhCN),
  'zh-HK': withCanvasLabels('zh-HK', zhHK),
  'zh-TW': withCanvasLabels('zh-TW', zhTW),
  en: withCanvasLabels('en', en),
  ja: withCanvasLabels('ja', ja),
  vi: withCanvasLabels('vi', vi),
  ko: withCanvasLabels('ko', ko),
  es: withCanvasLabels('es', es),
  fr: withCanvasLabels('fr', fr),
  'pt-BR': withCanvasLabels('pt-BR', ptBR),
  'pt-PT': withCanvasLabels('pt-PT', ptPT),
  ru: withCanvasLabels('ru', ru),
  de: withCanvasLabels('de', de),
  it: withCanvasLabels('it', it)
}
