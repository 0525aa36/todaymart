package com.agri.market.controller;

import com.agri.market.dto.ProductNoticeRequest;
import com.agri.market.dto.ProductNoticeResponse;
import com.agri.market.service.ProductNoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 상품 고시 정보 API 컨트롤러
 */
@RestController
@RequestMapping("/api/products/{productId}/notice")
@RequiredArgsConstructor
public class ProductNoticeController {

    private final ProductNoticeService productNoticeService;

    /**
     * 상품 고시 정보 조회 (공개 API)
     */
    @GetMapping
    public ResponseEntity<ProductNoticeResponse> getProductNotice(@PathVariable Long productId) {
        ProductNoticeResponse response = productNoticeService.getByProductId(productId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    /**
     * 상품 고시 정보 생성/수정 (Admin only)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductNoticeResponse> createOrUpdateProductNotice(
            @PathVariable Long productId,
            @RequestBody ProductNoticeRequest request) {
        ProductNoticeResponse response = productNoticeService.create(productId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 상품 고시 정보 수정 (Admin only)
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductNoticeResponse> updateProductNotice(
            @PathVariable Long productId,
            @RequestBody ProductNoticeRequest request) {
        ProductNoticeResponse response = productNoticeService.update(productId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 상품 고시 정보 삭제 (Admin only)
     */
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProductNotice(@PathVariable Long productId) {
        productNoticeService.delete(productId);
        return ResponseEntity.noContent().build();
    }
}
