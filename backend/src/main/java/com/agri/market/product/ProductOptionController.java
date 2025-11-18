package com.agri.market.product;

import com.agri.market.dto.ProductOptionDto;
import com.agri.market.dto.ProductOptionRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class ProductOptionController {

    private final ProductService productService;

    public ProductOptionController(ProductService productService) {
        this.productService = productService;
    }

    // 상품 옵션 목록 조회
    @GetMapping("/{productId}/options")
    public ResponseEntity<List<ProductOptionDto>> getProductOptions(@PathVariable Long productId) {
        List<ProductOption> options = productService.getProductOptions(productId);
        List<ProductOptionDto> dtos = options.stream()
                .map(ProductOptionDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // 상품 옵션 추가
    @PostMapping("/{productId}/options")
    public ResponseEntity<ProductOptionDto> addProductOption(
            @PathVariable Long productId,
            @RequestBody ProductOptionRequest request) {
        ProductOption option = productService.addProductOption(productId, request);
        return ResponseEntity.ok(ProductOptionDto.fromEntity(option));
    }

    // 상품 옵션 수정
    @PutMapping("/options/{optionId}")
    public ResponseEntity<ProductOptionDto> updateProductOption(
            @PathVariable Long optionId,
            @RequestBody ProductOptionRequest request) {
        ProductOption option = productService.updateProductOption(optionId, request);
        return ResponseEntity.ok(ProductOptionDto.fromEntity(option));
    }

    // 상품 옵션 삭제
    @DeleteMapping("/{productId}/options/{optionId}")
    public ResponseEntity<Void> deleteProductOption(
            @PathVariable Long productId,
            @PathVariable Long optionId) {
        productService.deleteProductOption(optionId);
        return ResponseEntity.ok().build();
    }
}
