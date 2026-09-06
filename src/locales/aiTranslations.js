const zh = {
  label: "AI 辅助",
  formatting: "AI 文本处理",

  settings: "人工智能",
  model: "uTools AI 模型",
  modelAuto: "默认模型",
  modelLoading: "正在读取可用模型…",
  modelUnavailable: "当前环境未提供模型列表，可直接使用默认模型",
  directEnabled: "使用直连生图 API",

  directBaseUrl: "API 基础地址或完整接口地址",
  directApiKey: "API 密钥（可留空）",
  showApiKey: "显示 API 密钥",
  hideApiKey: "隐藏 API 密钥",
  directModel: "直连生图模型",

  directImagesApi: "Images API（gpt-image-2 推荐）",

  refreshModels: "刷新模型列表",
  openModelsSettings: "打开 uTools AI 模型设置",
  openPluginModelsSettings: "打开插件 AI 模型设置",
  formattingPrompt: "文本排版默认提示词",

  imageGenerationPrompt: "图片生成默认提示词",
  promptHint: "可选。留空时使用内置提示词。",
  inputPlaceholder: "描述你希望 AI 完成的操作…",

  referenceImage: "参考图",
  chooseReference: "选择参考图",
  removeReference: "移除参考图",
  result: "预览结果",
  generateImage: "生成图片",
  generatedImageWorkbench: "生成图片预览与编辑",
  imageEditMode: "处理方式",
  refineImage: "微调图片",
  refineImagePlaceholder: "描述需要在当前图片上调整的内容…",
  saveEditedImage: "保存编辑后的图片",
  copyEditedImage: "复制编辑后的图片",
  rotateImage: "旋转",
  rotateLeft: "向左旋转",
  rotateRight: "向右旋转",
  flipImage: "翻转",
  flipHorizontal: "水平翻转",
  flipVertical: "垂直翻转",
  resetImageEdits: "重置图片编辑",
  imageGenerationPlaceholder: "描述要生成的画面、风格、比例或细节…",
  imageOutputUnavailable:
    "模型没有返回图片数据，请在 uTools AI 设置中选择支持图片输出的模型。",
  imageOutputUnavailableDirect:
    "直连 Images API 没有返回可识别的图片数据。请检查模型和服务商响应格式。",
  imageGenerationSystem:
    "你是图像生成助手。根据用户要求和当前条目内容生成图片；如果当前模型支持图片输出，请直接返回图片数据，不要只返回文字说明。",

  apply: "应用结果",
  retry: "重新生成",
  cancel: "取消请求",
  close: "关闭",
  processing: "AI 正在处理…",
  reasoning: "模型推理过程",
  inputRequired: "请输入 AI 要求",
  textRequired: "当前没有可排版的文本",
  shareTextRequired: "当前没有可生成分享图的内容",
  referenceRequired: "请选择一张参考图片",
  errorUnavailable: "当前环境暂未提供 AI 能力，请在 uTools 中配置模型后重试。",
  errorDirectUnavailable:
    "直连 API 服务不可用。请重新打开插件，或检查预加载脚本是否已更新。",
  errorDirectConfig:
    "直连 API 配置无效。请填写完整的 HTTP（S）地址和模型名称，并检查参考图数据。",
  errorDirectInvalidResponse:
    "直连 API 返回了空响应或无效 JSON，无法解析为图片或文本结果。",
  errorCancelled: "AI 请求已取消。",
  errorAuth: "AI 鉴权失败，请检查 API 密钥或登录状态。",
  errorForbidden: "AI 服务拒绝了访问，请检查模型权限或接口配置。",
  errorTimeout: "AI 请求超时，请稍后重试。",
  errorServer: "AI 服务暂时异常，请稍后重试。",
  errorImageGenerationRequest:
    "模型“{model}”的图片生成请求失败（最终 HTTP {status}）。已尝试：{attempts}。",
  errorImageGenerationProviderDetail: "上游服务端详情：{detail}",
  errorImageGenerationNoProviderDetail: "上游服务端未返回更具体的错误详情。",
  errorRateLimit: "AI 请求达到频率或额度限制，请稍后重试。",
  errorNetwork: "AI 网络请求失败，请检查网络连接后重试。",
  errorBadRequest:
    "模型“{model}”拒绝了请求（400）。请检查自定义模型的接口地址、鉴权、模型名称和 OpenAI 兼容格式。",
  errorDefaultBadRequest:
    "默认模型拒绝了请求（400）。请确认 uTools AI 已登录并配置了可用模型；也可以在 AI 设置中选择一个可用模型后重试。",
  errorImageApiUnsupported:
    "模型“{model}”返回的是 Images API 图片响应，但当前 uTools AI 自定义模型只支持 Chat Completions，无法读取该响应。请改用支持 Chat Completions 图片输出的模型，或等待 uTools 支持 Images API。",
  callFailed: "AI 请求失败，请稍后重试。",
  invalidFormat: "AI 返回内容格式无效，请重新生成。",
  applied: "已应用 AI 排版结果",
  sourceChanged: "原文在 AI 处理期间已发生变化，请重新生成以避免覆盖最新内容。",

  imageInvalid: "请选择 PNG、JPEG、WebP、GIF、AVIF、TIFF 或 SVG 图片",
  visionUnsupported:
    "当前模型“{model}”不支持图片理解，请在 AI 设置中选择支持视觉输入的模型。",
  visionUnknown:
    "无法确认当前模型“{model}”是否支持图片理解，请在 AI 设置中选择明确支持视觉输入的模型。继续使用可能无法正确理解参考图，或导致反推效果不佳。",
  visionSupported: "支持图片理解",
  fileDialogDetachFailed: "请先按 Ctrl+D 将「闪念文本」分离为独立窗口",
  formattingSystem:
    "你是严谨的文本排版助手。根据用户要求修改文本，保留原意和所有重要信息，只输出修改后的完整文本，不要解释。",
};

const en = {
  ...zh,
  label: "AI assistant",
  formatting: "AI text processing",
  settings: "Artificial intelligence",
  model: "AI model",
  modelAuto: "Default model",
  modelLoading: "Loading available models…",
  modelUnavailable:
    "No model list is available; the default model can still be used",
  formattingPrompt: "Default text-formatting prompt",
  imageGenerationPrompt: "Default image-generation prompt",
  promptHint: "Optional. Leave blank to use the built-in prompt.",
  inputPlaceholder: "Describe what you want AI to do…",
  referenceImage: "Reference image",
  chooseReference: "Choose reference",
  removeReference: "Remove reference",
  result: "Prompt result",
  generateImage: "Generate image",
  imageGenerationPlaceholder:
    "Describe the scene, style, aspect ratio, or details to generate…",
  imageOutputUnavailable:
    "The model did not return image data. Choose a model with image output in uTools AI settings.",
  errorImageApiUnsupported:
    "Model “{model}” returned an Images API response, but uTools AI custom models only support Chat Completions responses. Choose a model with Chat Completions image output, or wait for uTools Images API support.",
  imageGenerationSystem:
    "You are an image-generation assistant. Generate an image from the user request and the current entry content; when the current model supports image output, return image data directly instead of only describing it.",
  apply: "Apply result",
  retry: "Generate again",
  cancel: "Cancel request",
  close: "Close",
  processing: "AI is working…",
  inputRequired: "Enter an AI request",
  textRequired: "There is no text to format",
  shareTextRequired: "There is no content for a share image",
  referenceRequired: "Choose a reference image",
  errorUnavailable:
    "AI is unavailable. Configure a model in uTools and try again.",
  errorRateLimit: "The AI request was rate or quota limited. Try again later.",
  errorNetwork:
    "The AI network request failed. Check your connection and try again.",
  errorBadRequest:
    "Model “{model}” rejected the request (400). Check the custom model endpoint, authentication, model name, and OpenAI-compatible format.",
  callFailed: "The AI request failed. Try again later.",
  invalidFormat: "The AI returned an invalid format. Generate again.",
  applied: "AI formatting applied",
  sourceChanged:
    "The source changed while AI was working. Generate again to avoid overwriting newer content.",
  imageInvalid: "Choose a PNG, JPEG, WebP, or GIF image",
  visionUnsupported:
    "The current model “{model}” does not support image understanding. Choose a vision-capable model in AI settings.",
  visionUnknown:
    "The image-input capability of “{model}” cannot be confirmed. Choose a model that explicitly supports vision input in AI settings. Continuing may prevent the reference image from being understood correctly or produce poor reverse-prompt results.",
  visionSupported: "Supports image understanding",
  fileDialogDetachFailed:
    "Press Ctrl+D to detach the “FlashNote Text” plugin into a separate window.",
  formattingSystem:
    "You are a precise text-formatting assistant. Modify the text according to the user request, preserve meaning and important information, and output only the final modified text.",
};

Object.assign(en, {
  model: "uTools AI model",
  directEnabled: "Use a direct image API",

  directBaseUrl: "API base URL or complete endpoint",
  directApiKey: "API key (optional)",
  showApiKey: "Show API key",
  hideApiKey: "Hide API key",
  directModel: "Direct image model",

  directImagesApi: "Images API (recommended for gpt-image-2)",

  imageOutputUnavailableDirect:
    "The direct Images API did not return recognizable image data. Check the model and provider response format.",
  errorDirectUnavailable:
    "The direct API service is unavailable. Reopen the plugin or check that its preload script is up to date.",
  errorDirectConfig:
    "The direct API configuration is invalid. Enter a complete HTTP(S) URL and model name, then check the reference image data.",
  errorDirectInvalidResponse:
    "The direct API returned an empty response or invalid JSON that cannot be read as an image or text result.",
  generatedImageWorkbench: "Generated image preview and editor",
  imageEditMode: "Image operation",
  refineImage: "Refine image",
  refineImagePlaceholder: "Describe what to adjust in the current image…",
  imageInvalid: "Choose a PNG, JPEG, WebP, GIF, AVIF, TIFF, or SVG image",
  saveEditedImage: "Save edited image",
  copyEditedImage: "Copy edited image",
  rotateImage: "Rotate",
  rotateLeft: "Rotate left",
  rotateRight: "Rotate right",
  flipImage: "Flip",
  flipHorizontal: "Flip horizontally",
  flipVertical: "Flip vertically",
  resetImageEdits: "Reset image edits",
  refreshModels: "Refresh model list",
  openModelsSettings: "Open uTools AI model settings",
  openPluginModelsSettings: "Open plugin AI model settings",
  errorCancelled: "The AI request was cancelled.",
  errorAuth: "AI authentication failed. Check the API key or sign-in state.",
  errorForbidden:
    "The AI service denied access. Check model permissions or endpoint settings.",
  errorTimeout: "The AI request timed out. Try again later.",
  errorServer: "The AI service is temporarily unavailable. Try again later.",
  errorImageGenerationRequest:
    "Image generation by model “{model}” failed (final HTTP {status}). Attempts: {attempts}.",
  errorImageGenerationProviderDetail: "Upstream detail: {detail}",
  errorImageGenerationNoProviderDetail:
    "The upstream service did not return a more specific error detail.",
  errorDefaultBadRequest:
    "The default model rejected the request (400). Confirm that uTools AI is signed in and has an available model, or choose an available model in AI settings.",
  reasoning: "Model reasoning",
});

