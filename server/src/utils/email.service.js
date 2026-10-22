const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    const isGmail = (process.env.SMTP_HOST || '').includes('gmail') || !process.env.SMTP_HOST;

    if (isGmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
    }
  }

  // Có cấu hình gửi mail thật hay chưa (Brevo API hoặc SMTP)
  isConfigured() {
    if (process.env.BREVO_API_KEY) return true;
    return !!process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com';
  }

  get fromAddress() {
    return process.env.EMAIL_FROM || process.env.SMTP_USER;
  }

  get clientUrl() {
    return (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
  }

  /**
   * Gửi mail: ưu tiên Brevo HTTP API (cổng 443) vì Render free chặn cổng SMTP,
   * không có BREVO_API_KEY thì dùng SMTP qua nodemailer (môi trường local).
   */
  async send({ to, subject, html }) {
    if (process.env.BREVO_API_KEY) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Task Management System', email: this.fromAddress },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw new Error(`Brevo API ${res.status}: ${await res.text()}`);
      }
      return;
    }

    await this.transporter.sendMail({
      from: `"Task Management System" <${this.fromAddress}>`,
      to,
      subject,
      html,
    });
  }

  async sendOTP(email, otp) {
    try {
      // Dành cho môi trường dev chưa có config email thật, log ra console
      if (!this.isConfigured()) {
        console.log(`\n==============================================`);
        console.log(`MÃ OTP ĐẶT LẠI MẬT KHẨU CHO [${email}]: ${otp}`);
        console.log(`==============================================\n`);
        return false;
      }

      const mailOptions = {
        to: email,
        subject: 'Mã xác nhận khôi phục mật khẩu (OTP)',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4f46e5; text-align: center;">Khôi phục mật khẩu</h2>
            <p>Chào bạn,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP gồm 6 chữ số dưới đây để hoàn tất việc đổi mật khẩu:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111; padding: 10px 20px; background-color: #f3f4f6; border-radius: 8px;">${otp}</span>
            </div>
            <p>Mã này sẽ hết hạn sau 15 phút. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
            <p>Trân trọng,<br/>Đội ngũ hệ thống</p>
          </div>
        `,
      };

      await this.send(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email OTP:', error.message || error);
      return false;
    }
  }
  async sendWelcomeEmail(email, password) {
    try {
      if (!this.isConfigured()) {
        console.log(`\n==============================================`);
        console.log(`TÀI KHOẢN MỚI CHO [${email}]: ${password}`);
        console.log(`==============================================\n`);
        return true;
      }

      const mailOptions = {
        to: email,
        subject: 'Thông tin tài khoản đăng nhập hệ thống',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4f46e5; text-align: center;">Chào mừng bạn đến với Hệ thống quản lý công việc</h2>
            <p>Chào bạn,</p>
            <p>Tài khoản của bạn đã được tạo thành công trên hệ thống. Dưới đây là thông tin đăng nhập của bạn:</p>
            <div style="margin: 30px 0; padding: 15px; background-color: #f3f4f6; border-radius: 8px; border-left: 4px solid #4f46e5;">
              <p style="margin: 5px 0;"><strong>Tài khoản (Email):</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Mật khẩu:</strong> ${password}</p>
            </div>
            <p style="color: #ef4444; font-size: 0.9em;"><strong>Lưu ý:</strong> Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên để đảm bảo an toàn.</p>
            <p>Trân trọng,<br/>Đội ngũ hệ thống</p>
          </div>
        `,
      };

      await this.send(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email chào mừng:', error);
      throw new Error('Không thể gửi email chào mừng, vui lòng thử lại sau.');
    }
  }
  async sendTaskNotificationEmail(email, taskTitle, assignerName, deadline, priority) {
    try {
      if (!this.isConfigured()) {
        console.log(`\n==============================================`);
        console.log(`THÔNG BÁO CÔNG VIỆC MỚI GỬI ĐẾN [${email}]`);
        console.log(`Tiêu đề: ${taskTitle}`);
        console.log(`==============================================\n`);
        return true;
      }

      let priorityText = 'Thấp';
      let priorityColor = '#10b981'; // green
      if (priority === 'high') { priorityText = 'Cao'; priorityColor = '#ef4444'; }
      if (priority === 'medium') { priorityText = 'Trung bình'; priorityColor = '#f59e0b'; }

      const deadlineText = deadline ? new Date(deadline).toLocaleDateString('vi-VN') : 'Không có';

      const mailOptions = {
        to: email,
        subject: `[Thông báo mới] Bạn vừa được giao công việc: ${taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4f46e5; text-align: center;">Bạn có một công việc mới</h2>
            <p>Chào bạn,</p>
            <p>Bạn vừa được <strong>${assignerName || 'Quản lý'}</strong> giao một công việc mới trên hệ thống.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
              <h3 style="margin-top: 0; color: #1e293b;">${taskTitle}</h3>
              <p style="margin: 5px 0;"><strong>Mức độ ưu tiên:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${priorityText}</span></p>
              <p style="margin: 5px 0;"><strong>Hạn chót:</strong> ${deadlineText}</p>
            </div>
            <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và cập nhật tiến độ công việc.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${this.clientUrl}/my-tasks" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Xem công việc</a>
            </div>
            <p style="margin-top: 30px; font-size: 0.9em; color: #64748b;">Trân trọng,<br/>Đội ngũ hệ thống</p>
          </div>
        `,
      };

      await this.send(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email thông báo công việc:', error);
      // Không ném lỗi ra ngoài để tránh chặn tiến trình tạo công việc
      return false;
    }
  }

  async sendTaskReminderEmail(email, taskTitle, assignerName, deadline, priority) {
    try {
      if (!this.isConfigured()) {
        console.log(`\n==============================================`);
        console.log(`NHẮC NHỞ CÔNG VIỆC GỬI ĐẾN [${email}]`);
        console.log(`Tiêu đề: ${taskTitle}`);
        console.log(`==============================================\n`);
        return true;
      }

      let priorityText = 'Thấp';
      let priorityColor = '#10b981'; // green
      if (priority === 'high') { priorityText = 'Cao'; priorityColor = '#ef4444'; }
      if (priority === 'medium') { priorityText = 'Trung bình'; priorityColor = '#f59e0b'; }

      const deadlineText = deadline ? new Date(deadline).toLocaleDateString('vi-VN') : 'Không có';

      const mailOptions = {
        to: email,
        subject: `[Nhắc nhở] Vui lòng cập nhật tiến độ công việc: ${taskTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #ef4444; text-align: center;">Nhắc nhở công việc</h2>
            <p>Chào bạn,</p>
            <p>Quản lý <strong>${assignerName || 'hệ thống'}</strong> vừa gửi cho bạn một lời nhắc về công việc dưới đây:</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #ef4444;">
              <h3 style="margin-top: 0; color: #1e293b;">${taskTitle}</h3>
              <p style="margin: 5px 0;"><strong>Mức độ ưu tiên:</strong> <span style="color: ${priorityColor}; font-weight: bold;">${priorityText}</span></p>
              <p style="margin: 5px 0;"><strong>Hạn chót:</strong> ${deadlineText}</p>
            </div>
            <p>Vui lòng đăng nhập vào hệ thống để kiểm tra và cập nhật tiến độ công việc càng sớm càng tốt.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${this.clientUrl}/my-tasks" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Xem công việc ngay</a>
            </div>
            <p style="margin-top: 30px; font-size: 0.9em; color: #64748b;">Trân trọng,<br/>Đội ngũ hệ thống</p>
          </div>
        `,
      };

      await this.send(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email nhắc nhở:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
