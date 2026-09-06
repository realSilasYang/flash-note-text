const errors = {
  en: {
    UNAVAILABLE: 'This feature requires uTools support for independent browser windows.', EMPTY_CONTENT: 'The current item has no content to generate.', BUSY: 'Another item is still being generated. Please wait for it to finish.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'The Text to Image entry could not be found. Xiaohongshu may have updated the page.', GENERATE_BUTTON_NOT_FOUND: 'The Generate Images button could not be found. Xiaohongshu may have updated the page.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu did not accept the current content. Check the text length or the message on the page.', NO_IMAGES: 'No generated images were returned.', LOGIN_CLOSED: 'The login window was closed before sign-in finished.', TIMEOUT: 'Xiaohongshu took too long to respond. Please try again.', UNKNOWN: 'Xiaohongshu card generation failed. Please try again.'
  },
  'zh-CN': {
    UNAVAILABLE: '此功能需要在支持独立浏览窗口的 uTools 中运行。', EMPTY_CONTENT: '当前条目没有可生成图片的内容。', BUSY: '另一个条目仍在生成，请等待完成后再试。', TEXT_IMAGE_ENTRY_NOT_FOUND: '未找到“文字配图”，小红书页面可能已经更新。', GENERATE_BUTTON_NOT_FOUND: '未找到“生成图片”按钮，小红书页面可能已经更新。', GENERATE_BUTTON_DISABLED: '小红书未接受当前内容，请检查文字长度或网页提示。', NO_IMAGES: '没有取得小红书生成的图片。', LOGIN_CLOSED: '尚未完成登录，登录窗口已关闭。', TIMEOUT: '等待小红书响应超时，请重试。', UNKNOWN: '小红书卡片生成失败，请重试。'
  },
  'zh-HK': {
    UNAVAILABLE: '此功能需要在支援獨立瀏覽器視窗的 uTools 中執行。', EMPTY_CONTENT: '目前項目沒有可產生圖片的內容。', TEXT_IMAGE_ENTRY_NOT_FOUND: '找不到「文字配圖」，小紅書頁面可能已更新。', GENERATE_BUTTON_NOT_FOUND: '找不到「生成圖片」按鈕，小紅書頁面可能已更新。', GENERATE_BUTTON_DISABLED: '小紅書未接受目前內容，請檢查文字長度或網頁提示。', NO_IMAGES: '沒有取得小紅書產生的圖片。', LOGIN_CLOSED: '尚未完成登入，登入視窗已關閉。', TIMEOUT: '等待小紅書回應逾時，請重試。', UNKNOWN: '無法產生小紅書卡片，請重試。'
  },
  'zh-TW': {
    UNAVAILABLE: '此功能需要在支援獨立瀏覽器視窗的 uTools 中執行。', EMPTY_CONTENT: '目前項目沒有可產生圖片的內容。', TEXT_IMAGE_ENTRY_NOT_FOUND: '找不到「文字配圖」，小紅書頁面可能已更新。', GENERATE_BUTTON_NOT_FOUND: '找不到「生成圖片」按鈕，小紅書頁面可能已更新。', GENERATE_BUTTON_DISABLED: '小紅書未接受目前內容，請檢查文字長度或網頁提示。', NO_IMAGES: '沒有取得小紅書產生的圖片。', LOGIN_CLOSED: '尚未完成登入，登入視窗已關閉。', TIMEOUT: '等待小紅書回應逾時，請重試。', UNKNOWN: '無法產生小紅書卡片，請重試。'
  },
  ja: {
    UNAVAILABLE: 'この機能には、uTools の独立ブラウザーウィンドウ機能が必要です。', EMPTY_CONTENT: '現在の項目には画像にできる内容がありません。', TEXT_IMAGE_ENTRY_NOT_FOUND: '「文字から画像」の入口が見つかりません。小紅書の画面が更新された可能性があります。', GENERATE_BUTTON_NOT_FOUND: '画像生成ボタンが見つかりません。小紅書の画面が更新された可能性があります。', GENERATE_BUTTON_DISABLED: '現在の内容を小紅書が受け付けませんでした。文字数または画面の案内を確認してください。', NO_IMAGES: '生成された画像を取得できませんでした。', LOGIN_CLOSED: 'ログインが完了する前にログイン画面が閉じられました。', TIMEOUT: '小紅書からの応答がタイムアウトしました。もう一度お試しください。', UNKNOWN: '小紅書カードを生成できませんでした。もう一度お試しください。'
  },
  vi: {
    UNAVAILABLE: 'Tính năng này cần khả năng mở cửa sổ trình duyệt độc lập của uTools.', EMPTY_CONTENT: 'Mục hiện tại không có nội dung để tạo ảnh.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'Không tìm thấy mục tạo ảnh từ văn bản. Có thể Xiaohongshu đã cập nhật trang.', GENERATE_BUTTON_NOT_FOUND: 'Không tìm thấy nút tạo ảnh. Có thể Xiaohongshu đã cập nhật trang.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu không chấp nhận nội dung hiện tại. Hãy kiểm tra độ dài hoặc thông báo trên trang.', NO_IMAGES: 'Không nhận được ảnh đã tạo.', LOGIN_CLOSED: 'Cửa sổ đăng nhập đã đóng trước khi đăng nhập hoàn tất.', TIMEOUT: 'Xiaohongshu phản hồi quá lâu. Hãy thử lại.', UNKNOWN: 'Không thể tạo thẻ Xiaohongshu. Hãy thử lại.'
  },
  ko: {
    UNAVAILABLE: '이 기능을 사용하려면 uTools의 독립 브라우저 창 기능이 필요합니다.', EMPTY_CONTENT: '현재 항목에 이미지로 만들 내용이 없습니다.', TEXT_IMAGE_ENTRY_NOT_FOUND: '텍스트 이미지 기능을 찾지 못했습니다. 샤오홍슈 화면이 변경되었을 수 있습니다.', GENERATE_BUTTON_NOT_FOUND: '이미지 생성 버튼을 찾지 못했습니다. 샤오홍슈 화면이 변경되었을 수 있습니다.', GENERATE_BUTTON_DISABLED: '샤오홍슈가 현재 내용을 받지 않았습니다. 글자 수나 화면 안내를 확인하세요.', NO_IMAGES: '생성된 이미지를 가져오지 못했습니다.', LOGIN_CLOSED: '로그인이 끝나기 전에 로그인 창이 닫혔습니다.', TIMEOUT: '샤오홍슈 응답 시간이 초과되었습니다. 다시 시도하세요.', UNKNOWN: '샤오홍슈 카드를 만들지 못했습니다. 다시 시도하세요.'
  },
  es: {
    UNAVAILABLE: 'Esta función requiere que uTools admita ventanas de navegador independientes.', EMPTY_CONTENT: 'El elemento actual no tiene contenido para generar una imagen.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'No se encontró la función de texto a imagen. Es posible que Xiaohongshu haya actualizado la página.', GENERATE_BUTTON_NOT_FOUND: 'No se encontró el botón para generar imágenes. Es posible que Xiaohongshu haya actualizado la página.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu no aceptó el contenido. Comprueba la longitud del texto o el aviso de la página.', NO_IMAGES: 'No se recibieron las imágenes generadas.', LOGIN_CLOSED: 'La ventana se cerró antes de completar el inicio de sesión.', TIMEOUT: 'Xiaohongshu tardó demasiado en responder. Inténtalo de nuevo.', UNKNOWN: 'No se pudo generar la tarjeta de Xiaohongshu. Inténtalo de nuevo.'
  },
  fr: {
    UNAVAILABLE: 'Cette fonction nécessite la prise en charge des fenêtres de navigateur indépendantes par uTools.', EMPTY_CONTENT: 'L’élément actuel ne contient aucun texte à transformer en image.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'L’outil de création d’image à partir de texte est introuvable. Xiaohongshu a peut-être modifié la page.', GENERATE_BUTTON_NOT_FOUND: 'Le bouton de génération d’images est introuvable. Xiaohongshu a peut-être modifié la page.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu n’a pas accepté le contenu. Vérifiez la longueur du texte ou le message affiché sur la page.', NO_IMAGES: 'Aucune image générée n’a été récupérée.', LOGIN_CLOSED: 'La fenêtre de connexion a été fermée avant la fin de la connexion.', TIMEOUT: 'Xiaohongshu a mis trop de temps à répondre. Réessayez.', UNKNOWN: 'Impossible de créer la carte Xiaohongshu. Réessayez.'
  },
  'pt-BR': {
    UNAVAILABLE: 'Este recurso requer suporte do uTools a janelas independentes do navegador.', EMPTY_CONTENT: 'O item atual não tem conteúdo para gerar uma imagem.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'A opção de texto para imagem não foi encontrada. O Xiaohongshu pode ter atualizado a página.', GENERATE_BUTTON_NOT_FOUND: 'O botão de gerar imagens não foi encontrado. O Xiaohongshu pode ter atualizado a página.', GENERATE_BUTTON_DISABLED: 'O Xiaohongshu não aceitou o conteúdo. Verifique o tamanho do texto ou o aviso na página.', NO_IMAGES: 'Nenhuma imagem gerada foi recebida.', LOGIN_CLOSED: 'A janela foi fechada antes de concluir o login.', TIMEOUT: 'O Xiaohongshu demorou demais para responder. Tente novamente.', UNKNOWN: 'Não foi possível gerar o cartão do Xiaohongshu. Tente novamente.'
  },
  'pt-PT': {
    UNAVAILABLE: 'Esta funcionalidade requer o suporte do uTools para janelas de navegador independentes.', EMPTY_CONTENT: 'O item atual não tem conteúdo para gerar uma imagem.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'A opção de texto para imagem não foi encontrada. O Xiaohongshu pode ter atualizado a página.', GENERATE_BUTTON_NOT_FOUND: 'O botão para gerar imagens não foi encontrado. O Xiaohongshu pode ter atualizado a página.', GENERATE_BUTTON_DISABLED: 'O Xiaohongshu não aceitou o conteúdo. Verifique o tamanho do texto ou o aviso na página.', NO_IMAGES: 'Não foram recebidas imagens geradas.', LOGIN_CLOSED: 'A janela foi fechada antes de concluir o início de sessão.', TIMEOUT: 'O Xiaohongshu demorou demasiado a responder. Tente novamente.', UNKNOWN: 'Não foi possível gerar o cartão do Xiaohongshu. Tente novamente.'
  },
  ru: {
    UNAVAILABLE: 'Для этой функции требуется поддержка отдельных окон браузера в uTools.', EMPTY_CONTENT: 'В текущей записи нет содержимого для создания изображения.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'Не удалось найти функцию создания изображения из текста. Возможно, Xiaohongshu обновил страницу.', GENERATE_BUTTON_NOT_FOUND: 'Не удалось найти кнопку создания изображений. Возможно, Xiaohongshu обновил страницу.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu не принял содержимое. Проверьте длину текста или сообщение на странице.', NO_IMAGES: 'Созданные изображения не получены.', LOGIN_CLOSED: 'Окно входа закрыто до завершения авторизации.', TIMEOUT: 'Xiaohongshu слишком долго не отвечает. Повторите попытку.', UNKNOWN: 'Не удалось создать карточку Xiaohongshu. Повторите попытку.'
  },
  de: {
    UNAVAILABLE: 'Für diese Funktion muss uTools eigenständige Browserfenster unterstützen.', EMPTY_CONTENT: 'Der aktuelle Eintrag enthält keinen Text für ein Bild.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'Die Text-zu-Bild-Funktion wurde nicht gefunden. Möglicherweise hat Xiaohongshu die Seite geändert.', GENERATE_BUTTON_NOT_FOUND: 'Die Schaltfläche zum Erstellen der Bilder wurde nicht gefunden. Möglicherweise hat Xiaohongshu die Seite geändert.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu hat den Inhalt nicht angenommen. Prüfen Sie die Textlänge oder den Hinweis auf der Seite.', NO_IMAGES: 'Es wurden keine erzeugten Bilder empfangen.', LOGIN_CLOSED: 'Das Anmeldefenster wurde vor Abschluss der Anmeldung geschlossen.', TIMEOUT: 'Xiaohongshu hat zu lange nicht geantwortet. Versuchen Sie es erneut.', UNKNOWN: 'Die Xiaohongshu-Karte konnte nicht erstellt werden. Versuchen Sie es erneut.'
  },
  it: {
    UNAVAILABLE: 'Questa funzione richiede il supporto di uTools per finestre browser indipendenti.', EMPTY_CONTENT: 'L’elemento corrente non contiene testo da trasformare in immagine.', TEXT_IMAGE_ENTRY_NOT_FOUND: 'La funzione da testo a immagine non è stata trovata. Xiaohongshu potrebbe aver aggiornato la pagina.', GENERATE_BUTTON_NOT_FOUND: 'Il pulsante per generare le immagini non è stato trovato. Xiaohongshu potrebbe aver aggiornato la pagina.', GENERATE_BUTTON_DISABLED: 'Xiaohongshu non ha accettato il contenuto. Controlla la lunghezza del testo o il messaggio nella pagina.', NO_IMAGES: 'Non sono state ricevute immagini generate.', LOGIN_CLOSED: 'La finestra di accesso è stata chiusa prima di completare l’accesso.', TIMEOUT: 'Xiaohongshu ha impiegato troppo tempo a rispondere. Riprova.', UNKNOWN: 'Impossibile generare la scheda Xiaohongshu. Riprova.'
  }
}

