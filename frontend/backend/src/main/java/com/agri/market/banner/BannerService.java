package com.agri.market.banner;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class BannerService {

    private final BannerRepository bannerRepository;

    public BannerService(BannerRepository bannerRepository) {
        this.bannerRepository = bannerRepository;
    }

    public List<Banner> getAllBanners() {
        return bannerRepository.findAllByOrderByDisplayOrderAsc();
    }

    public List<Banner> getActiveBanners() {
        return bannerRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
    }

    public Banner getBannerById(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner not found with id: " + id));
    }

    @Transactional
    public Banner createBanner(Banner banner) {
        return bannerRepository.save(banner);
    }

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

    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = getBannerById(id);
        bannerRepository.delete(banner);
    }

    @Transactional
    public void toggleBannerActive(Long id) {
        Banner banner = getBannerById(id);
        banner.setIsActive(!banner.getIsActive());
        bannerRepository.save(banner);
    }
}
