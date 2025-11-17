package com.agri.market.home;

import com.agri.market.dto.HomeSectionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/home-sections")
@RequiredArgsConstructor
public class HomeSectionController {

    private final HomeSectionService service;

    /**
     * Get active sections for homepage display
     * This endpoint is public and returns only active sections
     */
    @GetMapping
    public ResponseEntity<List<HomeSectionResponse>> getActiveSections() {
        return ResponseEntity.ok(service.getActiveSections());
    }
}
