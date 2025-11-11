package com.agri.market.category;

import com.agri.market.dto.CategoryRequest;
import com.agri.market.dto.CategoryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    /**
     * 모든 카테고리 조회 (공개)
     */
    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getVisibleCategories() {
        return ResponseEntity.ok(categoryService.getVisibleCategories());
    }

    /**
     * 특정 카테고리 조회 (공개)
     */
    @GetMapping("/categories/{code}")
    public ResponseEntity<CategoryResponse> getCategoryByCode(@PathVariable String code) {
        return ResponseEntity.ok(categoryService.getCategoryByCode(code));
    }

    /**
     * 모든 카테고리 조회 - 숨김 포함 (관리자)
     */
    @GetMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    /**
     * 카테고리 생성 (관리자)
     */
    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    /**
     * 카테고리 수정 (관리자)
     */
    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    /**
     * 카테고리 삭제 (관리자)
     */
    @DeleteMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 카테고리 표시/숨김 토글 (관리자)
     */
    @PutMapping("/admin/categories/{id}/visibility")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> toggleVisibility(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.toggleVisibility(id));
    }

    /**
     * 카테고리 순서 변경 (관리자)
     */
    @PutMapping("/admin/categories/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateOrder(@RequestBody List<Long> categoryIds) {
        categoryService.updateOrder(categoryIds);
        return ResponseEntity.noContent().build();
    }
}