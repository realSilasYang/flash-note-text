const actions = {
  en: ['Reflow wrapped lines', 'Convert escaped line breaks', 'Remove whitespace', 'Ghost characters to spaces', 'Remove halfwidth spaces', 'Remove blank lines', 'Clean citation numbers', 'Remove hyperlinks', 'Add spaces between CJK and Latin text', 'Punctuation (English to CJK)', 'Punctuation (CJK to English)'],
  'zh-CN': ['断行重排', '换行符转回车', '删除空白', '幽灵字符转空格', '删除半角空格', '删除空行', '清理引用序号', '移除超链接', '中英文之间添加空格', '标点符号（英转中）', '标点符号（中转英）'],
  'zh-HK': ['斷行重排', '換行符轉回車', '刪除空白', '幽靈字元轉空格', '刪除半形空格', '刪除空行', '清理引用序號', '移除超連結', '中英文之間加入空格', '標點符號（英轉中）', '標點符號（中轉英）'],
  'zh-TW': ['斷行重排', '換行符轉換行', '刪除空白', '幽靈字元轉空格', '刪除半形空格', '刪除空行', '清理引用序號', '移除超連結', '中英文之間加入空格', '標點符號（英轉中）', '標點符號（中轉英）'],
  ja: ['改行を再配置', 'エスケープ改行を変換', '空白を削除', '不可視文字を空白に変換', '半角スペースを削除', '空行を削除', '引用番号を整理', 'リンクを解除', 'CJK と英数字の間に空白を追加', '句読点（英→中）', '句読点（中→英）'],
  vi: ['Sắp xếp lại dòng ngắt', 'Chuyển ký tự xuống dòng', 'Xóa khoảng trắng', 'Đổi ký tự ẩn thành dấu cách', 'Xóa dấu cách nửa chiều rộng', 'Xóa dòng trống', 'Dọn số trích dẫn', 'Gỡ siêu liên kết', 'Thêm cách giữa CJK và chữ La-tinh', 'Dấu câu (Anh sang CJK)', 'Dấu câu (CJK sang Anh)'],
  ko: ['줄바꿈 재배치', '이스케이프 줄바꿈 변환', '공백 삭제', '유령 문자를 공백으로 변환', '반각 공백 삭제', '빈 줄 삭제', '인용 번호 정리', '하이퍼링크 제거', 'CJK와 영문 사이 공백 추가', '문장 부호(영문→CJK)', '문장 부호(CJK→영문)'],
  es: ['Recomponer líneas cortadas', 'Convertir saltos escapados', 'Eliminar espacios en blanco', 'Convertir caracteres invisibles en espacios', 'Eliminar espacios de ancho medio', 'Eliminar líneas vacías', 'Limpiar números de cita', 'Quitar hipervínculos', 'Añadir espacios entre CJK y texto latino', 'Puntuación (inglés a CJK)', 'Puntuación (CJK a inglés)'],
  fr: ['Recomposer les lignes coupées', 'Convertir les sauts échappés', 'Supprimer les espaces', 'Convertir les caractères invisibles en espaces', 'Supprimer les espaces demi-chasse', 'Supprimer les lignes vides', 'Nettoyer les numéros de citation', 'Supprimer les hyperliens', 'Espacer le CJK et le texte latin', 'Ponctuation (anglais vers CJK)', 'Ponctuation (CJK vers anglais)'],
  'pt-BR': ['Recompor linhas quebradas', 'Converter quebras escapadas', 'Remover espaços em branco', 'Converter caracteres invisíveis em espaços', 'Remover espaços de meia largura', 'Remover linhas vazias', 'Limpar números de citação', 'Remover hiperlinks', 'Adicionar espaços entre CJK e texto latino', 'Pontuação (inglês para CJK)', 'Pontuação (CJK para inglês)'],
  'pt-PT': ['Recompor linhas quebradas', 'Converter quebras escapadas', 'Remover espaços em branco', 'Converter caracteres invisíveis em espaços', 'Remover espaços de meia largura', 'Remover linhas vazias', 'Limpar números de citação', 'Remover hiperligações', 'Adicionar espaços entre CJK e texto latino', 'Pontuação (inglês para CJK)', 'Pontuação (CJK para inglês)'],
  ru: ['Объединить перенесённые строки', 'Преобразовать экранированные переносы', 'Удалить пробельные символы', 'Заменить невидимые символы пробелами', 'Удалить пробелы половинной ширины', 'Удалить пустые строки', 'Очистить номера цитат', 'Убрать гиперссылки', 'Добавить пробелы между CJK и латиницей', 'Пунктуация (английская в CJK)', 'Пунктуация (CJK в английскую)'],
  de: ['Umgebrochene Zeilen neu setzen', 'Maskierte Zeilenumbrüche umwandeln', 'Leerraum entfernen', 'Unsichtbare Zeichen in Leerzeichen umwandeln', 'Halbbreite Leerzeichen entfernen', 'Leerzeilen entfernen', 'Zitiernummern bereinigen', 'Hyperlinks entfernen', 'CJK und lateinischen Text trennen', 'Satzzeichen (Englisch zu CJK)', 'Satzzeichen (CJK zu Englisch)'],
  it: ['Ricomponi righe interrotte', 'Converti interruzioni con escape', 'Rimuovi spazi bianchi', 'Converti i caratteri invisibili in spazi', 'Rimuovi spazi a mezza larghezza', 'Rimuovi righe vuote', 'Pulisci numeri delle citazioni', 'Rimuovi collegamenti', 'Aggiungi spazi tra CJK e testo latino', 'Punteggiatura (inglese a CJK)', 'Punteggiatura (CJK a inglese)']
}