const labels = {
  en: { xiaohongshuImage: 'Xiaohongshu cards', jpegFiles: 'JPEG images', webpFiles: 'WebP images', title: 'Xiaohongshu cards', working: 'Generating cards with Xiaohongshu', loginHint: 'If sign-in is required, the official Xiaohongshu login window will open automatically.', failed: 'Could not generate the cards', retry: 'Try again', regenerate: 'Generate again', save: 'Save image', saving: 'Saving', templates: 'Generated cards', count: '{count} cards', previewFailed: 'Preview unavailable. You can retry or save the image.', downloadFailed: 'Could not download the Xiaohongshu image', saveTitle: 'Save Xiaohongshu card' },
  'zh-CN': { xiaohongshuImage: '小红书卡片', jpegFiles: 'JPEG 图片', webpFiles: 'WebP 图片', title: '小红书卡片', working: '正在通过小红书生成卡片', loginHint: '如需登录，将自动显示小红书官方登录窗口；登录完成后会继续生成。', failed: '未能生成小红书卡片', retry: '重试', regenerate: '重新生成', save: '保存图片', saving: '正在保存', templates: '生成的卡片', count: '共 {count} 张', previewFailed: '预览加载失败，可以重试或直接保存图片。', downloadFailed: '下载小红书图片失败', saveTitle: '保存小红书卡片' },
  'zh-HK': { xiaohongshuImage: '小紅書卡片', jpegFiles: 'JPEG 圖片', webpFiles: 'WebP 圖片', title: '小紅書卡片', working: '正在透過小紅書產生卡片', loginHint: '如需登入，將自動顯示小紅書官方登入視窗；登入完成後會繼續產生。', failed: '無法產生小紅書卡片', retry: '重試', regenerate: '重新產生', save: '儲存圖片', saving: '正在儲存', templates: '產生的卡片', count: '共 {count} 張', previewFailed: '無法載入預覽，可重試或直接儲存圖片。', downloadFailed: '無法下載小紅書圖片', saveTitle: '儲存小紅書卡片' },
  'zh-TW': { xiaohongshuImage: '小紅書卡片', jpegFiles: 'JPEG 圖片', webpFiles: 'WebP 圖片', title: '小紅書卡片', working: '正在透過小紅書產生卡片', loginHint: '如需登入，將自動顯示小紅書官方登入視窗；登入完成後會繼續產生。', failed: '無法產生小紅書卡片', retry: '重試', regenerate: '重新產生', save: '儲存圖片', saving: '正在儲存', templates: '產生的卡片', count: '共 {count} 張', previewFailed: '無法載入預覽，可重試或直接儲存圖片。', downloadFailed: '無法下載小紅書圖片', saveTitle: '儲存小紅書卡片' },
  ja: { xiaohongshuImage: '小紅書カード', jpegFiles: 'JPEG 画像', webpFiles: 'WebP 画像', title: '小紅書カード', working: '小紅書でカードを生成しています', loginHint: 'ログインが必要な場合は、小紅書の公式ログイン画面が自動的に開きます。', failed: '小紅書カードを生成できませんでした', retry: '再試行', regenerate: 'もう一度生成', save: '画像を保存', saving: '保存中', templates: '生成されたカード', count: '{count} 枚', previewFailed: 'プレビューを読み込めません。再試行するか画像を保存してください。', downloadFailed: '小紅書画像をダウンロードできませんでした', saveTitle: '小紅書カードを保存' },
  vi: { xiaohongshuImage: 'Thẻ Xiaohongshu', jpegFiles: 'Ảnh JPEG', webpFiles: 'Ảnh WebP', title: 'Thẻ Xiaohongshu', working: 'Đang tạo thẻ bằng Xiaohongshu', loginHint: 'Nếu cần đăng nhập, cửa sổ đăng nhập chính thức của Xiaohongshu sẽ tự động mở.', failed: 'Không thể tạo thẻ Xiaohongshu', retry: 'Thử lại', regenerate: 'Tạo lại', save: 'Lưu ảnh', saving: 'Đang lưu', templates: 'Thẻ đã tạo', count: '{count} thẻ', previewFailed: 'Không tải được bản xem trước. Bạn có thể thử lại hoặc lưu ảnh.', downloadFailed: 'Không thể tải ảnh Xiaohongshu', saveTitle: 'Lưu thẻ Xiaohongshu' },
  ko: { xiaohongshuImage: '샤오홍슈 카드', jpegFiles: 'JPEG 이미지', webpFiles: 'WebP 이미지', title: '샤오홍슈 카드', working: '샤오홍슈에서 카드를 만들고 있습니다', loginHint: '로그인이 필요하면 샤오홍슈 공식 로그인 창이 자동으로 열립니다.', failed: '샤오홍슈 카드를 만들지 못했습니다', retry: '다시 시도', regenerate: '다시 생성', save: '이미지 저장', saving: '저장 중', templates: '생성된 카드', count: '{count}개', previewFailed: '미리 보기를 불러오지 못했습니다. 다시 시도하거나 이미지를 저장하세요.', downloadFailed: '샤오홍슈 이미지를 다운로드하지 못했습니다', saveTitle: '샤오홍슈 카드 저장' },
  es: { xiaohongshuImage: 'Tarjetas de Xiaohongshu', jpegFiles: 'Imágenes JPEG', webpFiles: 'Imágenes WebP', title: 'Tarjetas de Xiaohongshu', working: 'Generando tarjetas con Xiaohongshu', loginHint: 'Si es necesario iniciar sesión, se abrirá automáticamente la ventana oficial de Xiaohongshu.', failed: 'No se pudieron generar las tarjetas', retry: 'Reintentar', regenerate: 'Volver a generar', save: 'Guardar imagen', saving: 'Guardando', templates: 'Tarjetas generadas', count: '{count} tarjetas', previewFailed: 'No se pudo cargar la vista previa. Puedes reintentar o guardar la imagen.', downloadFailed: 'No se pudo descargar la imagen de Xiaohongshu', saveTitle: 'Guardar tarjeta de Xiaohongshu' },
  fr: { xiaohongshuImage: 'Cartes Xiaohongshu', jpegFiles: 'Images JPEG', webpFiles: 'Images WebP', title: 'Cartes Xiaohongshu', working: 'Création des cartes avec Xiaohongshu', loginHint: 'Si une connexion est nécessaire, la fenêtre officielle de Xiaohongshu s’ouvrira automatiquement.', failed: 'Impossible de créer les cartes', retry: 'Réessayer', regenerate: 'Générer à nouveau', save: 'Enregistrer l’image', saving: 'Enregistrement', templates: 'Cartes générées', count: '{count} cartes', previewFailed: 'Impossible de charger l’aperçu. Vous pouvez réessayer ou enregistrer l’image.', downloadFailed: 'Impossible de télécharger l’image Xiaohongshu', saveTitle: 'Enregistrer la carte Xiaohongshu' },
  'pt-BR': { xiaohongshuImage: 'Cartões do Xiaohongshu', jpegFiles: 'Imagens JPEG', webpFiles: 'Imagens WebP', title: 'Cartões do Xiaohongshu', working: 'Gerando cartões com o Xiaohongshu', loginHint: 'Se for necessário entrar, a janela oficial de login do Xiaohongshu será aberta automaticamente.', failed: 'Não foi possível gerar os cartões', retry: 'Tentar novamente', regenerate: 'Gerar novamente', save: 'Salvar imagem', saving: 'Salvando', templates: 'Cartões gerados', count: '{count} cartões', previewFailed: 'Não foi possível carregar a prévia. Tente novamente ou salve a imagem.', downloadFailed: 'Não foi possível baixar a imagem do Xiaohongshu', saveTitle: 'Salvar cartão do Xiaohongshu' },
  'pt-PT': { xiaohongshuImage: 'Cartões do Xiaohongshu', jpegFiles: 'Imagens JPEG', webpFiles: 'Imagens WebP', title: 'Cartões do Xiaohongshu', working: 'A gerar cartões com o Xiaohongshu', loginHint: 'Se for necessário iniciar sessão, a janela oficial do Xiaohongshu será aberta automaticamente.', failed: 'Não foi possível gerar os cartões', retry: 'Tentar novamente', regenerate: 'Gerar novamente', save: 'Guardar imagem', saving: 'A guardar', templates: 'Cartões gerados', count: '{count} cartões', previewFailed: 'Não foi possível carregar a pré-visualização. Tente novamente ou guarde a imagem.', downloadFailed: 'Não foi possível transferir a imagem do Xiaohongshu', saveTitle: 'Guardar cartão do Xiaohongshu' },
  ru: { xiaohongshuImage: 'Карточки Xiaohongshu', jpegFiles: 'Изображения JPEG', webpFiles: 'Изображения WebP', title: 'Карточки Xiaohongshu', working: 'Xiaohongshu создаёт карточки', loginHint: 'Если потребуется вход, официальное окно Xiaohongshu откроется автоматически.', failed: 'Не удалось создать карточки', retry: 'Повторить', regenerate: 'Создать заново', save: 'Сохранить изображение', saving: 'Сохранение', templates: 'Созданные карточки', count: '{count} карточек', previewFailed: 'Не удалось загрузить предпросмотр. Повторите попытку или сохраните изображение.', downloadFailed: 'Не удалось загрузить изображение Xiaohongshu', saveTitle: 'Сохранить карточку Xiaohongshu' },
  de: { xiaohongshuImage: 'Xiaohongshu-Karten', jpegFiles: 'JPEG-Bilder', webpFiles: 'WebP-Bilder', title: 'Xiaohongshu-Karten', working: 'Karten werden mit Xiaohongshu erstellt', loginHint: 'Falls eine Anmeldung nötig ist, öffnet sich automatisch das offizielle Xiaohongshu-Anmeldefenster.', failed: 'Die Karten konnten nicht erstellt werden', retry: 'Erneut versuchen', regenerate: 'Neu erstellen', save: 'Bild speichern', saving: 'Wird gespeichert', templates: 'Erstellte Karten', count: '{count} Karten', previewFailed: 'Die Vorschau konnte nicht geladen werden. Versuchen Sie es erneut oder speichern Sie das Bild.', downloadFailed: 'Das Xiaohongshu-Bild konnte nicht heruntergeladen werden', saveTitle: 'Xiaohongshu-Karte speichern' },
  it: { xiaohongshuImage: 'Schede Xiaohongshu', jpegFiles: 'Immagini JPEG', webpFiles: 'Immagini WebP', title: 'Schede Xiaohongshu', working: 'Creazione delle schede con Xiaohongshu', loginHint: 'Se è necessario accedere, si aprirà automaticamente la finestra ufficiale di Xiaohongshu.', failed: 'Impossibile generare le schede', retry: 'Riprova', regenerate: 'Genera di nuovo', save: 'Salva immagine', saving: 'Salvataggio', templates: 'Schede generate', count: '{count} schede', previewFailed: 'Impossibile caricare l’anteprima. Riprova o salva l’immagine.', downloadFailed: 'Impossibile scaricare l’immagine Xiaohongshu', saveTitle: 'Salva scheda Xiaohongshu' }
}

