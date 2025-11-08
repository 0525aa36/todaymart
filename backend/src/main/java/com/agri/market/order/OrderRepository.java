package com.agri.market.order;

import com.agri.market.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);

    // 관리자용: 모든 주문 조회 (페이징)
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 관리자용: 주문 상태별 조회
    Page<Order> findByOrderStatusOrderByCreatedAtDesc(OrderStatus orderStatus, Pageable pageable);

    // 관리자용: 날짜 범위별 조회
    @Query("SELECT o FROM Order o WHERE o.createdAt BETWEEN :startDate AND :endDate ORDER BY o.createdAt DESC")
    Page<Order> findByCreatedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    // 관리자용: 복합 필터링 (상태 + 날짜)
    @Query("SELECT o FROM Order o WHERE " +
           "(:orderStatus IS NULL OR o.orderStatus = :orderStatus) AND " +
           "(:startDate IS NULL OR o.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR o.createdAt <= :endDate) " +
           "ORDER BY o.createdAt DESC")
    Page<Order> findOrdersWithFilters(
        @Param("orderStatus") OrderStatus orderStatus,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus = :orderStatus")
    BigDecimal sumTotalAmountByOrderStatus(@Param("orderStatus") OrderStatus orderStatus);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus = :orderStatus AND o.createdAt BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalAmountByOrderStatusAndCreatedAtBetween(
        @Param("orderStatus") OrderStatus orderStatus,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    long countByOrderStatus(OrderStatus orderStatus);

    @Query("SELECT o FROM Order o " +
           "WHERE (:startDate IS NULL OR o.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR o.createdAt <= :endDate) " +
           "ORDER BY o.createdAt DESC")
    List<Order> findOrdersForExport(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // 사용자별 주문 수 조회
    long countByUserId(Long userId);

    // 사용자별 총 결제 금액 조회 (결제 완료 상태만)
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.user.id = :userId AND (o.orderStatus = 'PAID' OR o.orderStatus = 'PREPARING' OR o.orderStatus = 'SHIPPED' OR o.orderStatus = 'DELIVERED')")
    BigDecimal sumTotalAmountByUserId(@Param("userId") Long userId);

    // 사용자별 주문 내역 조회
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
}