const localizedOverrides = {
  "zh-HK": {
    label: "AI 輔助",
    formatting: "AI 文字處理",

    settings: "人工智能",
    model: "AI 模型",
    modelAuto: "預設模型",
    modelLoading: "正在讀取可用模型…",
    modelUnavailable: "目前環境未提供模型清單，可直接使用預設模型",
    refreshModels: "重新整理模型清單",
    openModelsSettings: "開啟 uTools AI 模型設定",
    openPluginModelsSettings: "開啟外掛程式 AI 模型設定",
    formattingPrompt: "文字排版預設提示詞",

    promptHint: "選填。留空時使用內建提示詞。",
    inputPlaceholder: "描述你希望 AI 完成的操作…",

    referenceImage: "參考圖片",
    chooseReference: "選擇參考圖片",
    removeReference: "移除參考圖片",
    result: "預覽結果",
    generateImage: "生成圖片",

    apply: "套用結果",
    retry: "重新生成",
    cancel: "取消要求",
    close: "關閉",
    processing: "AI 正在處理…",
    reasoning: "模型推理過程",
    inputRequired: "請輸入 AI 要求",
    textRequired: "目前沒有可處理的文字",
    shareTextRequired: "目前沒有可生成分享圖片的內容",
    referenceRequired: "請選擇一張參考圖片",
    errorUnavailable:
      "目前環境暫未提供 AI 功能，請在 uTools 中設定模型後再試。",
    errorCancelled: "AI 要求已取消。",
    errorAuth: "AI 驗證失敗，請檢查 API 金鑰或登入狀態。",
    errorForbidden: "AI 服務拒絕存取，請檢查模型權限或介面設定。",
    errorTimeout: "AI 要求逾時，請稍後再試。",
    errorServer: "AI 服務暫時異常，請稍後再試。",
    errorRateLimit: "AI 要求已達頻率或額度限制，請稍後再試。",
    errorNetwork: "AI 網絡要求失敗，請檢查網絡連線後再試。",
    errorBadRequest:
      "模型「{model}」拒絕了要求（400）。請檢查自訂模型的介面地址、驗證、模型名稱及 OpenAI 相容格式。",
    errorDefaultBadRequest:
      "預設模型拒絕了要求（400）。請確認 uTools AI 已登入並設定可用模型；也可在 AI 設定中選擇可用模型後再試。",
    callFailed: "AI 要求失敗，請稍後再試。",
    invalidFormat: "AI 傳回內容格式無效，請重新生成。",
    applied: "已套用 AI 文字處理結果",
    sourceChanged: "原文在 AI 處理期間已變更，請重新生成以免覆蓋最新內容。",

    imageInvalid: "請選擇 PNG、JPEG、WebP 或 GIF 圖片",
    visionUnsupported:
      "目前模型「{model}」不支援圖片理解，請在 AI 設定中選擇支援視覺輸入的模型。",
    visionUnknown:
      "無法確認目前模型「{model}」是否支援圖片理解，請在 AI 設定中選擇明確支援視覺輸入的模型。繼續使用可能無法正確理解參考圖片，或導致反推效果不佳。",
    visionSupported: "支援圖片理解",
    fileDialogDetachFailed: "請先按 Ctrl+D 將「閃念文字」分離為獨立視窗",
    formattingSystem:
      "你是嚴謹的文字排版助手。請根據使用者要求修改文字，保留原意及所有重要資訊，只輸出修改後的完整文字，不要解釋。",
  },
  "zh-TW": {
    label: "AI 輔助",
    formatting: "AI 文字處理",

    settings: "人工智慧",
    model: "AI 模型",
    modelAuto: "預設模型",
    modelLoading: "正在讀取可用模型…",
    modelUnavailable: "目前環境未提供模型清單，可直接使用預設模型",
    refreshModels: "重新整理模型清單",
    openModelsSettings: "開啟 uTools AI 模型設定",
    openPluginModelsSettings: "開啟外掛程式 AI 模型設定",
    formattingPrompt: "文字排版預設提示詞",

    promptHint: "選填。留空時使用內建提示詞。",
    inputPlaceholder: "描述你希望 AI 完成的操作…",

    referenceImage: "參考圖片",
    chooseReference: "選擇參考圖片",
    removeReference: "移除參考圖片",
    result: "預覽結果",
    generateImage: "生成圖片",

    apply: "套用結果",
    retry: "重新生成",
    cancel: "取消要求",
    close: "關閉",
    processing: "AI 正在處理…",
    reasoning: "模型推理過程",
    inputRequired: "請輸入 AI 要求",
    textRequired: "目前沒有可處理的文字",
    shareTextRequired: "目前沒有可生成分享圖片的內容",
    referenceRequired: "請選擇一張參考圖片",
    errorUnavailable:
      "目前環境暫未提供 AI 功能，請在 uTools 中設定模型後再試。",
    errorCancelled: "AI 要求已取消。",
    errorAuth: "AI 驗證失敗，請檢查 API 金鑰或登入狀態。",
    errorForbidden: "AI 服務拒絕存取，請檢查模型權限或介面設定。",
    errorTimeout: "AI 要求逾時，請稍後再試。",
    errorServer: "AI 服務暫時異常，請稍後再試。",
    errorRateLimit: "AI 要求已達頻率或額度限制，請稍後再試。",
    errorNetwork: "AI 網路要求失敗，請檢查網路連線後再試。",
    errorBadRequest:
      "模型「{model}」拒絕了要求（400）。請檢查自訂模型的介面位址、驗證、模型名稱及 OpenAI 相容格式。",
    errorDefaultBadRequest:
      "預設模型拒絕了要求（400）。請確認 uTools AI 已登入並設定可用模型；也可在 AI 設定中選擇可用模型後再試。",
    callFailed: "AI 要求失敗，請稍後再試。",
    invalidFormat: "AI 傳回內容格式無效，請重新生成。",
    applied: "已套用 AI 文字處理結果",
    sourceChanged: "原文在 AI 處理期間已變更，請重新生成以免覆蓋最新內容。",

    imageInvalid: "請選擇 PNG、JPEG、WebP 或 GIF 圖片",
    visionUnsupported:
      "目前模型「{model}」不支援圖片理解，請在 AI 設定中選擇支援視覺輸入的模型。",
    visionUnknown:
      "無法確認目前模型「{model}」是否支援圖片理解，請在 AI 設定中選擇明確支援視覺輸入的模型。繼續使用可能無法正確理解參考圖片，或導致反推效果不佳。",
    visionSupported: "支援圖片理解",
    fileDialogDetachFailed: "請先按 Ctrl+D 將「閃念文字」分離為獨立視窗",
    formattingSystem:
      "你是嚴謹的文字排版助手。請根據使用者要求修改文字，保留原意及所有重要資訊，只輸出修改後的完整文字，不要解釋。",
  },
  ja: {
    label: "AI アシスタント",
    formatting: "AI テキスト処理",

    settings: "人工知能",
    model: "AI モデル",
    modelAuto: "既定のモデル",
    modelLoading: "利用可能なモデルを読み込み中…",
    modelUnavailable:
      "モデル一覧を取得できません。既定のモデルはそのまま使用できます",
    refreshModels: "モデル一覧を更新",
    openModelsSettings: "uTools の AI モデル設定を開く",
    openPluginModelsSettings: "プラグインの AI モデル設定を開く",
    formattingPrompt: "テキスト処理の既定プロンプト",

    promptHint: "任意。空欄の場合は組み込みプロンプトを使用します。",
    inputPlaceholder: "AI に実行してほしい内容を入力…",

    referenceImage: "参照画像",
    chooseReference: "参照画像を選択",
    removeReference: "参照画像を削除",
    result: "プロンプト結果",
    generateImage: "画像を生成",

    apply: "結果を適用",
    retry: "もう一度生成",
    cancel: "リクエストをキャンセル",
    close: "閉じる",
    processing: "AI が処理中…",
    reasoning: "モデルの推論過程",
    inputRequired: "AI への指示を入力してください",
    textRequired: "処理できるテキストがありません",
    shareTextRequired: "共有画像にできる内容がありません",
    referenceRequired: "参照画像を選択してください",
    errorUnavailable:
      "AI を利用できません。uTools でモデルを設定してから再試行してください。",
    errorCancelled: "AI リクエストをキャンセルしました。",
    errorAuth:
      "AI の認証に失敗しました。API キーまたはログイン状態を確認してください。",
    errorForbidden:
      "AI サービスへのアクセスが拒否されました。モデルの権限または接続先設定を確認してください。",
    errorTimeout:
      "AI リクエストがタイムアウトしました。しばらくしてから再試行してください。",
    errorServer:
      "AI サービスが一時的に利用できません。しばらくしてから再試行してください。",
    errorRateLimit:
      "AI リクエストが頻度または使用量の上限に達しました。しばらくしてから再試行してください。",
    errorNetwork:
      "AI のネットワークリクエストに失敗しました。接続を確認して再試行してください。",
    errorBadRequest:
      "モデル「{model}」がリクエストを拒否しました（400）。カスタムモデルのエンドポイント、認証、モデル名、OpenAI 互換形式を確認してください。",
    errorDefaultBadRequest:
      "既定のモデルがリクエストを拒否しました（400）。uTools AI にログインし、利用可能なモデルが設定されていることを確認するか、AI 設定でモデルを選択してください。",
    callFailed:
      "AI リクエストに失敗しました。しばらくしてから再試行してください。",
    invalidFormat: "AI の応答形式が無効です。もう一度生成してください。",
    applied: "AI のテキスト処理結果を適用しました",
    sourceChanged:
      "AI の処理中に原文が変更されました。新しい内容を上書きしないよう、もう一度生成してください。",

    imageInvalid: "PNG、JPEG、WebP、GIF の画像を選択してください",
    visionUnsupported:
      "現在のモデル「{model}」は画像理解に対応していません。AI 設定で画像入力に対応したモデルを選択してください。",
    visionUnknown:
      "現在のモデル「{model}」が画像理解に対応しているか確認できません。AI 設定で画像入力に明示的に対応したモデルを選択してください。このまま使用すると、参照画像を正しく理解できない、または逆生成プロンプトの品質が低下する可能性があります。",
    visionSupported: "画像理解に対応",
    fileDialogDetachFailed:
      "先に Ctrl+D を押して「闪念文本」を独立ウィンドウに切り離してください",
    formattingSystem:
      "あなたは正確なテキスト処理アシスタントです。ユーザーの指示に従って文章を修正し、意味と重要な情報を保持したうえで、修正後の全文だけを出力してください。説明は不要です。",
  },
  vi: {
    label: "Trợ lý AI",
    formatting: "Xử lý văn bản bằng AI",

    settings: "Trí tuệ nhân tạo",
    model: "Mô hình AI",
    modelAuto: "Mô hình mặc định",
    modelLoading: "Đang đọc các mô hình khả dụng…",
    modelUnavailable:
      "Không có danh sách mô hình; vẫn có thể dùng mô hình mặc định",
    refreshModels: "Làm mới danh sách mô hình",
    openModelsSettings: "Mở cài đặt mô hình AI của uTools",
    openPluginModelsSettings: "Mở cài đặt mô hình AI của plugin",
    formattingPrompt: "Prompt xử lý văn bản mặc định",

    promptHint: "Không bắt buộc. Để trống để dùng prompt tích hợp.",
    inputPlaceholder: "Mô tả việc bạn muốn AI thực hiện…",

    referenceImage: "Ảnh tham chiếu",
    chooseReference: "Chọn ảnh tham chiếu",
    removeReference: "Xóa ảnh tham chiếu",
    result: "Kết quả prompt",
    generateImage: "Tạo ảnh",

    apply: "Áp dụng kết quả",
    retry: "Tạo lại",
    cancel: "Hủy yêu cầu",
    close: "Đóng",
    processing: "AI đang xử lý…",
    reasoning: "Quá trình suy luận của mô hình",
    inputRequired: "Hãy nhập yêu cầu cho AI",
    textRequired: "Không có văn bản để xử lý",
    shareTextRequired: "Không có nội dung để tạo ảnh chia sẻ",
    referenceRequired: "Hãy chọn một ảnh tham chiếu",
    errorUnavailable:
      "AI hiện không khả dụng. Hãy cấu hình mô hình trong uTools rồi thử lại.",
    errorCancelled: "Yêu cầu AI đã bị hủy.",
    errorAuth:
      "Xác thực AI thất bại. Hãy kiểm tra khóa API hoặc trạng thái đăng nhập.",
    errorForbidden:
      "Dịch vụ AI đã từ chối truy cập. Hãy kiểm tra quyền mô hình hoặc cấu hình điểm cuối.",
    errorTimeout: "Yêu cầu AI đã hết thời gian chờ. Hãy thử lại sau.",
    errorServer: "Dịch vụ AI đang tạm thời gặp sự cố. Hãy thử lại sau.",
    errorRateLimit:
      "Yêu cầu AI đã chạm giới hạn tần suất hoặc hạn mức. Hãy thử lại sau.",
    errorNetwork: "Yêu cầu mạng AI thất bại. Hãy kiểm tra kết nối rồi thử lại.",
    errorBadRequest:
      "Mô hình “{model}” đã từ chối yêu cầu (400). Hãy kiểm tra địa chỉ điểm cuối, xác thực, tên mô hình và định dạng tương thích OpenAI của mô hình tùy chỉnh.",
    errorDefaultBadRequest:
      "Mô hình mặc định đã từ chối yêu cầu (400). Hãy xác nhận uTools AI đã đăng nhập và có mô hình khả dụng, hoặc chọn một mô hình trong cài đặt AI.",
    callFailed: "Yêu cầu AI thất bại. Hãy thử lại sau.",
    invalidFormat: "AI trả về định dạng không hợp lệ. Hãy tạo lại.",
    applied: "Đã áp dụng kết quả xử lý văn bản bằng AI",
    sourceChanged:
      "Văn bản gốc đã thay đổi trong khi AI xử lý. Hãy tạo lại để tránh ghi đè nội dung mới.",

    imageInvalid: "Hãy chọn ảnh PNG, JPEG, WebP hoặc GIF",
    visionUnsupported:
      "Mô hình hiện tại “{model}” không hỗ trợ hiểu hình ảnh. Hãy chọn mô hình hỗ trợ đầu vào thị giác trong cài đặt AI.",
    visionUnknown:
      "Không thể xác nhận mô hình hiện tại “{model}” có hỗ trợ hiểu hình ảnh hay không. Hãy chọn mô hình hỗ trợ đầu vào thị giác rõ ràng trong cài đặt AI. Nếu tiếp tục, mô hình có thể không hiểu đúng ảnh tham chiếu hoặc cho kết quả suy ngược kém.",
    visionSupported: "Hỗ trợ hiểu hình ảnh",
    fileDialogDetachFailed:
      "Trước tiên, hãy nhấn Ctrl+D để tách “闪念文本” thành cửa sổ độc lập",
    formattingSystem:
      "Bạn là trợ lý xử lý văn bản chính xác. Hãy sửa văn bản theo yêu cầu của người dùng, giữ nguyên ý nghĩa và mọi thông tin quan trọng, rồi chỉ xuất toàn bộ văn bản đã sửa mà không giải thích.",
  },
  ko: {
    label: "AI 도우미",
    formatting: "AI 텍스트 처리",

    settings: "인공지능",
    model: "AI 모델",
    modelAuto: "기본 모델",
    modelLoading: "사용 가능한 모델을 불러오는 중…",
    modelUnavailable:
      "모델 목록을 사용할 수 없습니다. 기본 모델은 계속 사용할 수 있습니다",
    refreshModels: "모델 목록 새로고침",
    openModelsSettings: "uTools AI 모델 설정 열기",
    openPluginModelsSettings: "플러그인 AI 모델 설정 열기",
    formattingPrompt: "기본 텍스트 처리 프롬프트",

    promptHint: "선택 사항입니다. 비워 두면 기본 제공 프롬프트를 사용합니다.",
    inputPlaceholder: "AI가 수행할 작업을 설명하세요…",

    referenceImage: "참조 이미지",
    chooseReference: "참조 이미지 선택",
    removeReference: "참조 이미지 제거",
    result: "프롬프트 결과",
    generateImage: "이미지 생성",

    apply: "결과 적용",
    retry: "다시 생성",
    cancel: "요청 취소",
    close: "닫기",
    processing: "AI 처리 중…",
    reasoning: "모델 추론 과정",
    inputRequired: "AI 요청을 입력하세요",
    textRequired: "처리할 텍스트가 없습니다",
    shareTextRequired: "공유 이미지로 만들 내용이 없습니다",
    referenceRequired: "참조 이미지를 선택하세요",
    errorUnavailable:
      "AI를 사용할 수 없습니다. uTools에서 모델을 설정한 후 다시 시도하세요.",
    errorCancelled: "AI 요청이 취소되었습니다.",
    errorAuth: "AI 인증에 실패했습니다. API 키 또는 로그인 상태를 확인하세요.",
    errorForbidden:
      "AI 서비스가 접근을 거부했습니다. 모델 권한 또는 엔드포인트 설정을 확인하세요.",
    errorTimeout: "AI 요청 시간이 초과되었습니다. 나중에 다시 시도하세요.",
    errorServer:
      "AI 서비스를 일시적으로 사용할 수 없습니다. 나중에 다시 시도하세요.",
    errorRateLimit:
      "AI 요청이 빈도 또는 할당량 한도에 도달했습니다. 나중에 다시 시도하세요.",
    errorNetwork:
      "AI 네트워크 요청에 실패했습니다. 연결을 확인한 후 다시 시도하세요.",
    errorBadRequest:
      "모델 “{model}”이 요청을 거부했습니다(400). 사용자 지정 모델의 엔드포인트, 인증, 모델 이름 및 OpenAI 호환 형식을 확인하세요.",
    errorDefaultBadRequest:
      "기본 모델이 요청을 거부했습니다(400). uTools AI에 로그인되어 있고 사용 가능한 모델이 설정되어 있는지 확인하거나 AI 설정에서 모델을 선택하세요.",
    callFailed: "AI 요청에 실패했습니다. 나중에 다시 시도하세요.",
    invalidFormat: "AI가 잘못된 형식으로 응답했습니다. 다시 생성하세요.",
    applied: "AI 텍스트 처리 결과를 적용했습니다",
    sourceChanged:
      "AI 처리 중 원문이 변경되었습니다. 새 내용을 덮어쓰지 않도록 다시 생성하세요.",

    imageInvalid: "PNG, JPEG, WebP 또는 GIF 이미지를 선택하세요",
    visionUnsupported:
      "현재 모델 “{model}”은 이미지 이해를 지원하지 않습니다. AI 설정에서 비전 입력을 지원하는 모델을 선택하세요.",
    visionUnknown:
      "현재 모델 “{model}”의 이미지 이해 지원 여부를 확인할 수 없습니다. AI 설정에서 비전 입력을 명시적으로 지원하는 모델을 선택하세요. 계속 사용하면 참조 이미지를 올바르게 이해하지 못하거나 역추출 결과의 품질이 떨어질 수 있습니다.",
    visionSupported: "이미지 이해 지원",
    fileDialogDetachFailed:
      "먼저 Ctrl+D를 눌러 “闪念文本”을 독립 창으로 분리하세요",
    formattingSystem:
      "당신은 정확한 텍스트 처리 도우미입니다. 사용자 요청에 따라 텍스트를 수정하고 의미와 모든 중요 정보를 유지한 뒤, 설명 없이 수정된 전체 텍스트만 출력하세요.",
  },
  es: {
    label: "Asistente de IA",
    formatting: "Procesamiento de texto con IA",

    settings: "Inteligencia artificial",
    model: "Modelo de IA",
    modelAuto: "Modelo predeterminado",
    modelLoading: "Cargando los modelos disponibles…",
    modelUnavailable:
      "No hay una lista de modelos disponible; aún puede usarse el modelo predeterminado",
    refreshModels: "Actualizar la lista de modelos",
    openModelsSettings: "Abrir los ajustes de modelos de IA de uTools",
    openPluginModelsSettings:
      "Abrir los ajustes de modelos de IA del complemento",
    formattingPrompt: "Prompt predeterminado para procesar texto",

    promptHint: "Opcional. Déjalo vacío para usar el prompt integrado.",
    inputPlaceholder: "Describe lo que quieres que haga la IA…",

    referenceImage: "Imagen de referencia",
    chooseReference: "Elegir imagen de referencia",
    removeReference: "Quitar imagen de referencia",
    result: "Resultado del prompt",
    generateImage: "Generar imagen",

    apply: "Aplicar resultado",
    retry: "Generar de nuevo",
    cancel: "Cancelar solicitud",
    close: "Cerrar",
    processing: "La IA está procesando…",
    reasoning: "Razonamiento del modelo",
    inputRequired: "Introduce una solicitud para la IA",
    textRequired: "No hay texto que procesar",
    shareTextRequired: "No hay contenido para una imagen compartida",
    referenceRequired: "Elige una imagen de referencia",
    errorUnavailable:
      "La IA no está disponible. Configura un modelo en uTools y vuelve a intentarlo.",
    errorCancelled: "Se canceló la solicitud de IA.",
    errorAuth:
      "Falló la autenticación de IA. Comprueba la clave API o el estado de inicio de sesión.",
    errorForbidden:
      "El servicio de IA denegó el acceso. Comprueba los permisos del modelo o la configuración del endpoint.",
    errorTimeout:
      "La solicitud de IA agotó el tiempo de espera. Inténtalo de nuevo más tarde.",
    errorServer:
      "El servicio de IA no está disponible temporalmente. Inténtalo de nuevo más tarde.",
    errorRateLimit:
      "La solicitud de IA alcanzó el límite de frecuencia o cuota. Inténtalo de nuevo más tarde.",
    errorNetwork:
      "Falló la solicitud de red de la IA. Comprueba la conexión y vuelve a intentarlo.",
    errorBadRequest:
      "El modelo «{model}» rechazó la solicitud (400). Comprueba el endpoint, la autenticación, el nombre del modelo y el formato compatible con OpenAI del modelo personalizado.",
    errorDefaultBadRequest:
      "El modelo predeterminado rechazó la solicitud (400). Confirma que has iniciado sesión en uTools AI y que hay un modelo disponible, o selecciona uno en los ajustes de IA.",
    callFailed: "Falló la solicitud de IA. Inténtalo de nuevo más tarde.",
    invalidFormat:
      "La IA devolvió un formato no válido. Genera el resultado de nuevo.",
    applied: "Se aplicó el resultado del procesamiento de texto con IA",
    sourceChanged:
      "El texto original cambió mientras la IA estaba procesando. Genera el resultado de nuevo para no sobrescribir el contenido más reciente.",

    imageInvalid: "Elige una imagen PNG, JPEG, WebP o GIF",
    visionUnsupported:
      "El modelo actual «{model}» no admite la comprensión de imágenes. Elige un modelo con entrada visual en los ajustes de IA.",
    visionUnknown:
      "No se puede confirmar si el modelo actual «{model}» admite la comprensión de imágenes. Elige en los ajustes de IA un modelo que admita explícitamente la entrada visual. Si continúas, es posible que no interprete correctamente la imagen de referencia o que el resultado de ingeniería inversa sea deficiente.",
    visionSupported: "Admite la comprensión de imágenes",
    fileDialogDetachFailed:
      "Primero pulsa Ctrl+D para separar «闪念文本» en una ventana independiente",
    formattingSystem:
      "Eres un asistente preciso de procesamiento de texto. Modifica el texto según la solicitud del usuario, conserva el significado y toda la información importante, y devuelve únicamente el texto completo modificado, sin explicaciones.",
  },
  fr: {
    label: "Assistant IA",
    formatting: "Traitement de texte par IA",

    settings: "Intelligence artificielle",
    model: "Modèle d’IA",
    modelAuto: "Modèle par défaut",
    modelLoading: "Chargement des modèles disponibles…",
    modelUnavailable:
      "Aucune liste de modèles n’est disponible ; le modèle par défaut reste utilisable",
    refreshModels: "Actualiser la liste des modèles",
    openModelsSettings: "Ouvrir les paramètres des modèles IA de uTools",
    openPluginModelsSettings: "Ouvrir les paramètres des modèles IA du plugin",
    formattingPrompt: "Prompt de traitement de texte par défaut",

    promptHint: "Facultatif. Laissez vide pour utiliser le prompt intégré.",
    inputPlaceholder: "Décrivez ce que l’IA doit effectuer…",

    referenceImage: "Image de référence",
    chooseReference: "Choisir l’image de référence",
    removeReference: "Retirer l’image de référence",
    result: "Résultat du prompt",
    generateImage: "Générer l’image",

    apply: "Appliquer le résultat",
    retry: "Générer à nouveau",
    cancel: "Annuler la requête",
    close: "Fermer",
    processing: "Traitement par l’IA…",
    reasoning: "Raisonnement du modèle",
    inputRequired: "Saisissez une demande pour l’IA",
    textRequired: "Aucun texte à traiter",
    shareTextRequired: "Aucun contenu pour une image à partager",
    referenceRequired: "Choisissez une image de référence",
    errorUnavailable:
      "L’IA est indisponible. Configurez un modèle dans uTools, puis réessayez.",
    errorCancelled: "La requête IA a été annulée.",
    errorAuth:
      "Échec de l’authentification IA. Vérifiez la clé API ou l’état de connexion.",
    errorForbidden:
      "Le service d’IA a refusé l’accès. Vérifiez les autorisations du modèle ou la configuration du point de terminaison.",
    errorTimeout: "La requête IA a expiré. Réessayez plus tard.",
    errorServer:
      "Le service d’IA est temporairement indisponible. Réessayez plus tard.",
    errorRateLimit:
      "La requête IA a atteint une limite de fréquence ou de quota. Réessayez plus tard.",
    errorNetwork:
      "Échec de la requête réseau de l’IA. Vérifiez votre connexion, puis réessayez.",
    errorBadRequest:
      "Le modèle « {model} » a refusé la requête (400). Vérifiez le point de terminaison, l’authentification, le nom et le format compatible OpenAI du modèle personnalisé.",
    errorDefaultBadRequest:
      "Le modèle par défaut a refusé la requête (400). Vérifiez que uTools AI est connecté et qu’un modèle est disponible, ou sélectionnez-en un dans les paramètres IA.",
    callFailed: "Échec de la requête IA. Réessayez plus tard.",
    invalidFormat:
      "L’IA a renvoyé un format non valide. Générez à nouveau le résultat.",
    applied: "Résultat du traitement de texte par IA appliqué",
    sourceChanged:
      "Le texte source a changé pendant le traitement par l’IA. Générez à nouveau le résultat pour éviter d’écraser le contenu récent.",

    imageInvalid: "Choisissez une image PNG, JPEG, WebP ou GIF",
    visionUnsupported:
      "Le modèle actuel « {model} » ne prend pas en charge la compréhension des images. Choisissez un modèle acceptant les entrées visuelles dans les paramètres IA.",
    visionUnknown:
      "Impossible de confirmer si le modèle actuel « {model} » prend en charge la compréhension des images. Dans les paramètres IA, choisissez un modèle prenant explicitement en charge les entrées visuelles. Si vous continuez, l’image de référence risque d’être mal comprise ou le résultat de rétroconception d’être médiocre.",
    visionSupported: "Prend en charge la compréhension des images",
    fileDialogDetachFailed:
      "Appuyez d’abord sur Ctrl+D pour détacher « 闪念文本 » dans une fenêtre indépendante",
    formattingSystem:
      "Vous êtes un assistant précis de traitement de texte. Modifiez le texte selon la demande de l’utilisateur, conservez le sens et toutes les informations importantes, puis renvoyez uniquement le texte complet modifié, sans explication.",
  },
  "pt-BR": {
    label: "Assistente de IA",
    formatting: "Processamento de texto com IA",

    settings: "Inteligência artificial",
    model: "Modelo de IA",
    modelAuto: "Modelo padrão",
    modelLoading: "Carregando modelos disponíveis…",
    modelUnavailable:
      "Nenhuma lista de modelos está disponível; o modelo padrão ainda pode ser usado",
    refreshModels: "Atualizar lista de modelos",
    openModelsSettings: "Abrir as configurações de modelos de IA do uTools",
    openPluginModelsSettings:
      "Abrir as configurações de modelos de IA do plugin",
    formattingPrompt: "Prompt padrão para processamento de texto",

    promptHint: "Opcional. Deixe em branco para usar o prompt integrado.",
    inputPlaceholder: "Descreva o que você quer que a IA faça…",

    referenceImage: "Imagem de referência",
    chooseReference: "Escolher imagem de referência",
    removeReference: "Remover imagem de referência",
    result: "Resultado do prompt",
    generateImage: "Gerar imagem",

    apply: "Aplicar resultado",
    retry: "Gerar novamente",
    cancel: "Cancelar solicitação",
    close: "Fechar",
    processing: "A IA está processando…",
    reasoning: "Raciocínio do modelo",
    inputRequired: "Digite uma solicitação para a IA",
    textRequired: "Não há texto para processar",
    shareTextRequired: "Não há conteúdo para uma imagem de compartilhamento",
    referenceRequired: "Escolha uma imagem de referência",
    errorUnavailable:
      "A IA não está disponível. Configure um modelo no uTools e tente novamente.",
    errorCancelled: "A solicitação de IA foi cancelada.",
    errorAuth:
      "Falha na autenticação da IA. Verifique a chave de API ou o estado de login.",
    errorForbidden:
      "O serviço de IA negou o acesso. Verifique as permissões do modelo ou a configuração do endpoint.",
    errorTimeout: "A solicitação de IA expirou. Tente novamente mais tarde.",
    errorServer:
      "O serviço de IA está temporariamente indisponível. Tente novamente mais tarde.",
    errorRateLimit:
      "A solicitação de IA atingiu o limite de frequência ou cota. Tente novamente mais tarde.",
    errorNetwork:
      "Falha na solicitação de rede da IA. Verifique sua conexão e tente novamente.",
    errorBadRequest:
      "O modelo “{model}” rejeitou a solicitação (400). Verifique o endpoint, a autenticação, o nome e o formato compatível com OpenAI do modelo personalizado.",
    errorDefaultBadRequest:
      "O modelo padrão rejeitou a solicitação (400). Confirme que o uTools AI está conectado e tem um modelo disponível, ou selecione um modelo nas configurações de IA.",
    callFailed: "Falha na solicitação de IA. Tente novamente mais tarde.",
    invalidFormat: "A IA retornou um formato inválido. Gere novamente.",
    applied: "Resultado do processamento de texto com IA aplicado",
    sourceChanged:
      "O texto original mudou durante o processamento da IA. Gere novamente para não sobrescrever o conteúdo mais recente.",

    imageInvalid: "Escolha uma imagem PNG, JPEG, WebP ou GIF",
    visionUnsupported:
      "O modelo atual “{model}” não oferece compreensão de imagens. Escolha um modelo com entrada visual nas configurações de IA.",
    visionUnknown:
      "Não foi possível confirmar se o modelo atual “{model}” é compatível com compreensão de imagens. Nas configurações de IA, selecione um modelo que aceite explicitamente entrada visual. Se continuar, a imagem de referência pode não ser compreendida corretamente ou o resultado da engenharia reversa pode ser insatisfatório.",
    visionSupported: "Oferece compreensão de imagens",
    fileDialogDetachFailed:
      "Primeiro, pressione Ctrl+D para separar “闪念文本” em uma janela independente",
    formattingSystem:
      "Você é um assistente preciso de processamento de texto. Modifique o texto conforme a solicitação do usuário, preserve o significado e todas as informações importantes e retorne somente o texto completo modificado, sem explicações.",
  },
  "pt-PT": {
    label: "Assistente de IA",
    formatting: "Processamento de texto com IA",

    settings: "Inteligência artificial",
    model: "Modelo de IA",
    modelAuto: "Modelo predefinido",
    modelLoading: "A carregar modelos disponíveis…",
    modelUnavailable:
      "Não está disponível uma lista de modelos; o modelo predefinido continua disponível",
    refreshModels: "Atualizar lista de modelos",
    openModelsSettings: "Abrir as definições dos modelos de IA do uTools",
    openPluginModelsSettings: "Abrir as definições dos modelos de IA do plugin",
    formattingPrompt: "Prompt predefinido para processamento de texto",

    promptHint: "Opcional. Deixe em branco para utilizar o prompt incorporado.",
    inputPlaceholder: "Descreva o que pretende que a IA faça…",

    referenceImage: "Imagem de referência",
    chooseReference: "Escolher imagem de referência",
    removeReference: "Remover imagem de referência",
    result: "Resultado do prompt",
    generateImage: "Gerar imagem",

    apply: "Aplicar resultado",
    retry: "Gerar novamente",
    cancel: "Cancelar pedido",
    close: "Fechar",
    processing: "A IA está a processar…",
    reasoning: "Raciocínio do modelo",
    inputRequired: "Introduza um pedido para a IA",
    textRequired: "Não há texto para processar",
    shareTextRequired: "Não há conteúdo para uma imagem de partilha",
    referenceRequired: "Escolha uma imagem de referência",
    errorUnavailable:
      "A IA não está disponível. Configure um modelo no uTools e tente novamente.",
    errorCancelled: "O pedido de IA foi cancelado.",
    errorAuth:
      "Falha na autenticação da IA. Verifique a chave de API ou o estado de início de sessão.",
    errorForbidden:
      "O serviço de IA recusou o acesso. Verifique as permissões do modelo ou a configuração do endpoint.",
    errorTimeout:
      "O pedido de IA excedeu o tempo limite. Tente novamente mais tarde.",
    errorServer:
      "O serviço de IA está temporariamente indisponível. Tente novamente mais tarde.",
    errorRateLimit:
      "O pedido de IA atingiu o limite de frequência ou quota. Tente novamente mais tarde.",
    errorNetwork:
      "Falha no pedido de rede da IA. Verifique a ligação e tente novamente.",
    errorBadRequest:
      "O modelo “{model}” recusou o pedido (400). Verifique o endpoint, a autenticação, o nome e o formato compatível com OpenAI do modelo personalizado.",
    errorDefaultBadRequest:
      "O modelo predefinido recusou o pedido (400). Confirme que o uTools AI tem sessão iniciada e um modelo disponível, ou selecione um modelo nas definições de IA.",
    callFailed: "Falha no pedido de IA. Tente novamente mais tarde.",
    invalidFormat: "A IA devolveu um formato inválido. Gere novamente.",
    applied: "Resultado do processamento de texto com IA aplicado",
    sourceChanged:
      "O texto original foi alterado durante o processamento da IA. Gere novamente para não substituir o conteúdo mais recente.",

    imageInvalid: "Escolha uma imagem PNG, JPEG, WebP ou GIF",
    visionUnsupported:
      "O modelo atual “{model}” não suporta a compreensão de imagens. Escolha um modelo com entrada visual nas definições de IA.",
    visionUnknown:
      "Não é possível confirmar se o modelo atual “{model}” suporta a compreensão de imagens. Nas definições de IA, selecione um modelo que aceite explicitamente entrada visual. Se continuar, a imagem de referência poderá não ser compreendida corretamente ou o resultado da análise inversa poderá ser insatisfatório.",
    visionSupported: "Suporta a compreensão de imagens",
    fileDialogDetachFailed:
      "Primeiro, prima Ctrl+D para separar “闪念文本” numa janela independente",
    formattingSystem:
      "É um assistente preciso de processamento de texto. Altere o texto de acordo com o pedido do utilizador, preserve o significado e todas as informações importantes e devolva apenas o texto completo alterado, sem explicações.",
  },
  ru: {
    label: "Помощник ИИ",
    formatting: "Обработка текста с помощью ИИ",

    settings: "Искусственный интеллект",
    model: "Модель ИИ",
    modelAuto: "Модель по умолчанию",
    modelLoading: "Загрузка доступных моделей…",
    modelUnavailable:
      "Список моделей недоступен; модель по умолчанию по-прежнему можно использовать",
    refreshModels: "Обновить список моделей",
    openModelsSettings: "Открыть настройки моделей ИИ uTools",
    openPluginModelsSettings: "Открыть настройки моделей ИИ плагина",
    formattingPrompt: "Промпт обработки текста по умолчанию",

    promptHint:
      "Необязательно. Оставьте поле пустым, чтобы использовать встроенный промпт.",
    inputPlaceholder: "Опишите, что должен сделать ИИ…",

    referenceImage: "Референсное изображение",
    chooseReference: "Выбрать референс",
    removeReference: "Удалить референс",
    result: "Результат промпта",
    generateImage: "Создать изображение",

    apply: "Применить результат",
    retry: "Создать заново",
    cancel: "Отменить запрос",
    close: "Закрыть",
    processing: "ИИ обрабатывает запрос…",
    reasoning: "Ход рассуждений модели",
    inputRequired: "Введите запрос для ИИ",
    textRequired: "Нет текста для обработки",
    shareTextRequired: "Нет содержимого для изображения",
    referenceRequired: "Выберите референсное изображение",
    errorUnavailable:
      "ИИ недоступен. Настройте модель в uTools и повторите попытку.",
    errorCancelled: "Запрос к ИИ отменён.",
    errorAuth:
      "Ошибка аутентификации ИИ. Проверьте ключ API или состояние входа.",
    errorForbidden:
      "Сервис ИИ отказал в доступе. Проверьте разрешения модели или настройки конечной точки.",
    errorTimeout:
      "Время ожидания запроса к ИИ истекло. Повторите попытку позже.",
    errorServer: "Сервис ИИ временно недоступен. Повторите попытку позже.",
    errorRateLimit:
      "Достигнут лимит частоты или квоты запросов к ИИ. Повторите попытку позже.",
    errorNetwork:
      "Сетевой запрос к ИИ завершился ошибкой. Проверьте подключение и повторите попытку.",
    errorBadRequest:
      "Модель «{model}» отклонила запрос (400). Проверьте конечную точку, аутентификацию, имя и OpenAI-совместимый формат пользовательской модели.",
    errorDefaultBadRequest:
      "Модель по умолчанию отклонила запрос (400). Убедитесь, что выполнен вход в uTools AI и доступна модель, либо выберите модель в настройках ИИ.",
    callFailed: "Запрос к ИИ завершился ошибкой. Повторите попытку позже.",
    invalidFormat:
      "ИИ вернул данные в неверном формате. Создайте результат заново.",
    applied: "Результат обработки текста с помощью ИИ применён",
    sourceChanged:
      "Исходный текст изменился во время обработки ИИ. Создайте результат заново, чтобы не перезаписать новое содержимое.",

    imageInvalid: "Выберите изображение PNG, JPEG, WebP или GIF",
    visionUnsupported:
      "Текущая модель «{model}» не поддерживает понимание изображений. Выберите модель с визуальным вводом в настройках ИИ.",
    visionUnknown:
      "Не удалось подтвердить, поддерживает ли текущая модель «{model}» понимание изображений. В настройках ИИ выберите модель с явно заявленной поддержкой визуального ввода. Если продолжить, модель может неверно понять референсное изображение или дать неудовлетворительный результат обратного анализа.",
    visionSupported: "Поддерживает понимание изображений",
    fileDialogDetachFailed:
      "Сначала нажмите Ctrl+D, чтобы отделить «闪念文本» в отдельное окно",
    formattingSystem:
      "Вы — точный помощник по обработке текста. Измените текст в соответствии с запросом пользователя, сохранив смысл и всю важную информацию, и выведите только полный изменённый текст без пояснений.",
  },
  de: {
    label: "KI-Assistent",
    formatting: "KI-Textverarbeitung",

    settings: "Künstliche Intelligenz",
    model: "KI-Modell",
    modelAuto: "Standardmodell",
    modelLoading: "Verfügbare Modelle werden geladen…",
    modelUnavailable:
      "Keine Modellliste verfügbar; das Standardmodell kann weiterhin verwendet werden",
    refreshModels: "Modellliste aktualisieren",
    openModelsSettings: "uTools-KI-Modelleinstellungen öffnen",
    openPluginModelsSettings: "KI-Modelleinstellungen des Plugins öffnen",
    formattingPrompt: "Standardprompt für die Textverarbeitung",

    promptHint:
      "Optional. Leer lassen, um den integrierten Prompt zu verwenden.",
    inputPlaceholder: "Beschreiben Sie, was die KI tun soll…",

    referenceImage: "Referenzbild",
    chooseReference: "Referenzbild auswählen",
    removeReference: "Referenzbild entfernen",
    result: "Prompt-Ergebnis",
    generateImage: "Bild erzeugen",

    apply: "Ergebnis anwenden",
    retry: "Erneut erzeugen",
    cancel: "Anfrage abbrechen",
    close: "Schließen",
    processing: "KI verarbeitet die Anfrage…",
    reasoning: "Schlussfolgerungen des Modells",
    inputRequired: "Geben Sie eine KI-Anweisung ein",
    textRequired: "Es gibt keinen Text zum Verarbeiten",
    shareTextRequired: "Es gibt keinen Inhalt für ein Freigabebild",
    referenceRequired: "Wählen Sie ein Referenzbild aus",
    errorUnavailable:
      "KI ist nicht verfügbar. Konfigurieren Sie ein Modell in uTools und versuchen Sie es erneut.",
    errorCancelled: "Die KI-Anfrage wurde abgebrochen.",
    errorAuth:
      "KI-Authentifizierung fehlgeschlagen. Prüfen Sie den API-Schlüssel oder den Anmeldestatus.",
    errorForbidden:
      "Der KI-Dienst hat den Zugriff verweigert. Prüfen Sie Modellberechtigungen oder Endpunktkonfiguration.",
    errorTimeout:
      "Zeitüberschreitung bei der KI-Anfrage. Versuchen Sie es später erneut.",
    errorServer:
      "Der KI-Dienst ist vorübergehend nicht verfügbar. Versuchen Sie es später erneut.",
    errorRateLimit:
      "Die KI-Anfrage hat das Häufigkeits- oder Kontingentlimit erreicht. Versuchen Sie es später erneut.",
    errorNetwork:
      "Die Netzwerkanfrage an die KI ist fehlgeschlagen. Prüfen Sie die Verbindung und versuchen Sie es erneut.",
    errorBadRequest:
      "Das Modell „{model}“ hat die Anfrage abgelehnt (400). Prüfen Sie Endpunkt, Authentifizierung, Modellnamen und das OpenAI-kompatible Format des benutzerdefinierten Modells.",
    errorDefaultBadRequest:
      "Das Standardmodell hat die Anfrage abgelehnt (400). Stellen Sie sicher, dass uTools AI angemeldet und ein Modell verfügbar ist, oder wählen Sie in den KI-Einstellungen ein Modell aus.",
    callFailed:
      "Die KI-Anfrage ist fehlgeschlagen. Versuchen Sie es später erneut.",
    invalidFormat:
      "Die KI hat ein ungültiges Format zurückgegeben. Erzeugen Sie das Ergebnis erneut.",
    applied: "Ergebnis der KI-Textverarbeitung angewendet",
    sourceChanged:
      "Der Ausgangstext wurde während der KI-Verarbeitung geändert. Erzeugen Sie das Ergebnis erneut, damit neuere Inhalte nicht überschrieben werden.",

    imageInvalid: "Wählen Sie ein PNG-, JPEG-, WebP- oder GIF-Bild aus",
    visionUnsupported:
      "Das aktuelle Modell „{model}“ unterstützt kein Bildverständnis. Wählen Sie in den KI-Einstellungen ein Modell mit visueller Eingabe.",
    visionUnknown:
      "Es lässt sich nicht feststellen, ob das aktuelle Modell „{model}“ Bilder verstehen kann. Wählen Sie in den KI-Einstellungen ein Modell, das visuelle Eingaben ausdrücklich unterstützt. Wenn Sie fortfahren, wird das Referenzbild möglicherweise nicht richtig verstanden oder die Rückanalyse liefert schlechte Ergebnisse.",
    visionSupported: "Unterstützt Bildverständnis",
    fileDialogDetachFailed:
      "Drücken Sie zuerst Ctrl+D, um „闪念文本“ in ein eigenes Fenster abzutrennen",
    formattingSystem:
      "Sie sind ein präziser Assistent für die Textverarbeitung. Ändern Sie den Text entsprechend der Benutzeranweisung, bewahren Sie Bedeutung und alle wichtigen Informationen und geben Sie ausschließlich den vollständigen geänderten Text ohne Erklärung aus.",
  },
  it: {
    label: "Assistente AI",
    formatting: "Elaborazione del testo con AI",

    settings: "Intelligenza artificiale",
    model: "Modello AI",
    modelAuto: "Modello predefinito",
    modelLoading: "Caricamento dei modelli disponibili…",
    modelUnavailable:
      "Non è disponibile alcun elenco di modelli; è comunque possibile usare il modello predefinito",
    refreshModels: "Aggiorna elenco modelli",
    openModelsSettings: "Apri le impostazioni dei modelli AI di uTools",
    openPluginModelsSettings: "Apri le impostazioni dei modelli AI del plugin",
    formattingPrompt: "Prompt predefinito per l’elaborazione del testo",

    promptHint: "Facoltativo. Lascia vuoto per usare il prompt integrato.",
    inputPlaceholder: "Descrivi cosa vuoi che faccia l’AI…",

    referenceImage: "Immagine di riferimento",
    chooseReference: "Scegli immagine di riferimento",
    removeReference: "Rimuovi immagine di riferimento",
    result: "Risultato del prompt",
    generateImage: "Genera immagine",

    apply: "Applica risultato",
    retry: "Genera di nuovo",
    cancel: "Annulla richiesta",
    close: "Chiudi",
    processing: "Elaborazione AI in corso…",
    reasoning: "Ragionamento del modello",
    inputRequired: "Inserisci una richiesta per l’AI",
    textRequired: "Non c’è testo da elaborare",
    shareTextRequired: "Non c’è contenuto per un’immagine da condividere",
    referenceRequired: "Scegli un’immagine di riferimento",
    errorUnavailable:
      "L’AI non è disponibile. Configura un modello in uTools e riprova.",
    errorCancelled: "La richiesta AI è stata annullata.",
    errorAuth:
      "Autenticazione AI non riuscita. Controlla la chiave API o lo stato di accesso.",
    errorForbidden:
      "Il servizio AI ha negato l’accesso. Controlla le autorizzazioni del modello o la configurazione dell’endpoint.",
    errorTimeout: "La richiesta AI è scaduta. Riprova più tardi.",
    errorServer:
      "Il servizio AI è temporaneamente non disponibile. Riprova più tardi.",
    errorRateLimit:
      "La richiesta AI ha raggiunto il limite di frequenza o quota. Riprova più tardi.",
    errorNetwork:
      "La richiesta di rete AI non è riuscita. Controlla la connessione e riprova.",
    errorBadRequest:
      "Il modello “{model}” ha rifiutato la richiesta (400). Controlla endpoint, autenticazione, nome e formato compatibile con OpenAI del modello personalizzato.",
    errorDefaultBadRequest:
      "Il modello predefinito ha rifiutato la richiesta (400). Verifica che uTools AI abbia effettuato l’accesso e disponga di un modello, oppure selezionane uno nelle impostazioni AI.",
    callFailed: "La richiesta AI non è riuscita. Riprova più tardi.",
    invalidFormat:
      "L’AI ha restituito un formato non valido. Genera di nuovo il risultato.",
    applied: "Risultato dell’elaborazione del testo con AI applicato",
    sourceChanged:
      "Il testo originale è cambiato durante l’elaborazione AI. Genera di nuovo il risultato per non sovrascrivere il contenuto più recente.",

    imageInvalid: "Scegli un’immagine PNG, JPEG, WebP o GIF",
    visionUnsupported:
      "Il modello attuale “{model}” non supporta la comprensione delle immagini. Scegli un modello con input visivo nelle impostazioni AI.",
    visionUnknown:
      "Non è possibile confermare se il modello attuale “{model}” supporti la comprensione delle immagini. Nelle impostazioni AI, scegli un modello che supporti esplicitamente l’input visivo. Continuando, l’immagine di riferimento potrebbe non essere interpretata correttamente oppure il risultato dell’analisi inversa potrebbe essere scadente.",
    visionSupported: "Supporta la comprensione delle immagini",
    fileDialogDetachFailed:
      "Prima premi Ctrl+D per separare “闪念文本” in una finestra indipendente",
    formattingSystem:
      "Sei un assistente preciso per l’elaborazione del testo. Modifica il testo in base alla richiesta dell’utente, conserva il significato e tutte le informazioni importanti e restituisci solo il testo completo modificato, senza spiegazioni.",
  },
};

