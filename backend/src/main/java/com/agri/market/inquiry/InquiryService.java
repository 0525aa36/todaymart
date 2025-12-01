package com.agri.market.inquiry;

import com.agri.market.notification.SlackNotificationService;
import com.agri.market.user.User;
import com.agri.market.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InquiryService {
    private final InquiryRepository inquiryRepository;
    private final UserService userService;
    private final SlackNotificationService slackNotificationService;

    public InquiryService(InquiryRepository inquiryRepository, UserService userService,
                         SlackNotificationService slackNotificationService) {
        this.inquiryRepository = inquiryRepository;
        this.userService = userService;
        this.slackNotificationService = slackNotificationService;
    }

    @Transactional(readOnly = true)
    public List<Inquiry> getAllInquiries() {
        return inquiryRepository.findAllWithUserAndAnsweredBy();
    }

    @Transactional(readOnly = true)
    public List<Inquiry> getUserInquiries(String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        return inquiryRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public Inquiry getInquiryById(Long id, String userEmail) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        // 본인 문의만 조회 가능 (관리자는 모두 조회 가능)
        User user = userService.getUserByEmail(userEmail);
        if (!inquiry.getUser().getId().equals(user.getId()) &&
            !user.getRole().equals("ROLE_ADMIN")) {
            throw new RuntimeException("권한이 없습니다.");
        }

        return inquiry;
    }

    @Transactional
    public Inquiry createInquiry(Inquiry inquiry, String userEmail) {
        User user = userService.getUserByEmail(userEmail);
        inquiry.setUser(user);
        inquiry.setStatus(InquiryStatus.PENDING);
        Inquiry savedInquiry = inquiryRepository.save(inquiry);

        // Slack 알림 전송 (비동기)
        slackNotificationService.sendInquiryNotification(savedInquiry.getId());

        return savedInquiry;
    }

    @Transactional
    public Inquiry answerInquiry(Long id, String answer, String adminEmail) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        User admin = userService.getUserByEmail(adminEmail);
        inquiry.setAnswer(answer);
        inquiry.setStatus(InquiryStatus.ANSWERED);
        inquiry.setAnsweredAt(LocalDateTime.now());
        inquiry.setAnsweredBy(admin);

        inquiryRepository.save(inquiry);

        // Fetch join으로 다시 조회하여 lazy loading proxy 문제 해결
        return inquiryRepository.findByIdWithUserAndAnsweredBy(id);
    }

    @Transactional
    public void deleteInquiry(Long id, String userEmail) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("문의를 찾을 수 없습니다."));

        // 본인 문의만 삭제 가능
        User user = userService.getUserByEmail(userEmail);
        if (!inquiry.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("권한이 없습니다.");
        }

        inquiryRepository.deleteById(id);
    }
}
