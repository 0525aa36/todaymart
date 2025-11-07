package com.agri.market.admin;

import com.agri.market.seller.Seller;
import com.agri.market.seller.SellerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sellers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSellerController {

    private final SellerService sellerService;

    public AdminSellerController(SellerService sellerService) {
        this.sellerService = sellerService;
    }

    /**
     * 판매자 목록 조회 (페이지네이션, 검색)
     */
    @GetMapping
    public ResponseEntity<Page<Seller>> getAllSellers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean isActive,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<Seller> sellers;

        if (isActive != null) {
            sellers = sellerService.getSellersByActiveStatus(isActive, pageable);
        } else if (name != null && !name.trim().isEmpty()) {
            sellers = sellerService.searchSellers(name, pageable);
        } else {
            sellers = sellerService.getAllSellers(pageable);
        }

        return ResponseEntity.ok(sellers);
    }

    /**
     * 활성 판매자 목록 조회 (드롭다운용)
     */
    @GetMapping("/active")
    public ResponseEntity<List<Seller>> getActiveSellers() {
        return ResponseEntity.ok(sellerService.getActiveSellers());
    }

    /**
     * 판매자 상세 조회
     */
    @GetMapping("/{id}")
    public ResponseEntity<Seller> getSellerById(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.getSellerById(id));
    }

    /**
     * 판매자 등록
     */
    @PostMapping
    public ResponseEntity<Seller> createSeller(@Valid @RequestBody Seller seller) {
        return ResponseEntity.ok(sellerService.createSeller(seller));
    }

    /**
     * 판매자 정보 수정
     */
    @PutMapping("/{id}")
    public ResponseEntity<Seller> updateSeller(
            @PathVariable Long id,
            @Valid @RequestBody Seller sellerDetails) {
        return ResponseEntity.ok(sellerService.updateSeller(id, sellerDetails));
    }

    /**
     * 판매자 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSeller(@PathVariable Long id) {
        sellerService.deleteSeller(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 판매자 활성화/비활성화 토글
     */
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<Seller> toggleSellerStatus(@PathVariable Long id) {
        return ResponseEntity.ok(sellerService.toggleSellerStatus(id));
    }

    /**
     * 사업자등록번호 중복 체크
     */
    @GetMapping("/check-business-number")
    public ResponseEntity<Boolean> checkBusinessNumber(@RequestParam String businessNumber) {
        return ResponseEntity.ok(sellerService.isBusinessNumberDuplicate(businessNumber));
    }
}
