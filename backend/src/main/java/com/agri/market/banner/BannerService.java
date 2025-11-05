package com.agri.market.banner;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BannerService {

    private final BannerRepository bannerRepository;

    public BannerService(BannerRepository bannerRepository) {
        this.bannerRepository = bannerRepository;
    }

    /**
     * 활성화된 배너 목록 조회 (공개 API)
     */
    @Transactional(readOnly = true)
    public List<Banner> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    /**
     * 모든 배너 목록 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<Banner> getAllBanners() {
        return bannerRepository.findAllByOrderByDisplayOrderAsc();
    }

    /**
     * 배너 ID로 조회
     */
    @Transactional(readOnly = true)
    public Banner getBannerById(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
    }

    /**
     * 배너 생성
     */
    @Transactional
    public Banner createBanner(Banner banner) {
        return bannerRepository.save(banner);
    }

    /**
     * 배너 수정
     */
    @Transactional
    public Banner updateBanner(Long id, Banner bannerDetails) {
        Banner banner = getBannerById(id);

        banner.setTitle(bannerDetails.getTitle());
        banner.setDescription(bannerDetails.getDescription());
        banner.setImageUrl(bannerDetails.getImageUrl());
        banner.setLinkUrl(bannerDetails.getLinkUrl());
        banner.setDisplayOrder(bannerDetails.getDisplayOrder());
        banner.setIsActive(bannerDetails.getIsActive());
        banner.setBackgroundColor(bannerDetails.getBackgroundColor());
        banner.setTextColor(bannerDetails.getTextColor());

        return bannerRepository.save(banner);
    }

    /**
     * 배너 삭제
     */
    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = getBannerById(id);
        bannerRepository.delete(banner);
    }

    /**
     * 배너 활성화/비활성화 토글
     */
    @Transactional
    public Banner toggleBannerStatus(Long id) {
        Banner banner = getBannerById(id);
        banner.setIsActive(!banner.getIsActive());
        return bannerRepository.save(banner);
    }
}
