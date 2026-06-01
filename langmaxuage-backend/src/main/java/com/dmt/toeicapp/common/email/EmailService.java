package com.dmt.toeicapp.common.email;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Gửi email OTP (async — không block luồng xử lý chính).
     * Bật @EnableAsync trong ToeicApplication để dùng @Async.
     */
    @Async
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🔐 Mã xác thực OTP — TOEIC Sanctuary");
            helper.setText(buildOtpHtml(otp, "đăng ký tài khoản", "#6c63ff", "#f0f4ff"), true);

            mailSender.send(message);
            log.info("Đã gửi OTP đăng ký tới email: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Lỗi khi gửi email OTP tới {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Gửi email OTP đặt lại mật khẩu (async).
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🔑 Đặt lại mật khẩu — TOEIC Sanctuary");
            helper.setText(buildOtpHtml(otp, "đặt lại mật khẩu", "#e05c2a", "#fff4f0"), true);

            mailSender.send(message);
            log.info("Đã gửi OTP đặt lại mật khẩu tới email: {}", toEmail);
        } catch (MessagingException e) {
            log.error("Lỗi khi gửi email reset password tới {}: {}", toEmail, e.getMessage());
        }
    }

    // ── HTML template ─────────────────────────────────────────────────────────

    private String buildOtpHtml(String otp, String action, String accentColor, String digitBg) {
        StringBuilder digits = new StringBuilder();
        for (char c : otp.toCharArray()) {
            digits.append(
                "<td style=\"padding:4px 6px;\">" +
                "<span style=\"" +
                  "display:inline-block;" +
                  "width:44px;height:52px;" +
                  "line-height:52px;" +
                  "text-align:center;" +
                  "font-size:28px;" +
                  "font-weight:700;" +
                  "color:#1a1a2e;" +
                  "background:" + digitBg + ";" +
                  "border:2px solid " + accentColor + ";" +
                  "border-radius:8px;" +
                "\">" + c + "</span>" +
                "</td>"
            );
        }

        // Gradient header: đổi màu theo loại action
        String headerGradient = accentColor.startsWith("#e05")
            ? "linear-gradient(135deg,#e05c2a,#f09b3a)"  // cam — reset password
            : "linear-gradient(135deg,#6c63ff,#4a90d9)"; // tím — đăng ký

        String icon = accentColor.startsWith("#e05") ? "🔑" : "📚";
        String subtitle = accentColor.startsWith("#e05") ? "Đặt lại mật khẩu của bạn" : "Xác thực tài khoản của bạn";

        return """
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f5f7ff;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:40px 16px;">
                    <table width="520" cellpadding="0" cellspacing="0"
                           style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);overflow:hidden;">

                      <!-- Header -->
                      <tr>
                        <td style="background:%s;padding:36px 40px;text-align:center;">
                          <div style="font-size:36px;margin-bottom:8px;">%s</div>
                          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">
                            TOEIC Sanctuary
                          </h1>
                          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                            %s
                          </p>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:40px 40px 32px;">
                          <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.6;">
                            Chào bạn! Mã OTP để <strong>%s</strong>:
                          </p>

                          <!-- OTP digits -->
                          <table cellpadding="0" cellspacing="0" style="margin:28px auto;">
                            <tr>%s</tr>
                          </table>

                          <p style="margin:24px 0 0;font-size:13px;color:#888;text-align:center;">
                            ⏱ Mã có hiệu lực trong <strong style="color:%s;">5 phút</strong>.
                            Không chia sẻ mã này với bất kỳ ai.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#f8f9ff;padding:20px 40px;border-top:1px solid #eee;">
                          <p style="margin:0;font-size:12px;color:#aaa;text-align:center;">
                            Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.<br>
                            © 2025 TOEIC Sanctuary. All rights reserved.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(headerGradient, icon, subtitle, action, digits.toString(), accentColor);
    }
}

