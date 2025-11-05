package com.agri.market.banner;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class BannerController {

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    /**
     * 활성화된 배너 목록 조회 (공개 API)
     */
    @GetMapping("/banners")
    public ResponseEntity<List<Banner>> getActiveBanners() {
        return ResponseEntity.ok(bannerService.getActiveBanners());
    }

    /**
     * 모든 배너 목록 조회 (관리자용)
     */
    @GetMapping("/admin/banners")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Banner>> getAllBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    /**
     * 배너 ID로 조회 (관리자용)
     */
    @GetMapping("/admin/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> getBannerById(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.getBannerById(id));
    }

    /**
     * 배너 생성 (관리자용)
     */
    @PostMapping("/admin/banners")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> createBanner(@RequestBody Banner banner) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bannerService.createBanner(banner));
    }

    /**
     * 배너 수정 (관리자용)
     */
    @PutMapping("/admin/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> updateBanner(@PathVariable Long id, @RequestBody Banner banner) {
        return ResponseEntity.ok(bannerService.updateBanner(id, banner));
    }

    /**
     * 배너 삭제 (관리자용)
     */
    @DeleteMapping("/admin/banners/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 배너 활성화/비활성화 토글 (관리자용)
     */
    @PutMapping("/admin/banners/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Banner> toggleBannerStatus(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.toggleBannerStatus(id));
    }
}