const changeColorLabels = {
  en: 'Change color',
  'zh-CN': '换配色',
  'zh-HK': '更換配色',
  'zh-TW': '更換配色',
  ja: '配色を変更',
  vi: 'Đổi màu',
  ko: '색상 변경',
  es: 'Cambiar color',
  fr: 'Changer les couleurs',
  'pt-BR': 'Trocar cores',
  'pt-PT': 'Alterar cores',
  ru: 'Сменить цвета',
  de: 'Farben wechseln',
  it: 'Cambia colori'
}

const changingColorLabels = {
  en: 'Changing color',
  'zh-CN': '正在换配色',
  'zh-HK': '正在更換配色',
  'zh-TW': '正在更換配色',
  ja: '配色を変更中',
  vi: 'Đang đổi màu',
  ko: '색상 변경 중',
  es: 'Cambiando color',
  fr: 'Changement des couleurs',
  'pt-BR': 'Trocando cores',
  'pt-PT': 'A alterar cores',
  ru: 'Цвета меняются',
  de: 'Farben werden gewechselt',
  it: 'Cambio colori'
}

const changeColorFailedLabels = {
  en: 'Could not change this card color.',
  'zh-CN': '未能切换当前卡片配色。',
  'zh-HK': '無法切換目前卡片配色。',
  'zh-TW': '無法切換目前卡片配色。',
  ja: 'このカードの配色を変更できませんでした。',
  vi: 'Không thể đổi màu thẻ này.',
  ko: '이 카드의 색상을 변경하지 못했습니다.',
  es: 'No se pudo cambiar el color de esta tarjeta.',
  fr: 'Impossible de changer les couleurs de cette carte.',
  'pt-BR': 'Não foi possível trocar as cores deste cartão.',
  'pt-PT': 'Não foi possível alterar as cores deste cartão.',
  ru: 'Не удалось сменить цвета этой карточки.',
  de: 'Die Farben dieser Karte konnten nicht gewechselt werden.',
  it: 'Impossibile cambiare i colori di questa scheda.'
}

