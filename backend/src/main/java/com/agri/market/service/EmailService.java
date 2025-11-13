package com.agri.market.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.*;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Value("${aws.ses.region:ap-northeast-1}")
    private String sesRegion;

    @Value("${aws.ses.sender-email}")
    private String senderEmail;

    @Value("${aws.ses.sender-name:오늘마트}")
    private String senderName;

    private SesClient getSesClient() {
        return SesClient.builder()
                .region(Region.of(sesRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
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
        try (SesClient sesClient = getSesClient()) {
            SendEmailRequest request = SendEmailRequest.builder()
                    .source(senderName + " <" + senderEmail + ">")
                    .destination(Destination.builder()
                            .toAddresses(recipient)
                            .build())
                    .message(Message.builder()
                            .subject(Content.builder()
                                    .charset("UTF-8")
                                    .data(subject)
                                    .build())
                            .body(Body.builder()
                                    .html(Content.builder()
                                            .charset("UTF-8")
                                            .data(htmlBody)
                                            .build())
                                    .text(Content.builder()
                                            .charset("UTF-8")
                                            .data(textBody)
                                            .build())
                                    .build())
                            .build())
                    .build();

            SendEmailResponse response = sesClient.sendEmail(request);
            logger.info("이메일 전송 성공: {} (MessageId: {})", recipient, response.messageId());

        } catch (SesException e) {
            logger.error("이메일 전송 실패: {} - {}", recipient, e.getMessage(), e);
            throw new RuntimeException("이메일 전송에 실패했습니다: " + e.awsErrorDetails().errorMessage());
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
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, %%23667eea 0%%, %%23764ba2 100%%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">오늘마트</h1>
                            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">임시 비밀번호 안내</p>
                        </div>

                        <div style="background: %%23ffffff; padding: 40px; border: 1px solid %%23e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                            <p style="color: %%23374151; font-size: 16px; margin: 0 0 20px 0;">
                                안녕하세요, <strong>%s</strong>님
                            </p>

                            <p style="color: %%236b7280; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                비밀번호 재설정 요청에 따라 임시 비밀번호를 발급해드렸습니다.<br>
                                아래 임시 비밀번호로 로그인하신 후, 반드시 비밀번호를 변경해주세요.
                            </p>

                            <div style="background: %%23f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 0 0 30px 0;">
                                <p style="color: %%236b7280; font-size: 12px; margin: 0 0 10px 0;">임시 비밀번호</p>
                                <p style="color: %%23667eea; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 0; font-family: 'Courier New', monospace;">
                                    %s
                                </p>
                            </div>

                            <div style="background: %%23fef3c7; border-left: 4px solid %%23f59e0b; padding: 15px; margin: 0 0 30px 0; border-radius: 4px;">
                                <p style="color: %%2392400e; font-size: 13px; margin: 0; line-height: 1.5;">
                                    ⚠️ <strong>보안 안내</strong><br>
                                    로그인 후 마이페이지에서 반드시 비밀번호를 변경해주세요.
                                </p>
                            </div>

                            <div style="text-align: center;">
                                <a href="https://todaymart.co.kr/login" style="display: inline-block; background: linear-gradient(135deg, %%23667eea 0%%, %%23764ba2 100%%); color: white; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    로그인하기
                                </a>
                            </div>
                        </div>

                        <div style="text-align: center; padding: 20px; color: %%239ca3af; font-size: 12px;">
                            <p style="margin: 0 0 5px 0;">본 메일은 비밀번호 재설정 요청 시 자동으로 발송됩니다.</p>
                            <p style="margin: 0;">문의사항이 있으시면 고객센터로 연락해주세요.</p>
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
