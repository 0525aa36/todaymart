package com.agri.market.seller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {

    // 사업자등록번호로 조회
    Optional<Seller> findByBusinessNumber(String businessNumber);

    // 사업자등록번호 존재 여부 확인 (중복 체크)
    boolean existsByBusinessNumber(String businessNumber);

    // 사업자명으로 검색 (부분 일치)
    Page<Seller> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // 활성 상태 판매자 조회
    List<Seller> findByIsActiveTrue();

    // 활성 상태 판매자 페이지 조회 (페이지네이션)
    Page<Seller> findByIsActiveTrue(Pageable pageable);

    // 활성 상태 판매자 페이지 조회
    Page<Seller> findByIsActive(Boolean isActive, Pageable pageable);
}
