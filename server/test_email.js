require('dotenv').config({ path: './.env' });
const emailService = require('./src/utils/email.service');

async function testEmail() {
  console.log("SMTP_USER:", process.env.SMTP_USER);
  console.log("SMTP_PASS exists:", !!process.env.SMTP_PASS);
  try {
    const res = await emailService.sendTaskNotificationEmail(
      'lnhao4512@gmail.com', // Gửi đến chính mình để test
      'Test gửi email',
      'Admin System',
      new Date(),
      'high'
    );
    console.log("Result:", res);
  } catch(e) {
    console.error("Lỗi:", e);
  }
}
testEmail();