const changeColorUnavailableLabels = {
  en: 'This card has no alternate color.',
  'zh-CN': '当前卡片没有其他配色。',
  'zh-HK': '目前卡片沒有其他配色。',
  'zh-TW': '目前卡片沒有其他配色。',
  ja: 'このカードに別の配色はありません。',
  vi: 'Thẻ này không có màu khác.',
  ko: '이 카드에는 다른 색상이 없습니다.',
  es: 'Esta tarjeta no tiene otro color.',
  fr: 'Cette carte ne propose pas d’autre couleur.',
  'pt-BR': 'Este cartão não tem outra cor.',
  'pt-PT': 'Este cartão não tem outra cor.',
  ru: 'Для этой карточки нет другой расцветки.',
  de: 'Für diese Karte gibt es keine weitere Farbe.',
  it: 'Questa scheda non ha altri colori.'
}

const longArticleLabels = {
  en: { menu: 'Xiaohongshu article', title: 'Xiaohongshu article images', failed: 'Could not generate the article images', templates: 'Generated article images', previewFailed: 'Article image preview unavailable. You can retry or save the image.', downloadFailed: 'Could not download the Xiaohongshu article image', saveTitle: 'Save Xiaohongshu article image' },
  'zh-CN': { menu: '小红书长文', title: '小红书长文图片', failed: '未能生成小红书长文图片', templates: '生成的长文图片', previewFailed: '长文图片预览加载失败，可以重试或直接保存图片。', downloadFailed: '下载小红书长文图片失败', saveTitle: '保存小红书长文图片' },
  'zh-HK': { menu: '小紅書長文', title: '小紅書長文圖片', failed: '無法產生小紅書長文圖片', templates: '產生的長文圖片', previewFailed: '無法載入長文圖片預覽，可重試或直接儲存圖片。', downloadFailed: '無法下載小紅書長文圖片', saveTitle: '儲存小紅書長文圖片' },
  'zh-TW': { menu: '小紅書長文', title: '小紅書長文圖片', failed: '無法產生小紅書長文圖片', templates: '產生的長文圖片', previewFailed: '無法載入長文圖片預覽，可重試或直接儲存圖片。', downloadFailed: '無法下載小紅書長文圖片', saveTitle: '儲存小紅書長文圖片' },
  ja: { menu: '小紅書の長文', title: '小紅書の長文画像', failed: '小紅書の長文画像を生成できませんでした', templates: '生成された長文画像', previewFailed: '長文画像のプレビューを読み込めません。再試行するか画像を保存してください。', downloadFailed: '小紅書の長文画像をダウンロードできませんでした', saveTitle: '小紅書の長文画像を保存' },
  vi: { menu: 'Bài dài Xiaohongshu', title: 'Ảnh bài dài Xiaohongshu', failed: 'Không thể tạo ảnh bài dài Xiaohongshu', templates: 'Ảnh bài dài đã tạo', previewFailed: 'Không tải được bản xem trước ảnh bài dài. Bạn có thể thử lại hoặc lưu ảnh.', downloadFailed: 'Không thể tải ảnh bài dài Xiaohongshu', saveTitle: 'Lưu ảnh bài dài Xiaohongshu' },
  ko: { menu: '샤오홍슈 긴 글', title: '샤오홍슈 긴 글 이미지', failed: '샤오홍슈 긴 글 이미지를 만들지 못했습니다', templates: '생성된 긴 글 이미지', previewFailed: '긴 글 이미지 미리보기를 불러오지 못했습니다. 다시 시도하거나 이미지를 저장하세요.', downloadFailed: '샤오홍슈 긴 글 이미지를 다운로드하지 못했습니다', saveTitle: '샤오홍슈 긴 글 이미지 저장' },
  es: { menu: 'Artículo de Xiaohongshu', title: 'Imágenes de artículo de Xiaohongshu', failed: 'No se pudieron generar las imágenes del artículo', templates: 'Imágenes del artículo generadas', previewFailed: 'No se pudo cargar la vista previa de la imagen del artículo. Puedes reintentar o guardar la imagen.', downloadFailed: 'No se pudo descargar la imagen del artículo de Xiaohongshu', saveTitle: 'Guardar imagen del artículo de Xiaohongshu' },
  fr: { menu: 'Article Xiaohongshu', title: 'Images d’article Xiaohongshu', failed: 'Impossible de créer les images de l’article', templates: 'Images de l’article générées', previewFailed: 'Impossible de charger l’aperçu de l’image de l’article. Vous pouvez réessayer ou enregistrer l’image.', downloadFailed: 'Impossible de télécharger l’image de l’article Xiaohongshu', saveTitle: 'Enregistrer l’image de l’article Xiaohongshu' },
  'pt-BR': { menu: 'Artigo do Xiaohongshu', title: 'Imagens de artigo do Xiaohongshu', failed: 'Não foi possível gerar as imagens do artigo', templates: 'Imagens do artigo geradas', previewFailed: 'Não foi possível carregar a prévia da imagem do artigo. Tente novamente ou salve a imagem.', downloadFailed: 'Não foi possível baixar a imagem do artigo do Xiaohongshu', saveTitle: 'Salvar imagem do artigo do Xiaohongshu' },
  'pt-PT': { menu: 'Artigo do Xiaohongshu', title: 'Imagens de artigo do Xiaohongshu', failed: 'Não foi possível gerar as imagens do artigo', templates: 'Imagens do artigo geradas', previewFailed: 'Não foi possível carregar a pré-visualização da imagem do artigo. Tente novamente ou guarde a imagem.', downloadFailed: 'Não foi possível transferir a imagem do artigo do Xiaohongshu', saveTitle: 'Guardar imagem do artigo do Xiaohongshu' },
  ru: { menu: 'Лонгрид Xiaohongshu', title: 'Изображения лонгрида Xiaohongshu', failed: 'Не удалось создать изображения лонгрида', templates: 'Созданные изображения лонгрида', previewFailed: 'Не удалось загрузить предпросмотр изображения лонгрида. Повторите попытку или сохраните изображение.', downloadFailed: 'Не удалось загрузить изображение лонгрида Xiaohongshu', saveTitle: 'Сохранить изображение лонгрида Xiaohongshu' },
  de: { menu: 'Xiaohongshu-Langtext', title: 'Bilder des Xiaohongshu-Langtexts', failed: 'Die Bilder des Xiaohongshu-Langtexts konnten nicht erstellt werden', templates: 'Erstellte Langtextbilder', previewFailed: 'Die Vorschau des Langtextbildes konnte nicht geladen werden. Versuchen Sie es erneut oder speichern Sie das Bild.', downloadFailed: 'Das Bild des Xiaohongshu-Langtexts konnte nicht heruntergeladen werden', saveTitle: 'Bild des Xiaohongshu-Langtexts speichern' },
  it: { menu: 'Articolo Xiaohongshu', title: 'Immagini dell’articolo Xiaohongshu', failed: 'Impossibile generare le immagini dell’articolo', templates: 'Immagini dell’articolo generate', previewFailed: 'Impossibile caricare l’anteprima dell’immagine dell’articolo. Riprova o salva l’immagine.', downloadFailed: 'Impossibile scaricare l’immagine dell’articolo Xiaohongshu', saveTitle: 'Salva immagine dell’articolo Xiaohongshu' }
}

