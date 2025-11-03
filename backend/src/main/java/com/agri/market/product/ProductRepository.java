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

    // 카테고리로 검색
    Page<Product> findByCategory(String category, Pageable pageable);

    // 상품명으로 검색 (부분 일치)
    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // 원산지로 검색
    Page<Product> findByOriginContainingIgnoreCase(String origin, Pageable pageable);

    // 복합 검색: 상품명, 카테고리, 원산지
    @Query("SELECT p FROM Product p WHERE " +
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
}