const keys = ['reflowLines', 'escapedBreaks', 'removeWhitespace', 'ghostCharactersToSpaces', 'removeHalfwidthSpaces', 'removeBlankLines', 'removeCitationNumbers', 'removeLinks', 'spaceCjkLatin', 'punctuationToCjk', 'punctuationToLatin']

const labels = {
  en: ['Typography', 'Typography tools', 'Applied: {action}', 'No applicable text was found'],
  'zh-CN': ['排版', '文本排版', '已应用：{action}', '没有可处理的文本'],
  'zh-HK': ['排版', '文字排版', '已套用：{action}', '沒有可處理的文字'],
  'zh-TW': ['排版', '文字排版', '已套用：{action}', '沒有可處理的文字'],
  ja: ['整形', 'テキスト整形', '適用しました：{action}', '処理できるテキストがありません'],
  vi: ['Định dạng', 'Công cụ định dạng văn bản', 'Đã áp dụng: {action}', 'Không có văn bản phù hợp để xử lý'],
  ko: ['서식', '텍스트 서식', '적용됨: {action}', '처리할 수 있는 텍스트가 없습니다'],
  es: ['Formato', 'Herramientas de formato', 'Aplicado: {action}', 'No se encontró texto aplicable'],
  fr: ['Mise en forme', 'Outils de mise en forme', 'Appliqué : {action}', 'Aucun texte compatible à traiter'],
  'pt-BR': ['Formatação', 'Ferramentas de formatação', 'Aplicado: {action}', 'Nenhum texto aplicável foi encontrado'],
  'pt-PT': ['Formatação', 'Ferramentas de formatação', 'Aplicado: {action}', 'Não foi encontrado texto aplicável'],
  ru: ['Форматирование', 'Инструменты форматирования', 'Применено: {action}', 'Подходящий текст не найден'],
  de: ['Formatierung', 'Text formatieren', 'Angewendet: {action}', 'Kein passender Text gefunden'],
  it: ['Formattazione', 'Strumenti di formattazione', 'Applicato: {action}', 'Nessun testo adatto da elaborare']
}

export default Object.fromEntries(Object.entries(actions).map(([language, actionLabels]) => {
  const [label, menuLabel, applied, unchanged] = labels[language]
  return [language, {
    label,
    menuLabel,
    applied,
    unchanged,
    actions: Object.fromEntries(keys.map((key, index) => [key, actionLabels[index]]))
  }]
}))