const progressLabels = {
  en: { opening: 'Opening Xiaohongshu in the background', login: 'Waiting for Xiaohongshu sign-in', navigating: 'Opening the creation workspace', editor: 'Entering the content', layout: 'Formatting the long-form article', template: 'Selecting the article template', images: 'Generating Xiaohongshu cards', longImages: 'Generating the long-form images', extracting: 'Reading the generated images' },
  'zh-CN': { opening: '正在后台打开小红书', login: '正在等待小红书登录', navigating: '正在进入创作页面', editor: '正在写入条目内容', layout: '正在一键排版长文', template: '正在选择长文模板', images: '正在生成小红书卡片', longImages: '正在生成长文图片', extracting: '正在读取生成结果' },
  'zh-HK': { opening: '正在背景開啟小紅書', login: '正在等待小紅書登入', navigating: '正在進入創作頁面', editor: '正在寫入項目內容', layout: '正在一鍵排版長文', template: '正在選擇長文範本', images: '正在產生小紅書卡片', longImages: '正在產生長文圖片', extracting: '正在讀取產生結果' },
  'zh-TW': { opening: '正在背景開啟小紅書', login: '正在等待小紅書登入', navigating: '正在進入創作頁面', editor: '正在寫入項目內容', layout: '正在一鍵排版長文', template: '正在選擇長文範本', images: '正在產生小紅書卡片', longImages: '正在產生長文圖片', extracting: '正在讀取產生結果' },
  ja: { opening: '小紅書をバックグラウンドで開いています', login: '小紅書へのログインを待っています', navigating: '作成画面を開いています', editor: '本文を入力しています', layout: '長文をレイアウトしています', template: '長文テンプレートを選んでいます', images: '小紅書カードを生成しています', longImages: '長文画像を生成しています', extracting: '生成結果を読み込んでいます' },
  vi: { opening: 'Đang mở Xiaohongshu trong nền', login: 'Đang chờ đăng nhập Xiaohongshu', navigating: 'Đang mở trang sáng tác', editor: 'Đang nhập nội dung', layout: 'Đang dàn trang bài dài', template: 'Đang chọn mẫu bài dài', images: 'Đang tạo thẻ Xiaohongshu', longImages: 'Đang tạo ảnh bài dài', extracting: 'Đang đọc ảnh đã tạo' },
  ko: { opening: '백그라운드에서 샤오홍슈를 여는 중', login: '샤오홍슈 로그인을 기다리는 중', navigating: '작성 화면을 여는 중', editor: '내용을 입력하는 중', layout: '긴 글 서식을 적용하는 중', template: '긴 글 템플릿을 선택하는 중', images: '샤오홍슈 카드를 생성하는 중', longImages: '긴 글 이미지를 생성하는 중', extracting: '생성 결과를 읽는 중' },
  es: { opening: 'Abriendo Xiaohongshu en segundo plano', login: 'Esperando el inicio de sesión', navigating: 'Abriendo el espacio de creación', editor: 'Introduciendo el contenido', layout: 'Maquetando el artículo', template: 'Seleccionando la plantilla', images: 'Generando tarjetas de Xiaohongshu', longImages: 'Generando las imágenes del artículo', extracting: 'Leyendo las imágenes generadas' },
  fr: { opening: 'Ouverture de Xiaohongshu en arrière-plan', login: 'En attente de la connexion à Xiaohongshu', navigating: 'Ouverture de l’espace de création', editor: 'Saisie du contenu', layout: 'Mise en page de l’article', template: 'Sélection du modèle d’article', images: 'Création des cartes Xiaohongshu', longImages: 'Création des images de l’article', extracting: 'Lecture des images générées' },
  'pt-BR': { opening: 'Abrindo o Xiaohongshu em segundo plano', login: 'Aguardando o login no Xiaohongshu', navigating: 'Abrindo o espaço de criação', editor: 'Inserindo o conteúdo', layout: 'Diagramando o artigo', template: 'Selecionando o modelo', images: 'Gerando cartões do Xiaohongshu', longImages: 'Gerando as imagens do artigo', extracting: 'Lendo as imagens geradas' },
  'pt-PT': { opening: 'A abrir o Xiaohongshu em segundo plano', login: 'A aguardar o início de sessão', navigating: 'A abrir o espaço de criação', editor: 'A introduzir o conteúdo', layout: 'A paginar o artigo', template: 'A selecionar o modelo', images: 'A gerar cartões do Xiaohongshu', longImages: 'A gerar as imagens do artigo', extracting: 'A ler as imagens geradas' },
  ru: { opening: 'Xiaohongshu открывается в фоновом режиме', login: 'Ожидание входа в Xiaohongshu', navigating: 'Открывается редактор публикации', editor: 'Вставляется содержимое', layout: 'Верстается лонгрид', template: 'Выбирается шаблон', images: 'Создаются карточки Xiaohongshu', longImages: 'Создаются изображения лонгрида', extracting: 'Считываются созданные изображения' },
  de: { opening: 'Xiaohongshu wird im Hintergrund geöffnet', login: 'Anmeldung bei Xiaohongshu wird abgewartet', navigating: 'Erstellungsbereich wird geöffnet', editor: 'Inhalt wird eingefügt', layout: 'Langtext wird gestaltet', template: 'Langtextvorlage wird ausgewählt', images: 'Xiaohongshu-Karten werden erzeugt', longImages: 'Langtextbilder werden erzeugt', extracting: 'Erzeugte Bilder werden eingelesen' },
  it: { opening: 'Apertura di Xiaohongshu in background', login: 'In attesa dell’accesso a Xiaohongshu', navigating: 'Apertura dell’area di creazione', editor: 'Inserimento del contenuto', layout: 'Impaginazione dell’articolo', template: 'Selezione del modello', images: 'Generazione delle schede Xiaohongshu', longImages: 'Generazione delle immagini dell’articolo', extracting: 'Lettura delle immagini generate' }
}