const localizedImageGenerationCopy = {
  "zh-HK": {
    imageGenerationPlaceholder: "描述要生成的畫面、風格、比例或細節…",
    imageOutputUnavailable:
      "模型沒有傳回圖片資料，請在 uTools AI 設定中選擇支援圖片輸出的模型。",
    imageGenerationSystem:
      "你是圖像生成助手。根據使用者要求生成圖片；如果目前模型支援圖片輸出，請直接傳回圖片資料，不要只返回文字說明。",
  },
  "zh-TW": {
    imageGenerationPlaceholder: "描述要生成的畫面、風格、比例或細節…",
    imageOutputUnavailable:
      "模型沒有回傳圖片資料，請在 uTools AI 設定中選擇支援圖片輸出的模型。",
    imageGenerationSystem:
      "你是影像生成助手。根據使用者要求生成圖片；如果目前模型支援圖片輸出，請直接回傳圖片資料，不要只回傳文字說明。",
  },
  ja: {
    imageGenerationPlaceholder:
      "生成する画像の場面、スタイル、比率、細部を説明してください…",
    imageOutputUnavailable:
      "モデルが画像データを返しませんでした。uTools AI 設定で画像出力に対応したモデルを選択してください。",
    imageGenerationSystem:
      "あなたは画像生成アシスタントです。ユーザーの要求から画像を生成し、現在のモデルが画像出力に対応している場合は説明文だけでなく画像データを返してください。",
  },
  vi: {
    imageGenerationPlaceholder:
      "Mô tả cảnh, phong cách, tỷ lệ hoặc chi tiết cần tạo…",
    imageOutputUnavailable:
      "Mô hình không trả về dữ liệu ảnh. Hãy chọn mô hình hỗ trợ xuất ảnh trong cài đặt AI của uTools.",
    imageGenerationSystem:
      "Bạn là trợ lý tạo ảnh. Hãy tạo ảnh theo yêu cầu của người dùng; nếu mô hình hiện tại hỗ trợ xuất ảnh, hãy trả về dữ liệu ảnh thay vì chỉ mô tả bằng văn bản.",
  },
  ko: {
    imageGenerationPlaceholder:
      "생성할 장면, 스타일, 비율 또는 세부 사항을 설명하세요…",
    imageOutputUnavailable:
      "모델이 이미지 데이터를 반환하지 않았습니다. uTools AI 설정에서 이미지 출력을 지원하는 모델을 선택하세요.",
    imageGenerationSystem:
      "당신은 이미지 생성 도우미입니다. 사용자의 요청에 따라 이미지를 생성하고, 현재 모델이 이미지 출력을 지원하면 텍스트 설명만이 아니라 이미지 데이터를 직접 반환하세요.",
  },
  es: {
    imageGenerationPlaceholder:
      "Describe la escena, el estilo, la proporción o los detalles que quieres generar…",
    imageOutputUnavailable:
      "El modelo no devolvió datos de imagen. Elige un modelo compatible con salida de imágenes en la configuración de uTools AI.",
    imageGenerationSystem:
      "Eres un asistente de generación de imágenes. Genera una imagen a partir de la solicitud del usuario y devuelve datos de imagen directamente cuando el modelo lo permita, en lugar de solo una descripción.",
  },
  fr: {
    imageGenerationPlaceholder:
      "Décrivez la scène, le style, le format ou les détails à générer…",
    imageOutputUnavailable:
      "Le modèle n’a renvoyé aucune donnée d’image. Choisissez un modèle prenant en charge la sortie d’images dans les réglages AI de uTools.",
    imageGenerationSystem:
      "Vous êtes un assistant de génération d’images. Générez une image selon la demande et renvoyez directement ses données lorsque le modèle prend en charge la sortie d’images, plutôt qu’une simple description.",
  },
  "pt-BR": {
    imageGenerationPlaceholder:
      "Descreva a cena, o estilo, a proporção ou os detalhes a gerar…",
    imageOutputUnavailable:
      "O modelo não retornou dados de imagem. Escolha um modelo compatível com saída de imagens nas configurações de IA do uTools.",
    imageGenerationSystem:
      "Você é um assistente de geração de imagens. Gere uma imagem a partir do pedido do usuário e retorne os dados da imagem diretamente quando o modelo oferecer essa saída, em vez de apenas descrevê-la.",
  },
  "pt-PT": {
    imageGenerationPlaceholder:
      "Descreva a cena, o estilo, a proporção ou os detalhes a gerar…",
    imageOutputUnavailable:
      "O modelo não devolveu dados de imagem. Escolha um modelo compatível com saída de imagens nas definições de IA do uTools.",
    imageGenerationSystem:
      "É um assistente de geração de imagens. Gere uma imagem a partir do pedido do utilizador e devolva diretamente os dados da imagem quando o modelo suportar essa saída, em vez de apresentar apenas uma descrição.",
  },
  ru: {
    imageGenerationPlaceholder:
      "Опишите сцену, стиль, соотношение сторон или детали для генерации…",
    imageOutputUnavailable:
      "Модель не вернула данные изображения. Выберите модель с поддержкой вывода изображений в настройках ИИ uTools.",
    imageGenerationSystem:
      "Вы — помощник для генерации изображений. Создайте изображение по запросу пользователя и верните данные изображения напрямую, если текущая модель поддерживает такой вывод, а не только текстовое описание.",
  },
  de: {
    imageGenerationPlaceholder:
      "Beschreiben Sie Szene, Stil, Seitenverhältnis oder Details für die Generierung…",
    imageOutputUnavailable:
      "Das Modell hat keine Bilddaten zurückgegeben. Wählen Sie in den uTools-KI-Einstellungen ein Modell mit Bildausgabe.",
    imageGenerationSystem:
      "Sie sind ein Assistent zur Bildgenerierung. Erstellen Sie anhand der Benutzeranfrage ein Bild und geben Sie bei unterstützter Bildausgabe direkt Bilddaten statt nur einer Beschreibung zurück.",
  },
  it: {
    imageGenerationPlaceholder:
      "Descrivi la scena, lo stile, le proporzioni o i dettagli da generare…",
    imageOutputUnavailable:
      "Il modello non ha restituito dati immagine. Scegli un modello che supporti l’output di immagini nelle impostazioni AI di uTools.",
    imageGenerationSystem:
      "Sei un assistente per la generazione di immagini. Genera un’immagine dalla richiesta dell’utente e restituisci direttamente i dati immagine quando il modello supporta questo output, invece di una sola descrizione.",
  },
};

