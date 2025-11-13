package com.agri.market.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductNoticeRepository extends JpaRepository<ProductNotice, Long> {

    /**
     * 상품 ID로 상품 고시 정보 조회
     */
    Optional<ProductNotice> findByProductId(Long productId);

    /**
     * 상품 ID로 상품 고시 정보 삭제
     */
    void deleteByProductId(Long productId);
}
