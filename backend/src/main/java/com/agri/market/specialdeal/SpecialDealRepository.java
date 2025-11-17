package com.agri.market.specialdeal;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SpecialDealRepository extends JpaRepository<SpecialDeal, Long> {

    // 활성화된 특가 조회
    List<SpecialDeal> findByIsActiveTrueOrderByDisplayOrderAsc();

    // 현재 진행 중인 특가 조회 (활성화 + 시작 후 + 종료 전)
    @Query("SELECT sd FROM SpecialDeal sd WHERE sd.isActive = true " +
           "AND sd.startTime <= :now AND sd.endTime > :now " +
           "ORDER BY sd.displayOrder ASC")
    List<SpecialDeal> findOngoingDeals(LocalDateTime now);

    // 예정된 특가 조회 (활성화 + 시작 전)
    @Query("SELECT sd FROM SpecialDeal sd WHERE sd.isActive = true " +
           "AND sd.startTime > :now " +
           "ORDER BY sd.startTime ASC")
    List<SpecialDeal> findUpcomingDeals(LocalDateTime now);
}