const localizedImageApiErrorCopy = {
  "zh-HK":
    "模型返回的是 Images API 圖片回應，但目前 uTools AI 自訂模型只支援 Chat Completions，無法讀取此回應。請改用支援 Chat Completions 圖片輸出的模型，或等待 uTools 支援 Images API。",
  "zh-TW":
    "模型回傳的是 Images API 圖片回應，但目前 uTools AI 自訂模型只支援 Chat Completions，無法讀取此回應。請改用支援 Chat Completions 圖片輸出的模型，或等待 uTools 支援 Images API。",
  ja: "モデルは Images API 形式の画像応答を返しましたが、現在の uTools AI カスタムモデルは Chat Completions 応答のみ対応しています。Chat Completions の画像出力に対応するモデルを選択するか、uTools の Images API 対応をお待ちください。",
  vi: "Mô hình trả về phản hồi ảnh của Images API, nhưng mô hình tùy chỉnh uTools AI hiện chỉ hỗ trợ phản hồi Chat Completions. Hãy chọn mô hình hỗ trợ xuất ảnh qua Chat Completions hoặc chờ uTools hỗ trợ Images API.",
  ko: "모델이 Images API 이미지 응답을 반환했지만 현재 uTools AI 사용자 지정 모델은 Chat Completions 응답만 지원합니다. Chat Completions 이미지 출력을 지원하는 모델을 선택하거나 uTools의 Images API 지원을 기다리세요.",
  es: "El modelo devolvió una respuesta de imagen de Images API, pero los modelos personalizados de uTools AI solo admiten respuestas de Chat Completions. Elige un modelo con salida de imágenes mediante Chat Completions o espera a que uTools admita Images API.",
  fr: "Le modèle a renvoyé une réponse d’image de l’Images API, mais les modèles personnalisés uTools AI ne prennent en charge que les réponses Chat Completions. Choisissez un modèle avec sortie d’image via Chat Completions ou attendez la prise en charge de l’Images API par uTools.",
  "pt-BR":
    "O modelo retornou uma resposta de imagem da Images API, mas os modelos personalizados do uTools AI aceitam apenas respostas do Chat Completions. Escolha um modelo com saída de imagens via Chat Completions ou aguarde o suporte do uTools à Images API.",
  "pt-PT":
    "O modelo devolveu uma resposta de imagem da Images API, mas os modelos personalizados do uTools AI aceitam apenas respostas do Chat Completions. Escolha um modelo com saída de imagens via Chat Completions ou aguarde o suporte do uTools à Images API.",
  ru: "Модель вернула ответ с изображением из Images API, но пользовательские модели uTools AI поддерживают только ответы Chat Completions. Выберите модель с выводом изображений через Chat Completions или дождитесь поддержки Images API в uTools.",
  de: "Das Modell hat eine Bildantwort der Images API zurückgegeben, aber benutzerdefinierte uTools-KI-Modelle unterstützen nur Chat-Completions-Antworten. Wählen Sie ein Modell mit Bildausgabe über Chat Completions oder warten Sie auf die Images-API-Unterstützung in uTools.",
  it: "Il modello ha restituito una risposta immagine della Images API, ma i modelli personalizzati di uTools AI supportano solo risposte Chat Completions. Scegli un modello con output immagini tramite Chat Completions oppure attendi il supporto della Images API in uTools.",
};

