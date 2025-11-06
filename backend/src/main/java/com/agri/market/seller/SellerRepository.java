package com.agri.market.seller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {

    // 사업자등록번호로 조회
    Optional<Seller> findByBusinessNumber(String businessNumber);

    // 사업자등록번호 중복 체크
    boolean existsByBusinessNumber(String businessNumber);

    // 판매자명으로 검색
    Page<Seller> findByNameContaining(String name, Pageable pageable);

    // 활성화 상태별 조회
    Page<Seller> findByIsActive(Boolean isActive, Pageable pageable);

    // 활성화된 판매자만 조회
    Page<Seller> findByIsActiveTrue(Pageable pageable);
}
