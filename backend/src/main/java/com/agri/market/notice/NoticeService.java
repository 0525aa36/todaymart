package com.agri.market.notice;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoticeService {
    private final NoticeRepository noticeRepository;

    public NoticeService(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    @Transactional(readOnly = true)
    public List<Notice> getAllNotices() {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Notice> getPopupNotices() {
        return noticeRepository.findByIsPopupTrueOrderByCreatedAtDesc();
    }

    @Transactional
    public Notice getNoticeById(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        notice.incrementViewCount();
        return noticeRepository.save(notice);
    }

    @Transactional
    public Notice createNotice(Notice notice) {
        return noticeRepository.save(notice);
    }

    @Transactional
    public Notice updateNotice(Long id, Notice noticeDetails) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        notice.setTitle(noticeDetails.getTitle());
        notice.setContent(noticeDetails.getContent());
        notice.setImageUrl(noticeDetails.getImageUrl());
        notice.setIsPinned(noticeDetails.getIsPinned());
        notice.setIsPopup(noticeDetails.getIsPopup());
        return noticeRepository.save(notice);
    }

    @Transactional
    public void deleteNotice(Long id) {
        noticeRepository.deleteById(id);
    }

    @Transactional
    public Notice togglePinned(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        notice.setIsPinned(!notice.getIsPinned());
        return noticeRepository.save(notice);
    }

    @Transactional
    public Notice togglePopup(Long id) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));
        notice.setIsPopup(!notice.getIsPopup());
        return noticeRepository.save(notice);
    }
}