const localizedImageGenerationPromptLabels = {
  "zh-HK": "圖片生成預設提示詞",
  "zh-TW": "圖片生成預設提示詞",
  ja: "画像生成の既定プロンプト",
  vi: "Lời nhắc tạo ảnh mặc định",
  ko: "기본 이미지 생성 프롬프트",
  es: "Prompt predeterminado para generar imágenes",
  fr: "Prompt de génération d’image par défaut",
  "pt-BR": "Prompt padrão de geração de imagens",
  "pt-PT": "Prompt predefinido de geração de imagens",
  ru: "Промпт генерации изображений по умолчанию",
  de: "Standardprompt für die Bildgenerierung",
  it: "Prompt predefinito per la generazione di immagini",
};

const localizedGeneratedImageWorkbenchCopy = {
  "zh-HK": {
    generatedImageWorkbench: "生成圖片預覽與編輯",
    saveEditedImage: "儲存編輯後的圖片",
    copyEditedImage: "複製編輯後的圖片",
    rotateImage: "旋轉",
    rotateLeft: "向左旋轉",
    rotateRight: "向右旋轉",
    flipImage: "翻轉",
    flipHorizontal: "水平翻轉",
    flipVertical: "垂直翻轉",
    resetImageEdits: "重設圖片編輯",
  },
  "zh-TW": {
    generatedImageWorkbench: "生成圖片預覽與編輯",
    saveEditedImage: "儲存編輯後的圖片",
    copyEditedImage: "複製編輯後的圖片",
    rotateImage: "旋轉",
    rotateLeft: "向左旋轉",
    rotateRight: "向右旋轉",
    flipImage: "翻轉",
    flipHorizontal: "水平翻轉",
    flipVertical: "垂直翻轉",
    resetImageEdits: "重設圖片編輯",
  },
  ja: {
    generatedImageWorkbench: "生成画像のプレビューと編集",
    saveEditedImage: "編集画像を保存",
    copyEditedImage: "編集画像をコピー",
    rotateImage: "回転",
    rotateLeft: "左に回転",
    rotateRight: "右に回転",
    flipImage: "反転",
    flipHorizontal: "左右反転",
    flipVertical: "上下反転",
    resetImageEdits: "画像編集をリセット",
  },
  vi: {
    generatedImageWorkbench: "Xem trước và chỉnh sửa ảnh đã tạo",
    saveEditedImage: "Lưu ảnh đã chỉnh sửa",
    copyEditedImage: "Sao chép ảnh đã chỉnh sửa",
    rotateImage: "Xoay",
    rotateLeft: "Xoay trái",
    rotateRight: "Xoay phải",
    flipImage: "Lật",
    flipHorizontal: "Lật ngang",
    flipVertical: "Lật dọc",
    resetImageEdits: "Đặt lại chỉnh sửa ảnh",
  },
  ko: {
    generatedImageWorkbench: "생성 이미지 미리보기 및 편집",
    saveEditedImage: "편집한 이미지 저장",
    copyEditedImage: "편집한 이미지 복사",
    rotateImage: "회전",
    rotateLeft: "왼쪽으로 회전",
    rotateRight: "오른쪽으로 회전",
    flipImage: "뒤집기",
    flipHorizontal: "가로 뒤집기",
    flipVertical: "세로 뒤집기",
    resetImageEdits: "이미지 편집 초기화",
  },
  es: {
    generatedImageWorkbench: "Vista previa y editor de imagen generada",
    saveEditedImage: "Guardar imagen editada",
    copyEditedImage: "Copiar imagen editada",
    rotateImage: "Girar",
    rotateLeft: "Girar a la izquierda",
    rotateRight: "Girar a la derecha",
    flipImage: "Voltear",
    flipHorizontal: "Voltear horizontalmente",
    flipVertical: "Voltear verticalmente",
    resetImageEdits: "Restablecer edición de imagen",
  },
  fr: {
    generatedImageWorkbench: "Aperçu et éditeur de l’image générée",
    saveEditedImage: "Enregistrer l’image modifiée",
    copyEditedImage: "Copier l’image modifiée",
    rotateImage: "Rotation",
    rotateLeft: "Tourner à gauche",
    rotateRight: "Tourner à droite",
    flipImage: "Retourner",
    flipHorizontal: "Retourner horizontalement",
    flipVertical: "Retourner verticalement",
    resetImageEdits: "Réinitialiser les modifications",
  },
  "pt-BR": {
    generatedImageWorkbench: "Pré-visualização e edição da imagem gerada",
    saveEditedImage: "Salvar imagem editada",
    copyEditedImage: "Copiar imagem editada",
    rotateImage: "Girar",
    rotateLeft: "Girar para a esquerda",
    rotateRight: "Girar para a direita",
    flipImage: "Inverter",
    flipHorizontal: "Inverter horizontalmente",
    flipVertical: "Inverter verticalmente",
    resetImageEdits: "Redefinir edição da imagem",
  },
  "pt-PT": {
    generatedImageWorkbench: "Pré-visualização e edição da imagem gerada",
    saveEditedImage: "Guardar imagem editada",
    copyEditedImage: "Copiar imagem editada",
    rotateImage: "Rodar",
    rotateLeft: "Rodar para a esquerda",
    rotateRight: "Rodar para a direita",
    flipImage: "Inverter",
    flipHorizontal: "Inverter horizontalmente",
    flipVertical: "Inverter verticalmente",
    resetImageEdits: "Repor edição da imagem",
  },
  ru: {
    generatedImageWorkbench: "Просмотр и редактор созданного изображения",
    saveEditedImage: "Сохранить изменённое изображение",
    copyEditedImage: "Копировать изменённое изображение",
    rotateImage: "Поворот",
    rotateLeft: "Повернуть влево",
    rotateRight: "Повернуть вправо",
    flipImage: "Отразить",
    flipHorizontal: "Отразить по горизонтали",
    flipVertical: "Отразить по вертикали",
    resetImageEdits: "Сбросить изменения изображения",
  },
  de: {
    generatedImageWorkbench: "Vorschau und Editor für erzeugte Bilder",
    saveEditedImage: "Bearbeitetes Bild speichern",
    copyEditedImage: "Bearbeitetes Bild kopieren",
    rotateImage: "Drehen",
    rotateLeft: "Nach links drehen",
    rotateRight: "Nach rechts drehen",
    flipImage: "Spiegeln",
    flipHorizontal: "Horizontal spiegeln",
    flipVertical: "Vertikal spiegeln",
    resetImageEdits: "Bildbearbeitung zurücksetzen",
  },
  it: {
    generatedImageWorkbench: "Anteprima ed editor dell’immagine generata",
    saveEditedImage: "Salva immagine modificata",
    copyEditedImage: "Copia immagine modificata",
    rotateImage: "Ruota",
    rotateLeft: "Ruota a sinistra",
    rotateRight: "Ruota a destra",
    flipImage: "Rifletti",
    flipHorizontal: "Rifletti orizzontalmente",
    flipVertical: "Rifletti verticalmente",
    resetImageEdits: "Reimposta modifiche immagine",
  },
};