const templateChoiceLabels = {
  en: { title: 'Choose a long-form template', hint: 'Choose a layout and its theme color before generating the images.', confirm: 'Use this template' },
  'zh-CN': { title: '选择长文模板', hint: '选择排版样式及主题色后继续生成图片', confirm: '使用此模板' },
  'zh-HK': { title: '選擇長文範本', hint: '選擇排版樣式及主題色後繼續產生圖片', confirm: '使用此範本' },
  'zh-TW': { title: '選擇長文範本', hint: '選擇排版樣式及主題色後繼續產生圖片', confirm: '使用此範本' },
  ja: { title: '長文テンプレートを選択', hint: 'レイアウトとテーマカラーを選んでから画像を生成します。', confirm: 'このテンプレートを使用' },
  vi: { title: 'Chọn mẫu bài dài', hint: 'Chọn kiểu dàn trang và màu chủ đề trước khi tạo ảnh.', confirm: 'Dùng mẫu này' },
  ko: { title: '긴 글 템플릿 선택', hint: '레이아웃과 테마 색상을 선택한 뒤 이미지를 생성합니다.', confirm: '이 템플릿 사용' },
  es: { title: 'Elegir plantilla de artículo', hint: 'Elige un diseño y su color de tema antes de generar las imágenes.', confirm: 'Usar esta plantilla' },
  fr: { title: 'Choisir un modèle d’article', hint: 'Choisissez une mise en page et sa couleur avant de créer les images.', confirm: 'Utiliser ce modèle' },
  'pt-BR': { title: 'Escolher modelo de artigo', hint: 'Escolha o layout e a cor do tema antes de gerar as imagens.', confirm: 'Usar este modelo' },
  'pt-PT': { title: 'Escolher modelo de artigo', hint: 'Escolha o esquema e a cor do tema antes de gerar as imagens.', confirm: 'Usar este modelo' },
  ru: { title: 'Выберите шаблон лонгрида', hint: 'Выберите оформление и цвет темы перед созданием изображений.', confirm: 'Использовать шаблон' },
  de: { title: 'Langtextvorlage auswählen', hint: 'Wählen Sie vor der Bilderstellung ein Layout und dessen Themenfarbe.', confirm: 'Diese Vorlage verwenden' },
  it: { title: 'Scegli il modello dell’articolo', hint: 'Scegli impaginazione e colore del tema prima di generare le immagini.', confirm: 'Usa questo modello' }
}

