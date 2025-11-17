package com.agri.market.product;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // 카테고리로 검색 (기존 String 카테고리)
    Page<Product> findByCategory(String category, Pageable pageable);

    // 카테고리 엔티티로 검색
    @Query("SELECT p FROM Product p WHERE p.categoryEntity.id = :categoryId")
    Page<Product> findByCategoryEntityId(@Param("categoryId") Long categoryId, Pageable pageable);

    // 카테고리 코드로 검색 (Category 엔티티 사용)
    @Query("SELECT p FROM Product p WHERE p.categoryEntity.code = :categoryCode")
    Page<Product> findByCategoryCode(@Param("categoryCode") String categoryCode, Pageable pageable);

    // 상품명으로 검색 (부분 일치)
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // 원산지로 검색
    Page<Product> findByOriginContainingIgnoreCase(String origin, Pageable pageable);

    // 복합 검색: 상품명, 카테고리, 원산지
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.seller WHERE " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:category IS NULL OR p.category = :category) AND " +
           "(:origin IS NULL OR LOWER(p.origin) LIKE LOWER(CONCAT('%', :origin, '%')))")
    Page<Product> searchProducts(
        @Param("keyword") String keyword,
        @Param("category") String category,
        @Param("origin") String origin,
        Pageable pageable
    );

    // 재고 관리를 위한 Pessimistic Lock (동시성 제어)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdWithLock(@Param("id") Long id);

    // 중복 체크용
    boolean existsByName(String name);

    // Lazy loading 문제 해결: seller를 fetch join으로 미리 로드
    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.seller")
    List<Product> findAllWithImages();

    // Pageable 지원 버전
    @Query(value = "SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.seller",
           countQuery = "SELECT COUNT(DISTINCT p) FROM Product p")
    Page<Product> findAllWithImages(Pageable pageable);

    // 개별 상품 조회 시 seller를 fetch join으로 미리 로드
    // Note: options는 별도 API로 조회하거나 필요시 LAZY로 로드
    @Query("SELECT p FROM Product p " +
           "LEFT JOIN FETCH p.seller " +
           "WHERE p.id = :id")
    Optional<Product> findByIdWithImagesAndOptions(@Param("id") Long id);

    // 재고 부족 상품 조회 (재고가 threshold 이하인 상품)
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller WHERE p.stock <= :threshold ORDER BY p.stock ASC")
    List<Product> findLowStockProducts(@Param("threshold") Integer threshold);

    // 재고 부족 상품 수 조회
    @Query("SELECT COUNT(p) FROM Product p WHERE p.stock <= :threshold")
    long countLowStockProducts(@Param("threshold") Integer threshold);

    // 재고 부족 상품 수 조회 (countByStockLessThan 메서드)
    long countByStockLessThan(int threshold);

    // 재고 부족 상품 목록 조회 (findByStockLessThan 메서드)
    List<Product> findByStockLessThan(int threshold);

    // 판매자별 상품 조회
    // Note: options는 LAZY loading으로 자동 로드됨 (MultipleBagFetchException 방지)
    @Query("SELECT DISTINCT p FROM Product p " +
           "WHERE p.seller.id = :sellerId " +
           "ORDER BY p.createdAt DESC")
    List<Product> findBySellerIdWithImagesAndOptions(@Param("sellerId") Long sellerId);

    // ==================== 트렌딩 및 MD 추천 쿼리 ====================

    // 조회수 기준 인기 상품
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller " +
           "ORDER BY p.viewCount DESC, p.createdAt DESC")
    Page<Product> findByOrderByViewCountDescCreatedAtDesc(Pageable pageable);

    // 판매량 기준 인기 상품
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller " +
           "ORDER BY p.salesCount DESC, p.createdAt DESC")
    Page<Product> findByOrderBySalesCountDescCreatedAtDesc(Pageable pageable);

    // MD 추천 상품
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.seller " +
           "WHERE p.isMdPick = true " +
           "ORDER BY p.createdAt DESC")
    Page<Product> findByIsMdPickTrueOrderByCreatedAtDesc(Pageable pageable);

    // 모든 카테고리 목록 조회
    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL ORDER BY p.category")
    List<String> findDistinctCategories();
}