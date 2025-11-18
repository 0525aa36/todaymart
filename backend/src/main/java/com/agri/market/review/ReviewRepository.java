package com.agri.market.review;

import com.agri.market.product.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // 상품별 리뷰 조회
    Page<Review> findByProductId(Long productId, Pageable pageable);

    // 상품별 리뷰 조회 - Product, User를 함께 로딩
    @Query("SELECT r FROM Review r JOIN FETCH r.product JOIN FETCH r.user WHERE r.product.id = :productId")
    List<Review> findByProductIdWithProductAndUser(@Param("productId") Long productId);

    @Query(value = "SELECT r FROM Review r JOIN FETCH r.product JOIN FETCH r.user WHERE r.product.id = :productId",
           countQuery = "SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    Page<Review> findByProductIdWithProductAndUser(@Param("productId") Long productId, Pageable pageable);

    // 사용자별 리뷰 조회
    Page<Review> findByUserId(Long userId, Pageable pageable);

    // 상품별 평균 평점 계산
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    // 상품별 리뷰 개수
    Long countByProductId(Long productId);

    // 상품별 리뷰 삭제
    void deleteByProduct(Product product);

    /**
     * 여러 상품의 평균 평점을 한 번에 조회 (N+1 쿼리 방지)
     * @param productIds 상품 ID 리스트
     * @return Map<productId, averageRating>
     */
    @Query("SELECT r.product.id as productId, AVG(r.rating) as avgRating " +
           "FROM Review r " +
           "WHERE r.product.id IN :productIds " +
           "GROUP BY r.product.id")
    List<Map<String, Object>> findAverageRatingsByProductIds(@Param("productIds") List<Long> productIds);

    /**
     * 여러 상품의 리뷰 개수를 한 번에 조회 (N+1 쿼리 방지)
     * @param productIds 상품 ID 리스트
     * @return Map<productId, reviewCount>
     */
    @Query("SELECT r.product.id as productId, COUNT(r) as reviewCount " +
           "FROM Review r " +
           "WHERE r.product.id IN :productIds " +
           "GROUP BY r.product.id")
    List<Map<String, Object>> countReviewsByProductIds(@Param("productIds") List<Long> productIds);
}
