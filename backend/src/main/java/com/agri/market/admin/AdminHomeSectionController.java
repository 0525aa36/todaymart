package com.agri.market.admin;

import com.agri.market.dto.HomeSectionRequest;
import com.agri.market.dto.HomeSectionResponse;
import com.agri.market.dto.ReorderRequest;
import com.agri.market.home.HomeSection;
import com.agri.market.home.HomeSectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/home-sections")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminHomeSectionController {

    private final HomeSectionService service;

    /**
     * Get all sections (including inactive)
     */
    @GetMapping
    public ResponseEntity<List<HomeSectionResponse>> getAllSections() {
        return ResponseEntity.ok(service.getAllSections());
    }

    /**
     * Get section by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<HomeSectionResponse> getSectionById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getSectionById(id));
    }

    /**
     * Create new section
     */
    @PostMapping
    public ResponseEntity<HomeSectionResponse> createSection(@RequestBody HomeSectionRequest request) {
        HomeSectionResponse response = service.createSection(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Update section
     */
    @PutMapping("/{id}")
    public ResponseEntity<HomeSectionResponse> updateSection(
            @PathVariable Long id,
            @RequestBody HomeSectionRequest request) {
        return ResponseEntity.ok(service.updateSection(id, request));
    }

    /**
     * Toggle section active status
     */
    @PutMapping("/{id}/toggle")
    public ResponseEntity<HomeSectionResponse> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.toggleActive(id));
    }

    /**
     * Delete section
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSection(@PathVariable Long id) {
        service.deleteSection(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reorder sections (drag and drop)
     */
    @PutMapping("/reorder")
    public ResponseEntity<List<HomeSectionResponse>> reorderSections(@RequestBody ReorderRequest request) {
        return ResponseEntity.ok(service.reorderSections(request));
    }

    /**
     * Get sections by type
     */
    @GetMapping("/by-type/{type}")
    public ResponseEntity<List<HomeSectionResponse>> getSectionsByType(@PathVariable HomeSection.SectionType type) {
        return ResponseEntity.ok(service.getSectionsByType(type));
    }
}
