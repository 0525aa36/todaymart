package com.agri.market.service;

import com.agri.market.dto.ProductNoticeRequest;
import com.agri.market.dto.ProductNoticeResponse;
import com.agri.market.exception.BusinessException;
import com.agri.market.product.Product;
import com.agri.market.product.ProductNotice;
import com.agri.market.product.ProductNoticeRepository;
import com.agri.market.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductNoticeService {

    private final ProductNoticeRepository productNoticeRepository;
    private final ProductRepository productRepository;

    /**
     * 상품 ID로 상품 고시 정보 조회
     */
    @Transactional(readOnly = true)
    public ProductNoticeResponse getByProductId(Long productId) {
        return productNoticeRepository.findByProductId(productId)
                .map(ProductNoticeResponse::from)
                .orElse(null);
    }

    /**
     * 상품 고시 정보 생성
     */
    @Transactional
    public ProductNoticeResponse create(Long productId, ProductNoticeRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다.", "PRODUCT_NOT_FOUND"));

        // 이미 고시 정보가 있는 경우 업데이트
        ProductNotice notice = productNoticeRepository.findByProductId(productId)
                .orElse(new ProductNotice());

        notice.setProduct(product);
        updateNoticeFromRequest(notice, request);

        ProductNotice saved = productNoticeRepository.save(notice);
        return ProductNoticeResponse.from(saved);
    }

    /**
     * 상품 고시 정보 수정
     */
    @Transactional
    public ProductNoticeResponse update(Long productId, ProductNoticeRequest request) {
        ProductNotice notice = productNoticeRepository.findByProductId(productId)
                .orElseThrow(() -> new BusinessException("해당 상품의 고시 정보가 없습니다.", "NOTICE_NOT_FOUND"));

        updateNoticeFromRequest(notice, request);

        ProductNotice updated = productNoticeRepository.save(notice);
        return ProductNoticeResponse.from(updated);
    }

    /**
     * 상품 고시 정보 삭제
     */
    @Transactional
    public void delete(Long productId) {
        productNoticeRepository.deleteByProductId(productId);
    }

    /**
     * Request DTO에서 Entity로 데이터 복사
     */
    private void updateNoticeFromRequest(ProductNotice notice, ProductNoticeRequest request) {
        notice.setProductName(request.getProductName());
        notice.setFoodType(request.getFoodType());
        notice.setManufacturer(request.getManufacturer());
        notice.setExpirationInfo(request.getExpirationInfo());
        notice.setCapacity(request.getCapacity());
        notice.setIngredients(request.getIngredients());
        notice.setNutritionFacts(request.getNutritionFacts());
        notice.setGmoInfo(request.getGmoInfo());
        notice.setSafetyWarnings(request.getSafetyWarnings());
        notice.setImportDeclaration(request.getImportDeclaration());
        notice.setCustomerServicePhone(request.getCustomerServicePhone());
    }
}
