package com.agri.market.seller;

import com.agri.market.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/sellers")
@PreAuthorize("hasRole('ADMIN')")
public class SellerController {

    private final SellerService sellerService;

    public SellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    /**
     * 판매자 목록 조회
     */
    @GetMapping
    public ResponseEntity<Page<Seller>> getAllSellers(Pageable pageable) {
        return ResponseEntity.ok(sellerService.getAllSellers(pageable));
    }

    /**
     * 활성화된 판매자 목록 조회
     */
    @GetMapping("/active")
    public ResponseEntity<Page<Seller>> getActiveSellers(Pageable pageable) {
        return ResponseEntity.ok(sellerService.getActiveSellers(pageable));
    }

    /**
     * 판매자 검색
     */
    @GetMapping("/search")
    public ResponseEntity<Page<Seller>> searchSellers(
            @RequestParam String query,
            Pageable pageable) {
        return ResponseEntity.ok(sellerService.searchSellers(query, pageable));
    }

    /**
     * 판매자 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<Seller> getSeller(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.getSeller(id));
    }

    /**
     * 판매자 등록
     */
    @PostMapping
    public ResponseEntity<Seller> createSeller(@Valid @RequestBody Seller seller) {
        return ResponseEntity.ok(sellerService.createSeller(seller));
    }

    /**
     * 판매자 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<Seller> updateSeller(
            @PathVariable Long id,
            @Valid @RequestBody Seller seller) {
        return ResponseEntity.ok(sellerService.updateSeller(id, seller));
    }

    /**
     * 판매자 활성화/비활성화
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateSellerStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {
        boolean isActive = request.get("isActive");
        sellerService.updateSellerStatus(id, isActive);
        return ResponseEntity.ok(ApiResponse.success("판매자 상태가 변경되었습니다.", null));
    }

    /**
     * 판매자 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSeller(@PathVariable Long id) {
        sellerService.deleteSeller(id);
        return ResponseEntity.ok(ApiResponse.success("판매자가 삭제되었습니다.", null));
    }
}
