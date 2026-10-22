/**
 * Gmail relay cho Task Management System.
 *
 * Render (gói free) chặn cổng SMTP nên server không gửi Gmail trực tiếp được.
 * Script này chạy trên tài khoản Google của bạn, nhận yêu cầu qua HTTPS và gửi mail bằng Gmail.
 *
 * Cài đặt:
 *  1. Vào https://script.google.com -> New project, dán toàn bộ file này vào.
 *  2. Đổi SECRET bên dưới thành một chuỗi ngẫu nhiên dài.
 *  3. Deploy -> New deployment -> loại "Web app":
 *       Execute as: Me    |    Who has access: Anyone
 *     Bấm Deploy, cấp quyền (Advanced -> Go to ... (unsafe) -> Allow), copy "Web app URL".
 *  4. Trên Render đặt: GMAIL_SCRIPT_URL = Web app URL, GMAIL_SCRIPT_SECRET = SECRET.
 */
const SECRET = 'DOI_CHUOI_BI_MAT_NAY';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== SECRET) {
      return json({ ok: false, error: 'unauthorized' });
    }
    if (!data.to || !data.subject || !data.html) {
      return json({ ok: false, error: 'missing to/subject/html' });
    }

    MailApp.sendEmail({
      to: data.to,
      subject: data.subject,
      htmlBody: data.html,
      name: 'Task Management System',
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
