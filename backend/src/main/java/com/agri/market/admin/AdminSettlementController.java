package com.agri.market.admin;

import com.agri.market.seller.Seller;
import com.agri.market.seller.SellerRepository;
import com.agri.market.settlement.Settlement;
import com.agri.market.settlement.SettlementService;
import com.agri.market.settlement.SettlementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/settlements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettlementController {

    private final SettlementService settlementService;
    private final SellerRepository sellerRepository;

    public AdminSettlementController(SettlementService settlementService,
                                     SellerRepository sellerRepository) {
        this.settlementService = settlementService;
        this.sellerRepository = sellerRepository;
    }

    /**
     * 정산 목록 조회 (페이지네이션, 필터링)
     */
    @GetMapping
    public ResponseEntity<Page<Settlement>> getAllSettlements(
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) SettlementStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Settlement> settlements;

        if (sellerId != null && status != null) {
            settlements = settlementService.getSettlementsBySeller(sellerId, pageable)
                    .map(s -> s); // Filter by status manually if needed
        } else if (sellerId != null) {
            settlements = settlementService.getSettlementsBySeller(sellerId, pageable);
        } else if (status != null) {
            settlements = settlementService.getSettlementsByStatus(status, pageable);
        } else {
            settlements = settlementService.getAllSettlements(pageable);
        }

        return ResponseEntity.ok(settlements);
    }

    /**
     * 정산 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<Settlement> getSettlementById(@PathVariable Long id) {
        Settlement settlement = settlementService.getSettlementById(id);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 특정 기간의 정산 생성 (모든 활성 판매자)
     */
    @PostMapping("/generate")
    public ResponseEntity<List<Settlement>> generateSettlements(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("시작일은 종료일보다 이전이어야 합니다.");
        }

        List<Settlement> settlements = settlementService.generateSettlementsForPeriod(startDate, endDate);
        return ResponseEntity.ok(settlements);
    }

    /**
     * 특정 판매자의 정산 생성
     */
    @PostMapping("/generate/{sellerId}")
    public ResponseEntity<Settlement> generateSettlementForSeller(
            @PathVariable Long sellerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        if (startDate.isAfter(endDate)) {
            throw new RuntimeException("시작일은 종료일보다 이전이어야 합니다.");
        }

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + sellerId));

        Settlement settlement = settlementService.generateSettlementForSeller(seller, startDate, endDate);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 정산 승인
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<Settlement> approveSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.approveSettlement(id);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 정산 지급 완료 처리
     */
    @PutMapping("/{id}/pay")
    public ResponseEntity<Settlement> markAsPaid(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String paymentMethod = request.get("paymentMethod");
        String paymentDateStr = request.get("paymentDate");

        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            throw new RuntimeException("지급 방법을 입력해주세요.");
        }

        LocalDate paymentDate = paymentDateStr != null
                ? LocalDate.parse(paymentDateStr)
                : LocalDate.now();

        Settlement settlement = settlementService.markAsPaid(id, paymentMethod, paymentDate);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 정산 취소
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Settlement> cancelSettlement(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String reason = request.getOrDefault("reason", "");
        Settlement settlement = settlementService.cancelSettlement(id, reason);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 정산 수정 (비고, 금액 조정)
     */
    @PutMapping("/{id}")
    public ResponseEntity<Settlement> updateSettlement(
            @PathVariable Long id,
            @RequestBody Settlement updates) {

        Settlement settlement = settlementService.updateSettlement(id, updates);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 정산 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.getSettlementById(id);

        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new RuntimeException("지급 완료된 정산은 삭제할 수 없습니다.");
        }

        // Note: 실제 삭제는 신중하게 처리해야 합니다.
        // 대신 CANCELLED 상태로 변경하는 것을 권장합니다.
        throw new RuntimeException("정산 삭제는 지원되지 않습니다. 취소 기능을 사용하세요.");
    }

    /**
     * 정산 통계
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSettlementStats() {
        Map<String, Object> stats = settlementService.getSettlementStats();
        return ResponseEntity.ok(stats);
    }
}
