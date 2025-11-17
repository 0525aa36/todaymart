package com.agri.market.specialdeal;

import com.agri.market.dto.SpecialDealRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SpecialDealController {

    private final SpecialDealService specialDealService;

    /**
     * PUBLIC: 현재 진행 중인 특가 목록 조회
     */
    @GetMapping("/special-deals/ongoing")
    public ResponseEntity<List<SpecialDeal>> getOngoingDeals() {
        List<SpecialDeal> deals = specialDealService.getOngoingDeals();
        return ResponseEntity.ok(deals);
    }

    /**
     * PUBLIC: 예정된 특가 목록 조회
     */
    @GetMapping("/special-deals/upcoming")
    public ResponseEntity<List<SpecialDeal>> getUpcomingDeals() {
        List<SpecialDeal> deals = specialDealService.getUpcomingDeals();
        return ResponseEntity.ok(deals);
    }

    /**
     * PUBLIC: 특가 ID로 조회
     */
    @GetMapping("/special-deals/{id}")
    public ResponseEntity<SpecialDeal> getSpecialDealById(@PathVariable Long id) {
        SpecialDeal deal = specialDealService.getSpecialDealById(id);
        return ResponseEntity.ok(deal);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * ADMIN: 모든 특가 조회
     */
    @GetMapping("/admin/special-deals")
    public ResponseEntity<List<SpecialDeal>> getAllDeals() {
        List<SpecialDeal> deals = specialDealService.getAllDeals();
        return ResponseEntity.ok(deals);
    }

    /**
     * ADMIN: 특가 생성 (상품 포함)
     */
    @PostMapping("/admin/special-deals")
    public ResponseEntity<SpecialDeal> createSpecialDeal(@RequestBody SpecialDealRequest request) {
        SpecialDeal created = specialDealService.createSpecialDealWithProducts(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * ADMIN: 특가 수정 (상품 포함)
     */
    @PutMapping("/admin/special-deals/{id}")
    public ResponseEntity<SpecialDeal> updateSpecialDeal(
            @PathVariable Long id,
            @RequestBody SpecialDealRequest request
    ) {
        SpecialDeal updated = specialDealService.updateSpecialDealWithProducts(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * ADMIN: 특가 삭제
     */
    @DeleteMapping("/admin/special-deals/{id}")
    public ResponseEntity<Void> deleteSpecialDeal(@PathVariable Long id) {
        specialDealService.deleteSpecialDeal(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * ADMIN: 특가에 상품 추가
     */
    @PostMapping("/admin/special-deals/{dealId}/products/{productId}")
    public ResponseEntity<Void> addProductToDeal(
            @PathVariable Long dealId,
            @PathVariable Long productId
    ) {
        specialDealService.addProductToDeal(dealId, productId);
        return ResponseEntity.ok().build();
    }

    /**
     * ADMIN: 특가에서 상품 제거
     */
    @DeleteMapping("/admin/special-deals/{dealId}/products/{productId}")
    public ResponseEntity<Void> removeProductFromDeal(
            @PathVariable Long dealId,
            @PathVariable Long productId
    ) {
        specialDealService.removeProductFromDeal(dealId, productId);
        return ResponseEntity.noContent().build();
    }
}