const localizedGeneratedImageRefinementCopy = {
  "zh-HK": {
    imageEditMode: "處理方式",
    refineImage: "微調圖片",
    refineImagePlaceholder: "描述需要在目前圖片上調整的內容…",
  },
  "zh-TW": {
    imageEditMode: "處理方式",
    refineImage: "微調圖片",
    refineImagePlaceholder: "描述需要在目前圖片上調整的內容…",
  },
  ja: {
    imageEditMode: "処理方法",
    refineImage: "画像を微調整",
    refineImagePlaceholder: "現在の画像で調整する内容を説明してください…",
  },
  vi: {
    imageEditMode: "Cách xử lý",
    refineImage: "Tinh chỉnh ảnh",
    refineImagePlaceholder: "Mô tả nội dung cần điều chỉnh trong ảnh hiện tại…",
  },
  ko: {
    imageEditMode: "처리 방식",
    refineImage: "이미지 미세 조정",
    refineImagePlaceholder: "현재 이미지에서 조정할 내용을 설명하세요…",
  },
  es: {
    imageEditMode: "Modo de edición",
    refineImage: "Retocar imagen",
    refineImagePlaceholder: "Describe qué quieres ajustar en la imagen actual…",
  },
  fr: {
    imageEditMode: "Mode de retouche",
    refineImage: "Retoucher l’image",
    refineImagePlaceholder:
      "Décrivez ce qui doit être ajusté dans l’image actuelle…",
  },
  "pt-BR": {
    imageEditMode: "Modo de edição",
    refineImage: "Ajustar imagem",
    refineImagePlaceholder: "Descreva o que deve ser ajustado na imagem atual…",
  },
  "pt-PT": {
    imageEditMode: "Modo de edição",
    refineImage: "Ajustar imagem",
    refineImagePlaceholder: "Descreva o que deve ser ajustado na imagem atual…",
  },
  ru: {
    imageEditMode: "Режим обработки",
    refineImage: "Доработать изображение",
    refineImagePlaceholder:
      "Опишите, что нужно изменить в текущем изображении…",
  },
  de: {
    imageEditMode: "Bearbeitungsmodus",
    refineImage: "Bild verfeinern",
    refineImagePlaceholder:
      "Beschreiben Sie, was im aktuellen Bild angepasst werden soll…",
  },
  it: {
    imageEditMode: "Modalità di modifica",
    refineImage: "Ritocca immagine",
    refineImagePlaceholder: "Descrivi cosa modificare nell’immagine attuale…",
  },
};

