package com.agri.market.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final SendGrid sendGrid;

    @Value("${sendgrid.sender-email}")
    private String senderEmail;

    @Value("${sendgrid.sender-name:오늘마트}")
    private String senderName;

    public EmailService(SendGrid sendGrid) {
        this.sendGrid = sendGrid;
    }

    /**
     * 비밀번호 재설정 이메일 전송
     */
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String tempPassword) {
        String subject = "[오늘마트] 임시 비밀번호 안내";
        String htmlBody = buildPasswordResetEmailHtml(recipientName, tempPassword);
        String textBody = buildPasswordResetEmailText(recipientName, tempPassword);

        sendEmail(recipientEmail, subject, htmlBody, textBody);
    }

    /**
     * 이메일 전송 (HTML + Text 버전)
     */
    private void sendEmail(String recipient, String subject, String htmlBody, String textBody) {
        Email from = new Email(senderEmail, senderName);
        Email to = new Email(recipient);
        Content textContent = new Content("text/plain", textBody);

        Mail mail = new Mail(from, subject, to, textContent);
        mail.addContent(new Content("text/html", htmlBody));

        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sendGrid.api(request);

            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                logger.info("이메일 전송 성공: {} (Status: {})", recipient, response.getStatusCode());
            } else {
                logger.error("이메일 전송 실패: {} - Status: {}, Body: {}",
                        recipient, response.getStatusCode(), response.getBody());
                throw new RuntimeException("이메일 전송에 실패했습니다. Status: " + response.getStatusCode());
            }

        } catch (IOException e) {
            logger.error("이메일 전송 실패: {} - {}", recipient, e.getMessage(), e);
            throw new RuntimeException("이메일 전송에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 비밀번호 재설정 이메일 HTML 템플릿
     */
    private String buildPasswordResetEmailHtml(String name, String tempPassword) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <!-- Header with Logo -->
                        <div style="background: #ffffff; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 3px solid #23747C;">
                            <img src="https://todaymart.co.kr/logo_todaymart.png" alt="오늘마트" style="max-width: 180px; height: auto; margin-bottom: 15px;">
                            <h1 style="color: #23747C; margin: 0; font-size: 22px; font-weight: 600;">임시 비밀번호 안내</h1>
                        </div>

                        <!-- Content -->
                        <div style="background: #ffffff; padding: 40px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                                안녕하세요, <strong>%s</strong>님
                            </p>

                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                비밀번호 재설정 요청에 따라 임시 비밀번호를 발급해드렸습니다.<br>
                                아래 임시 비밀번호로 로그인하신 후, 반드시 비밀번호를 변경해주세요.
                            </p>

                            <!-- Temporary Password Box -->
                            <div style="background: #f0f9fa; padding: 25px; border-radius: 8px; text-align: center; margin: 0 0 30px 0; border: 2px solid #23747C;">
                                <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; font-weight: 600;">임시 비밀번호</p>
                                <p style="color: #23747C; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0; font-family: 'Courier New', monospace;">
                                    %s
                                </p>
                            </div>

                            <!-- Security Notice -->
                            <div style="background: #fff9e6; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 30px 0; border-radius: 4px;">
                                <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                    <strong>🔒 보안 안내</strong><br>
                                    로그인 후 마이페이지에서 반드시 비밀번호를 변경해주세요.
                                </p>
                            </div>

                            <!-- Login Button -->
                            <div style="text-align: center;">
                                <a href="https://todaymart.co.kr/login" style="display: inline-block; background: #23747C; color: white; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    로그인하기
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #ffffff; text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                            <p style="margin: 0 0 5px 0;">본 메일은 비밀번호 재설정 요청 시 자동으로 발송됩니다.</p>
                            <p style="margin: 0;">문의사항이 있으시면 고객센터로 연락해주세요.</p>
                            <p style="margin: 10px 0 0 0; color: #23747C; font-weight: 600;">오늘마트</p>
                        </div>
                    </div>
                </body>
                </html>
                """, name, tempPassword);
    }

    /**
     * 비밀번호 재설정 이메일 Text 버전
     */
    private String buildPasswordResetEmailText(String name, String tempPassword) {
        return """
                [오늘마트] 임시 비밀번호 안내

                안녕하세요, %s님

                비밀번호 재설정 요청에 따라 임시 비밀번호를 발급해드렸습니다.
                아래 임시 비밀번호로 로그인하신 후, 반드시 비밀번호를 변경해주세요.

                ━━━━━━━━━━━━━━━━━━━━━━
                임시 비밀번호: %s
                ━━━━━━━━━━━━━━━━━━━━━━

                ⚠️ 보안 안내
                로그인 후 마이페이지에서 반드시 비밀번호를 변경해주세요.

                로그인: https://todaymart.co.kr/login

                ━━━━━━━━━━━━━━━━━━━━━━
                본 메일은 비밀번호 재설정 요청 시 자동으로 발송됩니다.
                문의사항이 있으시면 고객센터로 연락해주세요.

                오늘마트 드림
                """.formatted(name, tempPassword);
    }
}