const longArticleErrors = {
  en: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'The Xiaohongshu long-form editor could not be opened.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'The Xiaohongshu long-form text editor could not be found.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'The article content could not be entered in the Xiaohongshu editor.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'No Xiaohongshu long-form template was available.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu could not format the long-form article.', LONG_IMAGE_READ_FAILED: 'The generated long-form image could not be read.', WINDOW_CLOSED: 'The Xiaohongshu window was closed, so article image generation was cancelled.', UNKNOWN: 'Xiaohongshu article image generation failed. Please try again.' },
  'zh-CN': { LONG_ARTICLE_ENTRY_NOT_FOUND: '未能打开小红书长文编辑器。', LONG_ARTICLE_EDITOR_NOT_FOUND: '未找到小红书长文正文编辑区。', LONG_ARTICLE_TEXT_INPUT_FAILED: '未能将条目内容写入小红书长文编辑器。', LONG_ARTICLE_TEMPLATE_NOT_FOUND: '没有找到可用的小红书长文模板。', LONG_ARTICLE_LAYOUT_FAILED: '小红书未能完成长文排版。', LONG_IMAGE_READ_FAILED: '无法读取生成的长文图片。', WINDOW_CLOSED: '小红书窗口已关闭，本次长文图片生成已取消。', UNKNOWN: '小红书长文图片生成失败，请重试。' },
  'zh-HK': { LONG_ARTICLE_ENTRY_NOT_FOUND: '無法開啟小紅書長文編輯器。', LONG_ARTICLE_EDITOR_NOT_FOUND: '找不到小紅書長文內文編輯區。', LONG_ARTICLE_TEXT_INPUT_FAILED: '無法將項目內容寫入小紅書長文編輯器。', LONG_ARTICLE_TEMPLATE_NOT_FOUND: '找不到可用的小紅書長文範本。', LONG_ARTICLE_LAYOUT_FAILED: '小紅書無法完成長文排版。', LONG_IMAGE_READ_FAILED: '無法讀取產生的長文圖片。', WINDOW_CLOSED: '小紅書視窗已關閉，本次長文圖片產生已取消。', UNKNOWN: '小紅書長文圖片產生失敗，請重試。' },
  'zh-TW': { LONG_ARTICLE_ENTRY_NOT_FOUND: '無法開啟小紅書長文編輯器。', LONG_ARTICLE_EDITOR_NOT_FOUND: '找不到小紅書長文本文編輯區。', LONG_ARTICLE_TEXT_INPUT_FAILED: '無法將項目內容寫入小紅書長文編輯器。', LONG_ARTICLE_TEMPLATE_NOT_FOUND: '找不到可用的小紅書長文範本。', LONG_ARTICLE_LAYOUT_FAILED: '小紅書無法完成長文排版。', LONG_IMAGE_READ_FAILED: '無法讀取產生的長文圖片。', WINDOW_CLOSED: '小紅書視窗已關閉，本次長文圖片產生已取消。', UNKNOWN: '小紅書長文圖片產生失敗，請重試。' },
  ja: { LONG_ARTICLE_ENTRY_NOT_FOUND: '小紅書の長文エディターを開けませんでした。', LONG_ARTICLE_EDITOR_NOT_FOUND: '小紅書の長文本文エリアが見つかりませんでした。', LONG_ARTICLE_TEXT_INPUT_FAILED: '小紅書の長文エディターに本文を入力できませんでした。', LONG_ARTICLE_TEMPLATE_NOT_FOUND: '利用できる小紅書の長文テンプレートが見つかりませんでした。', LONG_ARTICLE_LAYOUT_FAILED: '小紅書で長文をレイアウトできませんでした。', LONG_IMAGE_READ_FAILED: '生成された長文画像を読み込めませんでした。', WINDOW_CLOSED: '小紅書の画面が閉じられたため、長文画像の生成をキャンセルしました。', UNKNOWN: '小紅書の長文画像を生成できませんでした。もう一度お試しください。' },
  vi: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Không thể mở trình soạn bài dài của Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'Không tìm thấy vùng nhập nội dung bài dài.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Không thể nhập nội dung vào trình soạn bài dài của Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Không tìm thấy mẫu bài dài khả dụng.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu không thể dàn trang bài dài.', LONG_IMAGE_READ_FAILED: 'Không thể đọc ảnh bài dài đã tạo.', WINDOW_CLOSED: 'Cửa sổ Xiaohongshu đã đóng nên quá trình tạo ảnh bài dài đã bị hủy.', UNKNOWN: 'Không thể tạo ảnh bài dài Xiaohongshu. Hãy thử lại.' },
  ko: { LONG_ARTICLE_ENTRY_NOT_FOUND: '샤오홍슈 긴 글 편집기를 열지 못했습니다.', LONG_ARTICLE_EDITOR_NOT_FOUND: '긴 글 본문 편집 영역을 찾지 못했습니다.', LONG_ARTICLE_TEXT_INPUT_FAILED: '샤오홍슈 긴 글 편집기에 내용을 입력하지 못했습니다.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: '사용 가능한 긴 글 템플릿을 찾지 못했습니다.', LONG_ARTICLE_LAYOUT_FAILED: '샤오홍슈가 긴 글 서식을 완성하지 못했습니다.', LONG_IMAGE_READ_FAILED: '생성된 긴 글 이미지를 읽지 못했습니다.', WINDOW_CLOSED: '샤오홍슈 창이 닫혀 긴 글 이미지 생성을 취소했습니다.', UNKNOWN: '샤오홍슈 긴 글 이미지를 만들지 못했습니다. 다시 시도하세요.' },
  es: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'No se pudo abrir el editor de artículos de Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'No se encontró el área de texto del artículo.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'No se pudo introducir el contenido en el editor de artículos de Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'No se encontró ninguna plantilla de artículo disponible.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu no pudo maquetar el artículo.', LONG_IMAGE_READ_FAILED: 'No se pudo leer la imagen del artículo generada.', WINDOW_CLOSED: 'Se cerró la ventana de Xiaohongshu y se canceló la generación de imágenes del artículo.', UNKNOWN: 'No se pudieron generar las imágenes del artículo de Xiaohongshu. Inténtalo de nuevo.' },
  fr: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Impossible d’ouvrir l’éditeur d’articles Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'La zone de texte de l’article est introuvable.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Impossible de saisir le contenu dans l’éditeur d’articles Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Aucun modèle d’article Xiaohongshu n’est disponible.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu n’a pas pu mettre l’article en page.', LONG_IMAGE_READ_FAILED: 'Impossible de lire l’image d’article générée.', WINDOW_CLOSED: 'La fenêtre Xiaohongshu a été fermée ; la création des images de l’article a été annulée.', UNKNOWN: 'Impossible de créer les images de l’article Xiaohongshu. Réessayez.' },
  'pt-BR': { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Não foi possível abrir o editor de artigos do Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'A área de texto do artigo não foi encontrada.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Não foi possível inserir o conteúdo no editor de artigos do Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Nenhum modelo de artigo está disponível.', LONG_ARTICLE_LAYOUT_FAILED: 'O Xiaohongshu não conseguiu diagramar o artigo.', LONG_IMAGE_READ_FAILED: 'Não foi possível ler a imagem do artigo gerada.', WINDOW_CLOSED: 'A janela do Xiaohongshu foi fechada e a geração das imagens do artigo foi cancelada.', UNKNOWN: 'Não foi possível gerar as imagens do artigo do Xiaohongshu. Tente novamente.' },
  'pt-PT': { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Não foi possível abrir o editor de artigos do Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'A área de texto do artigo não foi encontrada.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Não foi possível introduzir o conteúdo no editor de artigos do Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Não está disponível nenhum modelo de artigo.', LONG_ARTICLE_LAYOUT_FAILED: 'O Xiaohongshu não conseguiu paginar o artigo.', LONG_IMAGE_READ_FAILED: 'Não foi possível ler a imagem do artigo gerada.', WINDOW_CLOSED: 'A janela do Xiaohongshu foi fechada e a criação das imagens do artigo foi cancelada.', UNKNOWN: 'Não foi possível gerar as imagens do artigo do Xiaohongshu. Tente novamente.' },
  ru: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Не удалось открыть редактор лонгридов Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'Не удалось найти область текста лонгрида.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Не удалось вставить содержимое в редактор лонгрида Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Нет доступного шаблона для лонгрида.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu не удалось сверстать лонгрид.', LONG_IMAGE_READ_FAILED: 'Не удалось прочитать созданное изображение лонгрида.', WINDOW_CLOSED: 'Окно Xiaohongshu закрыто, создание изображений лонгрида отменено.', UNKNOWN: 'Не удалось создать изображения лонгрида Xiaohongshu. Повторите попытку.' },
  de: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Der Xiaohongshu-Langtexteditor konnte nicht geöffnet werden.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'Das Textfeld für den Langtext wurde nicht gefunden.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Der Inhalt konnte nicht in den Xiaohongshu-Langtexteditor eingefügt werden.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Es ist keine Langtextvorlage verfügbar.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu konnte den Langtext nicht gestalten.', LONG_IMAGE_READ_FAILED: 'Das erzeugte Langtextbild konnte nicht gelesen werden.', WINDOW_CLOSED: 'Das Xiaohongshu-Fenster wurde geschlossen; die Erstellung der Langtextbilder wurde abgebrochen.', UNKNOWN: 'Die Bilder des Xiaohongshu-Langtexts konnten nicht erstellt werden. Versuchen Sie es erneut.' },
  it: { LONG_ARTICLE_ENTRY_NOT_FOUND: 'Impossibile aprire l’editor degli articoli Xiaohongshu.', LONG_ARTICLE_EDITOR_NOT_FOUND: 'L’area di testo dell’articolo non è stata trovata.', LONG_ARTICLE_TEXT_INPUT_FAILED: 'Impossibile inserire il contenuto nell’editor degli articoli Xiaohongshu.', LONG_ARTICLE_TEMPLATE_NOT_FOUND: 'Non è disponibile alcun modello per l’articolo.', LONG_ARTICLE_LAYOUT_FAILED: 'Xiaohongshu non è riuscito a impaginare l’articolo.', LONG_IMAGE_READ_FAILED: 'Impossibile leggere l’immagine dell’articolo generata.', WINDOW_CLOSED: 'La finestra di Xiaohongshu è stata chiusa e la generazione delle immagini dell’articolo è stata annullata.', UNKNOWN: 'Impossibile generare le immagini dell’articolo Xiaohongshu. Riprova.' }
}