const localizedSharpImageCopy = {
  "zh-HK": "請選擇 PNG、JPEG、WebP、GIF、AVIF、TIFF 或 SVG 圖片",
  "zh-TW": "請選擇 PNG、JPEG、WebP、GIF、AVIF、TIFF 或 SVG 圖片",
  ja: "PNG、JPEG、WebP、GIF、AVIF、TIFF、SVG 画像を選択してください",
  vi: "Chọn ảnh PNG, JPEG, WebP, GIF, AVIF, TIFF hoặc SVG",
  ko: "PNG, JPEG, WebP, GIF, AVIF, TIFF 또는 SVG 이미지를 선택하세요",
  es: "Elige una imagen PNG, JPEG, WebP, GIF, AVIF, TIFF o SVG",
  fr: "Choisissez une image PNG, JPEG, WebP, GIF, AVIF, TIFF ou SVG",
  "pt-BR": "Escolha uma imagem PNG, JPEG, WebP, GIF, AVIF, TIFF ou SVG",
  "pt-PT": "Escolha uma imagem PNG, JPEG, WebP, GIF, AVIF, TIFF ou SVG",
  ru: "Выберите изображение PNG, JPEG, WebP, GIF, AVIF, TIFF или SVG",
  de: "Wählen Sie ein PNG-, JPEG-, WebP-, GIF-, AVIF-, TIFF- oder SVG-Bild",
  it: "Scegli un’immagine PNG, JPEG, WebP, GIF, AVIF, TIFF o SVG",
};

const localizedImageGenerationDiagnosticCopy = {
  "zh-HK": {
    errorImageGenerationRequest:
      "模型「{model}」的圖片生成請求失敗（最終 HTTP {status}）。已嘗試：{attempts}。",
    errorImageGenerationProviderDetail: "上游服務詳情：{detail}",
    errorImageGenerationNoProviderDetail: "上游服務未傳回更具體的錯誤詳情。",
  },
  "zh-TW": {
    errorImageGenerationRequest:
      "模型「{model}」的圖片生成請求失敗（最終 HTTP {status}）。已嘗試：{attempts}。",
    errorImageGenerationProviderDetail: "上游服務詳情：{detail}",
    errorImageGenerationNoProviderDetail: "上游服務未回傳更具體的錯誤詳情。",
  },
  ja: {
    errorImageGenerationRequest:
      "モデル「{model}」の画像生成リクエストに失敗しました（最終 HTTP {status}）。試行: {attempts}。",
    errorImageGenerationProviderDetail: "上流サービスの詳細: {detail}",
    errorImageGenerationNoProviderDetail:
      "上流サービスはより具体的なエラー詳細を返しませんでした。",
  },
  vi: {
    errorImageGenerationRequest:
      "Yêu cầu tạo ảnh của mô hình “{model}” thất bại (HTTP cuối cùng {status}). Đã thử: {attempts}.",
    errorImageGenerationProviderDetail:
      "Chi tiết từ dịch vụ phía trên: {detail}",
    errorImageGenerationNoProviderDetail:
      "Dịch vụ phía trên không trả về chi tiết lỗi cụ thể hơn.",
  },
  ko: {
    errorImageGenerationRequest:
      "모델 “{model}”의 이미지 생성 요청이 실패했습니다(최종 HTTP {status}). 시도: {attempts}.",
    errorImageGenerationProviderDetail: "상위 서비스 세부 정보: {detail}",
    errorImageGenerationNoProviderDetail:
      "상위 서비스가 더 구체적인 오류 정보를 반환하지 않았습니다.",
  },
  es: {
    errorImageGenerationRequest:
      "La generación de imágenes del modelo «{model}» falló (HTTP final {status}). Intentos: {attempts}.",
    errorImageGenerationProviderDetail:
      "Detalle del servicio ascendente: {detail}",
    errorImageGenerationNoProviderDetail:
      "El servicio ascendente no devolvió un detalle de error más específico.",
  },
  fr: {
    errorImageGenerationRequest:
      "La génération d’image du modèle « {model} » a échoué (HTTP final {status}). Tentatives : {attempts}.",
    errorImageGenerationProviderDetail: "Détail du service en amont : {detail}",
    errorImageGenerationNoProviderDetail:
      "Le service en amont n’a pas renvoyé de détail d’erreur plus précis.",
  },
  "pt-BR": {
    errorImageGenerationRequest:
      "A geração de imagens do modelo “{model}” falhou (HTTP final {status}). Tentativas: {attempts}.",
    errorImageGenerationProviderDetail: "Detalhe do serviço upstream: {detail}",
    errorImageGenerationNoProviderDetail:
      "O serviço upstream não retornou detalhes de erro mais específicos.",
  },
  "pt-PT": {
    errorImageGenerationRequest:
      "A geração de imagens do modelo “{model}” falhou (HTTP final {status}). Tentativas: {attempts}.",
    errorImageGenerationProviderDetail:
      "Detalhe do serviço a montante: {detail}",
    errorImageGenerationNoProviderDetail:
      "O serviço a montante não devolveu detalhes de erro mais específicos.",
  },
  ru: {
    errorImageGenerationRequest:
      "Не удалось создать изображение моделью «{model}» (итоговый HTTP {status}). Попытки: {attempts}.",
    errorImageGenerationProviderDetail:
      "Подробности вышестоящего сервиса: {detail}",
    errorImageGenerationNoProviderDetail:
      "Вышестоящий сервис не вернул более подробную информацию об ошибке.",
  },
  de: {
    errorImageGenerationRequest:
      "Die Bilderzeugung durch Modell „{model}“ ist fehlgeschlagen (finaler HTTP-Status {status}). Versuche: {attempts}.",
    errorImageGenerationProviderDetail:
      "Details des Upstream-Dienstes: {detail}",
    errorImageGenerationNoProviderDetail:
      "Der Upstream-Dienst hat keine genaueren Fehlerinformationen zurückgegeben.",
  },
  it: {
    errorImageGenerationRequest:
      "La generazione di immagini del modello “{model}” non è riuscita (HTTP finale {status}). Tentativi: {attempts}.",
    errorImageGenerationProviderDetail:
      "Dettaglio del servizio a monte: {detail}",
    errorImageGenerationNoProviderDetail:
      "Il servizio a monte non ha restituito dettagli di errore più specifici.",
  },
};

for (const [language, copy] of Object.entries(localizedImageGenerationCopy)) {
  Object.assign(localizedOverrides[language], copy);
}

for (const [language, errorImageApiUnsupported] of Object.entries(
  localizedImageApiErrorCopy,
)) {
  Object.assign(localizedOverrides[language], { errorImageApiUnsupported });
}

for (const [language, imageGenerationPrompt] of Object.entries(
  localizedImageGenerationPromptLabels,
)) {
  Object.assign(localizedOverrides[language], { imageGenerationPrompt });
}

for (const [language, copy] of Object.entries(
  localizedGeneratedImageWorkbenchCopy,
)) {
  Object.assign(localizedOverrides[language], copy);
}

