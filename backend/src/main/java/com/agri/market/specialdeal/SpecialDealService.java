package com.agri.market.specialdeal;

import com.agri.market.dto.SpecialDealRequest;
import com.agri.market.product.Product;
import com.agri.market.product.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SpecialDealService {

    private final SpecialDealRepository specialDealRepository;
    private final ProductRepository productRepository;

    /**
     * 현재 진행 중인 특가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SpecialDeal> getOngoingDeals() {
        List<SpecialDeal> deals = specialDealRepository.findOngoingDeals(LocalDateTime.now());
        // Lazy loading 강제 초기화
        deals.forEach(deal -> deal.getProducts().size());
        return deals;
    }

    /**
     * 예정된 특가 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SpecialDeal> getUpcomingDeals() {
        List<SpecialDeal> deals = specialDealRepository.findUpcomingDeals(LocalDateTime.now());
        // Lazy loading 강제 초기화
        deals.forEach(deal -> deal.getProducts().size());
        return deals;
    }

    /**
     * 특가 ID로 조회
     */
    @Transactional(readOnly = true)
    public SpecialDeal getSpecialDealById(Long id) {
        SpecialDeal deal = specialDealRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("특가를 찾을 수 없습니다. ID: " + id));
        // Lazy loading 강제 초기화
        deal.getProducts().size();
        return deal;
    }

    /**
     * 특가 생성
     */
    @Transactional
    public SpecialDeal createSpecialDeal(SpecialDeal specialDeal) {
        return specialDealRepository.save(specialDeal);
    }

    /**
     * 특가 생성 (DTO 사용, 상품 포함)
     */
    @Transactional
    public SpecialDeal createSpecialDealWithProducts(SpecialDealRequest request) {
        SpecialDeal specialDeal = new SpecialDeal();
        specialDeal.setTitle(request.getTitle());
        specialDeal.setDescription(request.getDescription());
        specialDeal.setStartTime(request.getStartTime());
        specialDeal.setEndTime(request.getEndTime());
        specialDeal.setDiscountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO);
        specialDeal.setIsActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE);
        specialDeal.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        specialDeal.setBannerImageUrl(request.getBannerImageUrl());
        specialDeal.setBackgroundColor(request.getBackgroundColor());
        specialDeal.setTextColor(request.getTextColor());

        SpecialDeal saved = specialDealRepository.save(specialDeal);

        // 상품 연결
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            for (Long productId : request.getProductIds()) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다. ID: " + productId));
                saved.addProduct(product);
            }
            saved = specialDealRepository.save(saved);
        }

        return saved;
    }

    /**
     * 특가 수정
     */
    @Transactional
    public SpecialDeal updateSpecialDeal(Long id, SpecialDeal updatedDeal) {
        SpecialDeal existing = getSpecialDealById(id);

        existing.setTitle(updatedDeal.getTitle());
        existing.setDescription(updatedDeal.getDescription());
        existing.setStartTime(updatedDeal.getStartTime());
        existing.setEndTime(updatedDeal.getEndTime());
        existing.setDiscountRate(updatedDeal.getDiscountRate());
        existing.setIsActive(updatedDeal.getIsActive());
        existing.setDisplayOrder(updatedDeal.getDisplayOrder());
        existing.setBannerImageUrl(updatedDeal.getBannerImageUrl());
        existing.setBackgroundColor(updatedDeal.getBackgroundColor());
        existing.setTextColor(updatedDeal.getTextColor());

        return specialDealRepository.save(existing);
    }

    /**
     * 특가 수정 (DTO 사용, 상품 포함)
     */
    @Transactional
    public SpecialDeal updateSpecialDealWithProducts(Long id, SpecialDealRequest request) {
        SpecialDeal existing = getSpecialDealById(id);

        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setStartTime(request.getStartTime());
        existing.setEndTime(request.getEndTime());
        existing.setDiscountRate(request.getDiscountRate() != null ? request.getDiscountRate() : BigDecimal.ZERO);
        existing.setIsActive(request.getIsActive() != null ? request.getIsActive() : Boolean.TRUE);
        existing.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        existing.setBannerImageUrl(request.getBannerImageUrl());
        existing.setBackgroundColor(request.getBackgroundColor());
        existing.setTextColor(request.getTextColor());

        // 기존 상품 연결 모두 제거
        existing.getProducts().clear();

        // 새로운 상품 연결
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            for (Long productId : request.getProductIds()) {
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다. ID: " + productId));
                existing.addProduct(product);
            }
        }

        return specialDealRepository.save(existing);
    }

    /**
     * 특가 삭제
     */
    @Transactional
    public void deleteSpecialDeal(Long id) {
        SpecialDeal specialDeal = getSpecialDealById(id);
        specialDealRepository.delete(specialDeal);
    }

    /**
     * 특가에 상품 추가
     */
    @Transactional
    public void addProductToDeal(Long dealId, Long productId) {
        SpecialDeal specialDeal = getSpecialDealById(dealId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다. ID: " + productId));

        specialDeal.addProduct(product);
        specialDealRepository.save(specialDeal);
    }

    /**
     * 특가에서 상품 제거
     */
    @Transactional
    public void removeProductFromDeal(Long dealId, Long productId) {
        SpecialDeal specialDeal = getSpecialDealById(dealId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("상품을 찾을 수 없습니다. ID: " + productId));

        specialDeal.removeProduct(product);
        specialDealRepository.save(specialDeal);
    }

    /**
     * 모든 활성화된 특가 조회
     */
    @Transactional(readOnly = true)
    public List<SpecialDeal> getAllActiveDeals() {
        List<SpecialDeal> deals = specialDealRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        // Lazy loading 강제 초기화
        deals.forEach(deal -> deal.getProducts().size());
        return deals;
    }

    /**
     * 모든 특가 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<SpecialDeal> getAllDeals() {
        List<SpecialDeal> deals = specialDealRepository.findAll();
        // Lazy loading 강제 초기화
        deals.forEach(deal -> deal.getProducts().size());
        return deals;
    }
}
