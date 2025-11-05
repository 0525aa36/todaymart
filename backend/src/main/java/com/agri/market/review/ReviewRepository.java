package com.agri.market.review;

import com.agri.market.product.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 상품별 리뷰 조회
    Page<Review> findByProductId(Long productId, Pageable pageable);

    // 사용자별 리뷰 조회
    Page<Review> findByUserId(Long userId, Pageable pageable);

    // 상품별 평균 평점 계산
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    // 상품별 리뷰 개수
    Long countByProductId(Long productId);

    // 상품별 리뷰 삭제
    void deleteByProduct(Product product);
}