const guideMessages = {
  en: 'Use Share in the status bar to create note images, code screenshots, or Xiaohongshu cards.',
  'zh-CN': '底部“分享”可生成便签图片、代码截图或小红书卡片。',
  'zh-HK': '底部「分享」可產生便箋圖片、程式碼截圖或小紅書卡片。',
  'zh-TW': '底部「分享」可產生便箋圖片、程式碼截圖或小紅書卡片。',
  ja: '下部の共有から、ノート画像、コード画像、小紅書カードを作成できます。',
  vi: 'Dùng mục Chia sẻ ở thanh trạng thái để tạo ảnh ghi chú, ảnh chụp mã hoặc thẻ Xiaohongshu.',
  ko: '상태 표시줄의 공유에서 메모 이미지, 코드 스크린샷, 샤오홍슈 카드를 만들 수 있습니다.',
  es: 'Usa Compartir en la barra de estado para crear imágenes de notas, capturas de código o tarjetas de Xiaohongshu.',
  fr: 'Utilisez Partager dans la barre d’état pour créer des images de note, des captures de code ou des cartes Xiaohongshu.',
  'pt-BR': 'Use Compartilhar na barra de status para criar imagens de nota, capturas de código ou cartões do Xiaohongshu.',
  'pt-PT': 'Utilize Partilhar na barra de estado para criar imagens de nota, capturas de código ou cartões do Xiaohongshu.',
  ru: 'Через пункт публикации в строке состояния можно создавать изображения заметок, снимки кода и карточки Xiaohongshu.',
  de: 'Über Teilen in der Statusleiste erstellen Sie Notizbilder, Code-Screenshots oder Xiaohongshu-Karten.',
  it: 'Usa Condividi nella barra di stato per creare immagini delle note, schermate del codice o schede Xiaohongshu.'
}

const busyMessages = {
  en: 'Another item is still being generated. Please wait for it to finish.',
  'zh-CN': '另一个条目仍在生成，请等待完成后再试。',
  'zh-HK': '另一個項目仍在產生，請等待完成後再試。',
  'zh-TW': '另一個項目仍在產生，請等待完成後再試。',
  ja: '別の項目を生成中です。完了してからもう一度お試しください。',
  vi: 'Một mục khác vẫn đang được tạo. Hãy đợi hoàn tất rồi thử lại.',
  ko: '다른 항목을 생성하고 있습니다. 완료된 뒤 다시 시도하세요.',
  es: 'Todavía se está generando otro elemento. Espera a que termine.',
  fr: 'Un autre élément est encore en cours de génération. Attendez qu’il soit terminé.',
  'pt-BR': 'Outro item ainda está sendo gerado. Aguarde a conclusão.',
  'pt-PT': 'Outro item ainda está a ser gerado. Aguarde até terminar.',
  ru: 'Ещё создаётся другая запись. Дождитесь завершения.',
  de: 'Ein anderer Eintrag wird noch erstellt. Warten Sie, bis der Vorgang abgeschlossen ist.',
  it: 'È ancora in corso la generazione di un altro elemento. Attendi il completamento.'
}

const windowClosedMessages = {
  en: 'The Xiaohongshu window was closed, so card generation was cancelled.',
  'zh-CN': '小红书窗口已关闭，本次生成已取消。',
  'zh-HK': '小紅書視窗已關閉，本次產生已取消。',
  'zh-TW': '小紅書視窗已關閉，本次產生已取消。',
  ja: '小紅書の画面が閉じられたため、カード生成をキャンセルしました。',
  vi: 'Cửa sổ Xiaohongshu đã đóng nên quá trình tạo thẻ đã bị hủy.',
  ko: '샤오홍슈 창이 닫혀 카드 생성을 취소했습니다.',
  es: 'Se cerró la ventana de Xiaohongshu y se canceló la generación de tarjetas.',
  fr: 'La fenêtre Xiaohongshu a été fermée ; la création des cartes a été annulée.',
  'pt-BR': 'A janela do Xiaohongshu foi fechada e a geração dos cartões foi cancelada.',
  'pt-PT': 'A janela do Xiaohongshu foi fechada e a criação dos cartões foi cancelada.',
  ru: 'Окно Xiaohongshu закрыто, создание карточек отменено.',
  de: 'Das Xiaohongshu-Fenster wurde geschlossen; die Kartenerstellung wurde abgebrochen.',
  it: 'La finestra di Xiaohongshu è stata chiusa e la generazione delle schede è stata annullata.'
}

export default Object.fromEntries(Object.entries(labels).map(([language, copy]) => [language, {
  xiaohongshuImage: copy.xiaohongshuImage,
  xiaohongshuLongImage: longArticleLabels[language].menu,
  jpegFiles: copy.jpegFiles,
  webpFiles: copy.webpFiles,
  xhs: {
    title: copy.title,
    longTitle: longArticleLabels[language].title,
    longFailed: longArticleLabels[language].failed,
    longTemplates: longArticleLabels[language].templates,
    longPreviewFailed: longArticleLabels[language].previewFailed,
    longDownloadFailed: longArticleLabels[language].downloadFailed,
    longSaveTitle: longArticleLabels[language].saveTitle,
    progress: progressLabels[language],
    chooseLongTemplate: templateChoiceLabels[language].title,
    chooseLongTemplateHint: templateChoiceLabels[language].hint,
    useLongTemplate: templateChoiceLabels[language].confirm,
    working: copy.working,
    loginHint: copy.loginHint,
    failed: copy.failed,
    retry: copy.retry,
    regenerate: copy.regenerate,
    changeColor: changeColorLabels[language],
    changingColor: changingColorLabels[language],
    changeColorFailed: changeColorFailedLabels[language],
    changeColorUnavailable: changeColorUnavailableLabels[language],
    save: copy.save,
    saving: copy.saving,
    templates: copy.templates,
    count: copy.count,
    previewFailed: copy.previewFailed,
    downloadFailed: copy.downloadFailed,
    saveTitle: copy.saveTitle,
    guideMessage: guideMessages[language],
    errors: {
      ...errors[language],
      BUSY: busyMessages[language],
      WINDOW_CLOSED: windowClosedMessages[language]
    },
    longErrors: {
      ...errors[language],
      BUSY: busyMessages[language],
      ...longArticleErrors[language]
    }
  }
}]))
