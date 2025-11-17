package com.agri.market.home;

import com.agri.market.dto.HomeSectionRequest;
import com.agri.market.dto.HomeSectionResponse;
import com.agri.market.dto.ReorderRequest;
import com.agri.market.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class HomeSectionService {

    private final HomeSectionRepository repository;

    /**
     * Get all sections (for admin)
     */
    @Transactional(readOnly = true)
    public List<HomeSectionResponse> getAllSections() {
        return repository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(HomeSectionResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Get active sections only (for public homepage)
     */
    @Transactional(readOnly = true)
    public List<HomeSectionResponse> getActiveSections() {
        return repository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(HomeSectionResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Get section by ID
     */
    @Transactional(readOnly = true)
    public HomeSectionResponse getSectionById(Long id) {
        HomeSection section = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Section not found with id: " + id));
        return HomeSectionResponse.from(section);
    }

    /**
     * Create new section
     */
    public HomeSectionResponse createSection(HomeSectionRequest request) {
        // If display order not specified, put at end
        Integer displayOrder = request.getDisplayOrder();
        if (displayOrder == null) {
            displayOrder = repository.findMaxDisplayOrder() + 1;
        }

        HomeSection section = HomeSection.builder()
                .sectionType(request.getSectionType())
                .title(request.getTitle())
                .description(request.getDescription())
                .displayOrder(displayOrder)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .config(request.getConfig())
                .build();

        HomeSection saved = repository.save(section);
        return HomeSectionResponse.from(saved);
    }

    /**
     * Update existing section
     */
    public HomeSectionResponse updateSection(Long id, HomeSectionRequest request) {
        HomeSection section = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Section not found with id: " + id));

        if (request.getSectionType() != null) {
            section.setSectionType(request.getSectionType());
        }
        if (request.getTitle() != null) {
            section.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            section.setDescription(request.getDescription());
        }
        if (request.getDisplayOrder() != null) {
            section.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getIsActive() != null) {
            section.setIsActive(request.getIsActive());
        }
        if (request.getConfig() != null) {
            section.setConfig(request.getConfig());
        }

        HomeSection updated = repository.save(section);
        return HomeSectionResponse.from(updated);
    }

    /**
     * Toggle section active status
     */
    public HomeSectionResponse toggleActive(Long id) {
        HomeSection section = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Section not found with id: " + id));

        section.setIsActive(!section.getIsActive());
        HomeSection updated = repository.save(section);
        return HomeSectionResponse.from(updated);
    }

    /**
     * Delete section
     */
    public void deleteSection(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Section not found with id: " + id);
        }
        repository.deleteById(id);
    }

    /**
     * Reorder sections
     */
    public List<HomeSectionResponse> reorderSections(ReorderRequest request) {
        // Update display orders
        for (ReorderRequest.OrderItem item : request.getItems()) {
            HomeSection section = repository.findById(item.getId())
                    .orElseThrow(() -> new NotFoundException("Section not found with id: " + item.getId()));
            section.setDisplayOrder(item.getDisplayOrder());
            repository.save(section);
        }

        // Return updated list
        return getAllSections();
    }

    /**
     * Get sections by type
     */
    @Transactional(readOnly = true)
    public List<HomeSectionResponse> getSectionsByType(HomeSection.SectionType type) {
        return repository.findBySectionTypeOrderByDisplayOrderAsc(type)
                .stream()
                .map(HomeSectionResponse::from)
                .collect(Collectors.toList());
    }
}
