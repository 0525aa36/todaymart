package com.agri.market.product;

import com.agri.market.dto.ProductListDto;
import com.agri.market.dto.ProductOptionDto;
import com.agri.market.dto.ProductOptionResponse;
import com.agri.market.dto.ProductWithOptionsDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<Page<ProductListDto>> getAllProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProductsWithReviewStats(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductWithOptionsDto> getProductById(@PathVariable Long id) {
        Optional<Product> productOpt = productService.getProductById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Product product = productOpt.get();
        ProductWithOptionsDto dto = new ProductWithOptionsDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setCategory(product.getCategory());
        dto.setOrigin(product.getOrigin());
        dto.setDescription(product.getDescription());
        dto.setPrice(product.getPrice());
        dto.setDiscountRate(product.getDiscountRate());
        dto.setStock(product.getStock());
        dto.setImageUrl(product.getImageUrl());
        dto.setImageUrls(product.getImageUrls());
        dto.setDetailImageUrls(product.getDetailImageUrls());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        dto.setDiscountedPrice(product.getDiscountedPrice());
        
        // 옵션 정보 추가
        List<ProductOptionResponse> options = product.getOptions().stream()
                .map(ProductOptionResponse::new)
                .collect(Collectors.toList());
        dto.setOptions(options);
        
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ProductListDto>> searchProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String origin,
            Pageable pageable) {
        Page<ProductListDto> products = productService.searchProductsWithReviewStats(keyword, category, origin, pageable);
        return ResponseEntity.ok(products);
    }

    // 공개 API: 상품 옵션 조회 (일반 사용자용)
    @GetMapping("/{productId}/options")
    public ResponseEntity<List<ProductOptionDto>> getProductOptions(@PathVariable Long productId) {
        List<ProductOption> options = productService.getProductOptions(productId);
        // 사용 가능한 옵션만 필터링
        List<ProductOptionDto> dtos = options.stream()
                .filter(ProductOption::getIsAvailable)
                .map(ProductOptionDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}