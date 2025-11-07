package com.agri.market.settlement;

import com.agri.market.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settlements-legacy")
@PreAuthorize("hasRole('ADMIN')")
public class SettlementController {

    private final SettlementService settlementService;

    public SettlementController(SettlementService settlementService) {
        this.settlementService = settlementService;
    }

    /**
     * 정산 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<Settlement>> getAllSettlements(Pageable pageable) {
        return ResponseEntity.ok(settlementService.getAllSettlements(pageable));
    }

    /**
     * 정산 상태별 조회
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<Settlement>> getSettlementsByStatus(
            @PathVariable SettlementStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(settlementService.getSettlementsByStatus(status, pageable));
    }

    /**
     * 판매자별 정산 조회
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Page<Settlement>> getSettlementsBySeller(
            @PathVariable Long sellerId,
            Pageable pageable) {
        return ResponseEntity.ok(settlementService.getSettlementsBySeller(sellerId, pageable));
    }

    /**
     * 정산 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<Settlement> getSettlement(@PathVariable Long id) {
        return ResponseEntity.ok(settlementService.getSettlement(id));
    }

    /**
     * 정산 생성 (특정 판매자)
     */
    @PostMapping
    public ResponseEntity<Settlement> createSettlement(@RequestBody Map<String, Object> request) {
        Long sellerId = Long.valueOf(request.get("sellerId").toString());
        LocalDate startDate = LocalDate.parse(request.get("startDate").toString());
        LocalDate endDate = LocalDate.parse(request.get("endDate").toString());

        Settlement settlement = settlementService.createSettlement(sellerId, startDate, endDate);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 일괄 정산 생성 (모든 판매자)
     */
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<Settlement>>> createBulkSettlements(
            @RequestBody Map<String, String> request) {
        LocalDate startDate = LocalDate.parse(request.get("startDate"));
        LocalDate endDate = LocalDate.parse(request.get("endDate"));

        List<Settlement> settlements = settlementService.createSettlementsForAllSellers(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(
                settlements.size() + "개의 정산이 생성되었습니다.",
                settlements
        ));
    }

    /**
     * 정산 완료 처리
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<Settlement> completeSettlement(
            @PathVariable Long id,
            Authentication authentication) {
        String settledBy = authentication.getName();
        Settlement settlement = settlementService.completeSettlement(id, settledBy);
        return ResponseEntity.ok(settlement);
    }

    /**
     * 정산 취소
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Settlement> cancelSettlement(@PathVariable Long id) {
        Settlement settlement = settlementService.cancelSettlement(id, "관리자에 의한 취소");
        return ResponseEntity.ok(settlement);
    }
}