for (const [language, copy] of Object.entries(
  localizedGeneratedImageRefinementCopy,
)) {
  Object.assign(localizedOverrides[language], copy);
}

for (const [language, imageInvalid] of Object.entries(
  localizedSharpImageCopy,
)) {
  Object.assign(localizedOverrides[language], { imageInvalid });
}

for (const [language, copy] of Object.entries(
  localizedImageGenerationDiagnosticCopy,
)) {
  Object.assign(localizedOverrides[language], copy);
}

const directAiKeys = [
  "directEnabled",
  "directBaseUrl",
  "directApiKey",
  "showApiKey",
  "hideApiKey",
  "directModel",
  "directImagesApi",
  "imageOutputUnavailableDirect",
  "errorDirectUnavailable",
  "errorDirectConfig",
  "errorDirectInvalidResponse",
];
const directAiCopy = (values) =>
  Object.fromEntries(directAiKeys.map((key, index) => [key, values[index]]));
const localizedDirectAiCopy = {
  ja: directAiCopy([
    "プロバイダー API に直接接続（uTools AI を経由しない）",
    "API ベース URL または完全なエンドポイント",
    "API キー（任意）",
    "API キーを表示",
    "API キーを隠す",
    "モデル名",
    "Images API（gpt-image-2 に推奨）",
    "直接 API から認識可能な画像データが返されませんでした。モデル、画像リクエストのプロトコル、サービスの応答形式を確認してください。",
    "直接 API サービスを利用できません。プラグインを開き直すか、preload スクリプトが更新されているか確認してください。",
    "直接 API の設定が無効です。完全な HTTP(S) URL とモデル名を入力し、参照画像データを確認してください。",
    "直接 API が空の応答または無効な JSON を返したため、画像またはテキストとして解析できません。",
  ]),
  vi: directAiCopy([
    "Dùng API nhà cung cấp trực tiếp (bỏ qua uTools AI)",
    "URL gốc API hoặc điểm cuối đầy đủ",
    "Khóa API (không bắt buộc)",
    "Hiện khóa API",
    "Ẩn khóa API",
    "Tên mô hình",
    "Images API (khuyến nghị cho gpt-image-2)",
    "API trực tiếp không trả về dữ liệu ảnh có thể nhận diện. Kiểm tra mô hình, giao thức yêu cầu ảnh và định dạng phản hồi của nhà cung cấp.",
    "Dịch vụ API trực tiếp không khả dụng. Mở lại plugin hoặc kiểm tra tập lệnh preload đã được cập nhật.",
    "Cấu hình API trực tiếp không hợp lệ. Nhập URL HTTP(S) đầy đủ và tên mô hình, rồi kiểm tra dữ liệu ảnh tham chiếu.",
    "API trực tiếp trả về phản hồi trống hoặc JSON không hợp lệ nên không thể đọc thành ảnh hay văn bản.",
  ]),
  ko: directAiCopy([
    "공급자 API 직접 사용(uTools AI 우회)",
    "API 기본 URL 또는 전체 엔드포인트",
    "API 키(선택 사항)",
    "API 키 표시",
    "API 키 숨기기",
    "모델 이름",
    "Images API(gpt-image-2 권장)",
    "직접 API가 인식 가능한 이미지 데이터를 반환하지 않았습니다. 모델, 이미지 요청 프로토콜 및 공급자 응답 형식을 확인하세요.",
    "직접 API 서비스를 사용할 수 없습니다. 플러그인을 다시 열거나 preload 스크립트가 최신인지 확인하세요.",
    "직접 API 구성이 올바르지 않습니다. 전체 HTTP(S) URL과 모델 이름을 입력하고 참조 이미지 데이터를 확인하세요.",
    "직접 API가 비어 있거나 올바르지 않은 JSON 응답을 반환하여 이미지 또는 텍스트로 읽을 수 없습니다.",
  ]),
  es: directAiCopy([
    "Usar la API del proveedor directamente (sin uTools AI)",
    "URL base de la API o endpoint completo",
    "Clave de API (opcional)",
    "Mostrar clave de API",
    "Ocultar clave de API",
    "Nombre del modelo",
    "Images API (recomendado para gpt-image-2)",
    "La API directa no devolvió datos de imagen reconocibles. Revise el modelo, el protocolo de imagen y el formato de respuesta del proveedor.",
    "El servicio de API directa no está disponible. Vuelva a abrir el complemento o compruebe que el script de precarga está actualizado.",
    "La configuración de API directa no es válida. Indique una URL HTTP(S) completa y el nombre del modelo, y revise los datos de la imagen de referencia.",
    "La API directa devolvió una respuesta vacía o JSON no válido que no se puede leer como imagen o texto.",
  ]),
  fr: directAiCopy([
    "Utiliser directement l’API du fournisseur (sans uTools AI)",
    "URL de base de l’API ou endpoint complet",
    "Clé API (facultative)",
    "Afficher la clé API",
    "Masquer la clé API",
    "Nom du modèle",
    "Images API (recommandée pour gpt-image-2)",
    "L’API directe n’a pas renvoyé de données image reconnues. Vérifiez le modèle, le protocole d’image et le format de réponse du fournisseur.",
    "Le service d’API directe est indisponible. Rouvrez le module ou vérifiez que le script de préchargement est à jour.",
    "La configuration de l’API directe est invalide. Saisissez une URL HTTP(S) complète et le nom du modèle, puis vérifiez les données de l’image de référence.",
    "L’API directe a renvoyé une réponse vide ou un JSON invalide, impossible à lire comme image ou texte.",
  ]),
  "pt-BR": directAiCopy([
    "Usar a API do provedor diretamente (sem uTools AI)",
    "URL base da API ou endpoint completo",
    "Chave de API (opcional)",
    "Mostrar chave de API",
    "Ocultar chave de API",
    "Nome do modelo",
    "Images API (recomendada para gpt-image-2)",
    "A API direta não retornou dados de imagem reconhecíveis. Verifique o modelo, o protocolo de imagem e o formato de resposta do provedor.",
    "O serviço de API direta está indisponível. Reabra o plugin ou verifique se o script de pré-carregamento está atualizado.",
    "A configuração da API direta é inválida. Informe uma URL HTTP(S) completa e o nome do modelo e verifique os dados da imagem de referência.",
    "A API direta retornou uma resposta vazia ou JSON inválido que não pode ser lido como imagem ou texto.",
  ]),
  "pt-PT": directAiCopy([
    "Utilizar diretamente a API do fornecedor (sem uTools AI)",
    "URL base da API ou ponto de extremidade completo",
    "Chave de API (opcional)",
    "Mostrar chave de API",
    "Ocultar chave de API",
    "Nome do modelo",
    "Images API (recomendada para gpt-image-2)",
    "A API direta não devolveu dados de imagem reconhecíveis. Verifique o modelo, o protocolo de imagem e o formato de resposta do fornecedor.",
    "O serviço de API direta não está disponível. Reabra o plugin ou verifique se o script de pré-carregamento está atualizado.",
    "A configuração da API direta é inválida. Introduza um URL HTTP(S) completo e o nome do modelo e verifique os dados da imagem de referência.",
    "A API direta devolveu uma resposta vazia ou JSON inválido que não pode ser lido como imagem ou texto.",
  ]),
  ru: directAiCopy([
    "Использовать API провайдера напрямую (в обход uTools AI)",
    "Базовый URL API или полный endpoint",
    "Ключ API (необязательно)",
    "Показать ключ API",
    "Скрыть ключ API",
    "Название модели",
    "Images API (рекомендуется для gpt-image-2)",
    "Прямой API не вернул распознаваемые данные изображения. Проверьте модель, протокол запроса изображения и формат ответа провайдера.",
    "Сервис прямого API недоступен. Перезапустите плагин или проверьте актуальность preload-скрипта.",
    "Неверная конфигурация прямого API. Укажите полный HTTP(S) URL и название модели, затем проверьте данные исходного изображения.",
    "Прямой API вернул пустой ответ или неверный JSON, который нельзя прочитать как изображение или текст.",
  ]),
  de: directAiCopy([
    "Provider-API direkt verwenden (uTools AI umgehen)",
    "API-Basis-URL oder vollständiger Endpunkt",
    "API-Schlüssel (optional)",
    "API-Schlüssel anzeigen",
    "API-Schlüssel ausblenden",
    "Modellname",
    "Images API (für gpt-image-2 empfohlen)",
    "Die direkte API hat keine erkennbaren Bilddaten zurückgegeben. Prüfen Sie Modell, Bildprotokoll und Antwortformat des Providers.",
    "Der direkte API-Dienst ist nicht verfügbar. Öffnen Sie das Plugin erneut oder prüfen Sie, ob das Preload-Skript aktuell ist.",
    "Die direkte API-Konfiguration ist ungültig. Geben Sie eine vollständige HTTP(S)-URL und den Modellnamen ein und prüfen Sie die Referenzbilddaten.",
    "Die direkte API hat eine leere Antwort oder ungültiges JSON geliefert, das nicht als Bild oder Text gelesen werden kann.",
  ]),
  it: directAiCopy([
    "Usa direttamente l’API del provider (senza uTools AI)",
    "URL di base API o endpoint completo",
    "Chiave API (facoltativa)",
    "Mostra chiave API",
    "Nascondi chiave API",
    "Nome del modello",
    "Images API (consigliata per gpt-image-2)",
    "L’API diretta non ha restituito dati immagine riconoscibili. Verifica il modello, il protocollo immagine e il formato di risposta del provider.",
    "Il servizio API diretto non è disponibile. Riapri il plugin o verifica che lo script di preload sia aggiornato.",
    "La configurazione API diretta non è valida. Inserisci un URL HTTP(S) completo e il nome del modello, quindi verifica i dati dell’immagine di riferimento.",
    "L’API diretta ha restituito una risposta vuota o JSON non valido che non può essere letto come immagine o testo.",
  ]),
};

for (const [language, copy] of Object.entries(localizedDirectAiCopy)) {
  Object.assign(localizedOverrides[language], copy);
}

Object.assign(localizedOverrides["zh-HK"], {
  model: "uTools AI 模型",
  directEnabled: "使用直連生圖 API",

  directBaseUrl: "API 基礎位址或完整介面位址",
  directApiKey: "API 金鑰（可留空）",
  showApiKey: "顯示 API 金鑰",
  hideApiKey: "隱藏 API 金鑰",
  directModel: "直連生圖模型",

  directImagesApi: "Images API（建議用於 gpt-image-2）",

  imageOutputUnavailableDirect:
    "直連 Images API 沒有傳回可辨識的圖片資料。請檢查模型和服務商回應格式。",
  errorDirectUnavailable:
    "直接 API 服務無法使用。請重新開啟外掛程式，或檢查預載入指令碼是否已更新。",
  errorDirectConfig:
    "直接 API 設定無效。請填寫完整的 HTTP（S）位址和模型名稱，並檢查參考圖片資料。",
  errorDirectInvalidResponse:
    "直接 API 傳回空白回應或無效 JSON，無法解析為圖片或文字結果。",
});

Object.assign(localizedOverrides["zh-TW"], {
  model: "uTools AI 模型",
  directEnabled: "使用直連生圖 API",

  directBaseUrl: "API 基礎位址或完整介面位址",
  directApiKey: "API 金鑰（可留空）",
  showApiKey: "顯示 API 金鑰",
  hideApiKey: "隱藏 API 金鑰",
  directModel: "直連生圖模型",

  directImagesApi: "Images API（建議用於 gpt-image-2）",

  imageOutputUnavailableDirect:
    "直連 Images API 沒有傳回可辨識的圖片資料。請檢查模型和服務商回應格式。",
  errorDirectUnavailable:
    "直接 API 服務無法使用。請重新開啟外掛程式，或檢查預載入指令碼是否已更新。",
  errorDirectConfig:
    "直接 API 設定無效。請填寫完整的 HTTP（S）位址和模型名稱，並檢查參考圖片資料。",
  errorDirectInvalidResponse:
    "直接 API 傳回空白回應或無效 JSON，無法解析為圖片或文字結果。",
});

export default Object.freeze({
  "zh-CN": zh,
  en,
  ...Object.fromEntries(
    Object.entries(localizedOverrides).map(([code, overrides]) => [
      code,
      { ...zh, ...overrides },
    ]),
  ),
});
