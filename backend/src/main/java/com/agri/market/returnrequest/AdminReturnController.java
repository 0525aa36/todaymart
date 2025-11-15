package com.agri.market.returnrequest;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 반품 관리 컨트롤러 (관리자용)
 */
@RestController
@RequestMapping("/api/admin/returns")
@RequiredArgsConstructor
public class AdminReturnController {

    private final AdminReturnService adminReturnService;

    /**
     * 모든 반품 요청 조회 (페이징)
     * GET /api/admin/returns
     */
    @GetMapping
    public ResponseEntity<Page<ReturnRequest>> getAllReturnRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "requestedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ReturnRequest> returnRequests = adminReturnService.getAllReturnRequests(pageable);
        return ResponseEntity.ok(returnRequests);
    }

    /**
     * 필터링된 반품 요청 조회
     * GET /api/admin/returns/filter
     */
    @GetMapping("/filter")
    public ResponseEntity<Page<ReturnRequest>> getFilteredReturnRequests(
            @RequestParam(required = false) ReturnStatus status,
            @RequestParam(required = false) ReturnReasonCategory reasonCategory,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        Page<ReturnRequest> returnRequests = adminReturnService.getFilteredReturnRequests(
            status, reasonCategory, keyword, pageable
        );
        return ResponseEntity.ok(returnRequests);
    }

    /**
     * 반품 통계
     * GET /api/admin/returns/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getReturnStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("pendingCount", adminReturnService.getPendingReturnCount());
        return ResponseEntity.ok(stats);
    }

    /**
     * 반품 요청 상세 조회
     * GET /api/admin/returns/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ReturnRequest> getReturnRequest(@PathVariable Long id) {
        ReturnRequest returnRequest = adminReturnService.getReturnRequest(id);
        return ResponseEntity.ok(returnRequest);
    }

    /**
     * 반품 승인
     * POST /api/admin/returns/{id}/approve
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ReturnRequest> approveReturn(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication authentication
    ) {
        String adminNote = body != null ? body.get("adminNote") : null;
        ReturnRequest returnRequest = adminReturnService.approveReturn(id, adminNote, authentication);
        return ResponseEntity.ok(returnRequest);
    }

    /**
     * 반품 거부
     * POST /api/admin/returns/{id}/reject
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ReturnRequest> rejectReturn(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        String rejectionReason = body.get("rejectionReason");
        if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
            throw new IllegalArgumentException("거부 사유는 필수입니다.");
        }
        ReturnRequest returnRequest = adminReturnService.rejectReturn(id, rejectionReason, authentication);
        return ResponseEntity.ok(returnRequest);
    }

    /**
     * 반품 완료 처리
     * POST /api/admin/returns/{id}/complete
     */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ReturnRequest> completeReturn(
            @PathVariable Long id,
            Authentication authentication
    ) {
        ReturnRequest returnRequest = adminReturnService.completeReturn(id, authentication);
        return ResponseEntity.ok(returnRequest);
    }

    /**
     * 기간별 반품 조회
     * GET /api/admin/returns/date-range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<ReturnRequest>> getReturnsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<ReturnRequest> returnRequests = adminReturnService.getReturnRequestsByDateRange(startDate, endDate);
        return ResponseEntity.ok(returnRequests);
    }
}
