<div align="center">
  <img src="../public/logo.png" width="112" height="112" alt="Logo Flash Note Text">
  <p><a href="../README.md">简体中文</a> · <a href="./README.zh-HK.md">繁體中文（香港）</a> · <a href="./README.zh-TW.md">繁體中文（台灣）</a> · <a href="./README.en.md">English</a> · <a href="./README.ja.md">日本語</a> · <strong>Tiếng Việt</strong> · <a href="./README.ko.md">한국어</a> · <a href="./README.es.md">Español</a> · <a href="./README.fr.md">Français</a> · <a href="./README.pt-BR.md">Português (Brasil)</a> · <a href="./README.pt-PT.md">Português (Portugal)</a> · <a href="./README.ru.md">Русский</a> · <a href="./README.de.md">Deutsch</a> · <a href="./README.it.md">Italiano</a></p>
  <h1>Flash Note Text</h1>
  <p><strong>Không gian làm việc văn bản nhẹ cho uTools: ghi chú nhanh, chỉnh sửa Markdown, mở tệp nhiều bảng mã và tạo ảnh để chia sẻ.</strong></p>
</div>

Flash Note Text là plugin uTools dành cho ghi chú tạm thời và chuyển đổi văn bản. Plugin gộp trình soạn thảo văn bản thuần, Markdown và mã nguồn, cùng lịch sử, khôi phục bản nháp, định dạng văn bản, nhận diện bảng mã, chia sẻ hình ảnh và AI tùy chọn.

## Ủng hộ

Nếu Flash Note Text giúp bạn tiết kiệm thời gian ghi chú, định dạng và chia sẻ văn bản, bạn có thể ủng hộ tác giả qua các mã QR bên dưới. Vui lòng chọn phương thức thanh toán:

<p align="center">
  <img src="../public/donate/wechat-pay.png" width="220" alt="Mã QR ủng hộ qua WeChat Pay">
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="../public/donate/alipay.png" width="220" alt="Mã QR ủng hộ qua Alipay">
</p>

## Tính năng

- Ba chế độ văn bản thuần, Markdown và mã nguồn; hiển thị mã trong vùng đánh dấu Markdown và hiển thị kết quả bên ngoài vùng đó.
- Lịch sử, tự động lưu, khôi phục bản nháp, tìm kiếm, xem trước, đổi tên, xóa và sắp xếp.
- Làm sạch xuống dòng, khoảng trắng, ký tự thoát, số trích dẫn, liên kết, dấu câu và khoảng cách CJK/Latin.
- Chọn ngôn ngữ mã tự động hoặc thủ công với CodeMirror và Shiki.
- Hỗ trợ UTF-8/16/32, GBK, GB18030, Big5, Shift_JIS, EUC-KR, Windows-1252 và Latin-1.
- Tạo ảnh ghi chú, mã nguồn, Xiaohongshu, Zhihu, WeChat và X.
- Giao diện 14 ngôn ngữ, gồm tiếng Việt, tiếng Anh, tiếng Trung, tiếng Nhật, tiếng Hàn, tiếng Tây Ban Nha, tiếng Pháp, tiếng Bồ Đào Nha, tiếng Nga, tiếng Đức và tiếng Ý.

## Cài đặt và phát triển

1. Cài đặt và mở [uTools](https://u.tools/).
2. Cài đặt trực tiếp từ [trang plugin uTools](https://www.u-tools.cn/plugins/detail/%E9%97%AA%E5%BF%B5%E6%96%87%E6%9C%AC/), tải gói từ [GitHub Releases](https://github.com/realSilasYang/flash-note-text/releases) hoặc tự build.
3. Nạp thư mục `dist` được tạo trong công cụ phát triển uTools.

```powershell
npm install
npm run release:build
```

Xem hướng dẫn đầy đủ, phím tắt, ranh giới dữ liệu và hướng dẫn phát triển trong [README tiếng Trung giản thể](../README.md).

## Giấy phép

Dự án phát hành theo [MIT License](../LICENSE). Phông chữ, hình ảnh và chủ đề của bên thứ ba tuân theo giấy phép riêng.
