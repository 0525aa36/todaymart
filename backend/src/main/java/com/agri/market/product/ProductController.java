package com.agri.market.product;

import com.agri.market.dto.ProductListDto;
import com.agri.market.dto.ProductOptionDto;
import com.agri.market.dto.ProductOptionResponse;
import com.agri.market.dto.ProductWithOptionsDto;
import com.agri.market.dto.StockStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Tag(name = "Products", description = "상품 조회 및 검색 API")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(summary = "전체 상품 조회", description = "페이지네이션을 지원하는 전체 상품 목록을 조회합니다. 리뷰 평점과 개수를 포함합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "상품 목록 조회 성공",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    @GetMapping
    public ResponseEntity<Page<ProductListDto>> getAllProducts(Pageable pageable) {
        return ResponseEntity.ok(productService.getAllProductsWithReviewStats(pageable));
    }

    @Operation(summary = "상품 상세 조회", description = "상품 ID로 상세 정보를 조회합니다. 상품 옵션 정보를 포함합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "상품 조회 성공",
                    content = @Content(schema = @Schema(implementation = ProductWithOptionsDto.class))),
            @ApiResponse(responseCode = "404", description = "상품을 찾을 수 없음")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ProductWithOptionsDto> getProductById(
            @Parameter(description = "상품 ID", required = true) @PathVariable Long id) {
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
        dto.setSummary(product.getSummary());
        dto.setDetailDescription(product.getDetailDescription());
        dto.setPrice(product.getPrice());
        dto.setDiscountRate(product.getDiscountRate());
        dto.setStock(product.getStock());
        dto.setLowStockThreshold(product.getLowStockThreshold());

        // 재고 상태 계산
        if (product.getStock() == 0) {
            dto.setStockStatus(StockStatus.SOLD_OUT);
        } else if (product.getStock() <= product.getLowStockThreshold()) {
            dto.setStockStatus(StockStatus.LOW_STOCK);
        } else {
            dto.setStockStatus(StockStatus.IN_STOCK);
        }

        dto.setImageUrl(product.getImageUrl());
        dto.setImageUrls(product.getImageUrls());
        dto.setDetailImageUrls(product.getDetailImageUrls());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        dto.setDiscountedPrice(product.getDiscountedPrice());
        dto.setShippingFee(product.getShippingFee());
        dto.setCanCombineShipping(product.getCanCombineShipping());
        dto.setCombineShippingUnit(product.getCombineShippingUnit());
        dto.setMinOrderQuantity(product.getMinOrderQuantity());
        dto.setMaxOrderQuantity(product.getMaxOrderQuantity());
        dto.setCourierCompany(product.getCourierCompany());
        dto.setCourierCode(product.getCourierCode());
        dto.setIsEventProduct(product.getIsEventProduct());

        // 판매자 정보 추가
        if (product.getSeller() != null) {
            dto.setSeller(new ProductWithOptionsDto.SellerDto(
                product.getSeller().getId(),
                product.getSeller().getName()
            ));
        }

        // 옵션 정보 추가
        List<ProductOptionResponse> options = product.getOptions().stream()
                .map(ProductOptionResponse::new)
                .collect(Collectors.toList());
        dto.setOptions(options);
        
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "상품 검색", description = "키워드, 카테고리, 원산지로 상품을 검색합니다. 리뷰 평점과 개수를 포함합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "검색 성공",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    @GetMapping("/search")
    public ResponseEntity<Page<ProductListDto>> searchProducts(
            @Parameter(description = "검색 키워드 (상품명, 설명)") @RequestParam(required = false) String keyword,
            @Parameter(description = "카테고리 필터") @RequestParam(required = false) String category,
            @Parameter(description = "원산지 필터") @RequestParam(required = false) String origin,
            Pageable pageable) {
        Page<ProductListDto> products = productService.searchProductsWithReviewStats(keyword, category, origin, pageable);
        return ResponseEntity.ok(products);
    }

    @Operation(summary = "상품 옵션 조회", description = "특정 상품의 사용 가능한 옵션 목록을 조회합니다 (예: 크기, 무게 등)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "옵션 조회 성공",
                    content = @Content(schema = @Schema(implementation = ProductOptionDto.class)))
    })
    @GetMapping("/{productId}/options")
    public ResponseEntity<List<ProductOptionDto>> getProductOptions(
            @Parameter(description = "상품 ID", required = true) @PathVariable Long productId) {
        List<ProductOption> options = productService.getProductOptions(productId);
        // 사용 가능한 옵션만 필터링
        List<ProductOptionDto> dtos = options.stream()
                .filter(ProductOption::getIsAvailable)
                .map(ProductOptionDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @Operation(summary = "카테고리별 상품 조회", description = "특정 카테고리의 상품 목록을 조회합니다. 리뷰 평점과 개수를 포함합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "카테고리 상품 조회 성공",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    @GetMapping("/category/{categoryCode}")
    public ResponseEntity<Page<ProductListDto>> getProductsByCategory(
            @Parameter(description = "카테고리 코드", required = true) @PathVariable String categoryCode,
            Pageable pageable) {
        return ResponseEntity.ok(productService.getProductsByCategoryCode(categoryCode, pageable));
    }

    // ==================== 트렌딩 및 MD 추천 엔드포인트 ====================

    @Operation(summary = "인기 급상승 상품 조회", description = "조회수와 판매량을 기반으로 인기 급상승 상품 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "인기 상품 조회 성공",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    @GetMapping("/trending")
    public ResponseEntity<Page<ProductListDto>> getTrendingProducts(Pageable pageable) {
        Page<ProductListDto> products = productService.getTrendingProducts(pageable);
        return ResponseEntity.ok(products);
    }

    @Operation(summary = "MD 추천 상품 조회", description = "MD가 추천한 상품 목록을 조회합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "MD 추천 상품 조회 성공",
                    content = @Content(schema = @Schema(implementation = Page.class)))
    })
    @GetMapping("/md-picks")
    public ResponseEntity<Page<ProductListDto>> getMdPickProducts(Pageable pageable) {
        Page<ProductListDto> products = productService.getMdPickProducts(pageable);
        return ResponseEntity.ok(products);
    }

    @Operation(summary = "상품 조회수 증가", description = "상품 상세 페이지 조회 시 호출하여 조회수를 증가시킵니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회수 증가 성공")
    })
    @PostMapping("/{productId}/view")
    public ResponseEntity<Void> incrementViewCount(
            @Parameter(description = "상품 ID", required = true) @PathVariable Long productId) {
        productService.incrementViewCount(productId);
        return ResponseEntity.ok().build();
    }

    // ==================== 관리자 전용 엔드포인트 ====================

    @Operation(summary = "[관리자] MD 추천 설정", description = "상품을 MD 추천으로 설정하거나 해제합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "MD 추천 설정 성공",
                    content = @Content(schema = @Schema(implementation = Product.class)))
    })
    @PostMapping("/admin/{productId}/md-pick")
    public ResponseEntity<Product> toggleMdPick(
            @Parameter(description = "상품 ID", required = true) @PathVariable Long productId,
            @Parameter(description = "추천 이유") @RequestParam(required = false) String reason) {
        Product product = productService.toggleMdPick(productId, reason);
        return ResponseEntity.ok(product);
    }
}