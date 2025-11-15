package com.agri.market.admin;

import com.agri.market.dto.StockStatus;
import com.agri.market.dto.admin.BulkStockUpdateRequest;
import com.agri.market.dto.admin.InventoryItemResponse;
import com.agri.market.dto.admin.InventoryStatisticsResponse;
import com.agri.market.product.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Admin Inventory", description = "관리자 재고 관리 API")
@RestController
@RequestMapping("/api/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryController {

    private final ProductService productService;

    public AdminInventoryController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(summary = "재고 통계 조회", description = "전체 재고 현황 통계를 조회합니다")
    @GetMapping("/statistics")
    public ResponseEntity<InventoryStatisticsResponse> getInventoryStatistics() {
        return ResponseEntity.ok(productService.getInventoryStatistics());
    }

    @Operation(summary = "재고 목록 조회", description = "Product 및 ProductOption의 재고 목록을 조회합니다 (필터링, 페이징 지원)")
    @GetMapping("/items")
    public ResponseEntity<Page<InventoryItemResponse>> getInventoryItems(
            @Parameter(description = "재고 상태 필터 (SOLD_OUT, LOW_STOCK, IN_STOCK)")
            @RequestParam(required = false) StockStatus stockStatus,
            @Parameter(description = "검색 키워드 (상품명)")
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ResponseEntity.ok(productService.getInventoryItems(stockStatus, keyword, pageable));
    }

    @Operation(summary = "Product 재고 수정", description = "특정 Product의 재고를 수정합니다")
    @PutMapping("/product/{id}/stock")
    public ResponseEntity<Void> updateProductStock(
            @Parameter(description = "상품 ID") @PathVariable Long id,
            @Parameter(description = "새로운 재고 수량") @RequestParam Integer stock) {
        productService.updateProductStock(id, stock);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "ProductOption 재고 수정", description = "특정 ProductOption의 재고를 수정합니다")
    @PutMapping("/option/{id}/stock")
    public ResponseEntity<Void> updateProductOptionStock(
            @Parameter(description = "옵션 ID") @PathVariable Long id,
            @Parameter(description = "새로운 재고 수량") @RequestParam Integer stock) {
        productService.updateProductOptionStock(id, stock);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "재고 임계값 수정", description = "특정 Product의 재고 임계값을 수정합니다")
    @PutMapping("/product/{id}/threshold")
    public ResponseEntity<Void> updateLowStockThreshold(
            @Parameter(description = "상품 ID") @PathVariable Long id,
            @Parameter(description = "새로운 임계값") @RequestParam Integer threshold) {
        productService.updateLowStockThreshold(id, threshold);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "재고 일괄 수정", description = "여러 Product/ProductOption의 재고를 한 번에 수정합니다")
    @PutMapping("/bulk-update")
    public ResponseEntity<Void> bulkUpdateStock(@RequestBody BulkStockUpdateRequest request) {
        productService.bulkUpdateStock(request);
        return ResponseEntity.ok().build();
    }
}
