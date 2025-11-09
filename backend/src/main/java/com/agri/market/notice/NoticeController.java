package com.agri.market.notice;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class NoticeController {
    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    // Public endpoints
    @GetMapping("/notices")
    public ResponseEntity<List<Notice>> getAllNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @GetMapping("/notices/popup")
    public ResponseEntity<List<Notice>> getPopupNotices() {
        return ResponseEntity.ok(noticeService.getPopupNotices());
    }

    @GetMapping("/notices/{id}")
    public ResponseEntity<Notice> getNoticeById(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.getNoticeById(id));
    }

    // Admin endpoints
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/notices")
    public ResponseEntity<List<Notice>> getAdminNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/notices")
    public ResponseEntity<Notice> createNotice(@RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.createNotice(notice));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/notices/{id}")
    public ResponseEntity<Notice> updateNotice(@PathVariable Long id, @RequestBody Notice notice) {
        return ResponseEntity.ok(noticeService.updateNotice(id, notice));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/notices/{id}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/notices/{id}/toggle-pinned")
    public ResponseEntity<Notice> togglePinned(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.togglePinned(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/notices/{id}/toggle-popup")
    public ResponseEntity<Notice> togglePopup(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.togglePopup(id));
    }
}
