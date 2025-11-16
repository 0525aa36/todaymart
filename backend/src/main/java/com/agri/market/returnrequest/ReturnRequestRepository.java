package com.agri.market.returnrequest;

import com.agri.market.order.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, Long> {

    /**
     * 주문으로 반품 요청 조회
     */
    Optional<ReturnRequest> findByOrder(Order order);

    /**
     * 주문 ID로 반품 요청 조회
     */
    @Query("SELECT rr FROM ReturnRequest rr WHERE rr.order.id = :orderId")
    Optional<ReturnRequest> findByOrderId(@Param("orderId") Long orderId);

    /**
     * 사용자의 반품 요청 목록 조회
     */
    @Query("SELECT rr FROM ReturnRequest rr WHERE rr.order.user.email = :userEmail ORDER BY rr.requestedAt DESC")
    List<ReturnRequest> findByUserEmail(@Param("userEmail") String userEmail);

    /**
     * 상태별 반품 요청 조회
     */
    Page<ReturnRequest> findByStatus(ReturnStatus status, Pageable pageable);

    /**
     * 사유 카테고리별 반품 요청 조회
     */
    Page<ReturnRequest> findByReasonCategory(ReturnReasonCategory reasonCategory, Pageable pageable);

    /**
     * 기간별 반품 요청 조회
     */
    @Query("SELECT rr FROM ReturnRequest rr WHERE rr.requestedAt BETWEEN :startDate AND :endDate")
    List<ReturnRequest> findByRequestedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * 대기 중인 반품 요청 개수
     */
    long countByStatus(ReturnStatus status);

    /**
     * 모든 반품 요청 조회 (페이징, 연관 엔티티 즉시 로딩)
     */
    @Query("SELECT DISTINCT rr FROM ReturnRequest rr " +
           "LEFT JOIN FETCH rr.order o " +
           "LEFT JOIN FETCH o.orderItems " +
           "ORDER BY rr.requestedAt DESC")
    Page<ReturnRequest> findAllWithOrder(Pageable pageable);

    /**
     * 복합 필터링 조회 (모든 연관 엔티티 즉시 로딩)
     */
    @Query("SELECT DISTINCT rr FROM ReturnRequest rr " +
           "LEFT JOIN FETCH rr.order o " +
           "LEFT JOIN FETCH o.user u " +
           "LEFT JOIN FETCH o.orderItems orderItems " +
           "LEFT JOIN FETCH rr.returnItems ri " +
           "LEFT JOIN FETCH ri.orderItem oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE (:status IS NULL OR rr.status = :status) " +
           "AND (:reasonCategory IS NULL OR rr.reasonCategory = :reasonCategory) " +
           "AND (:keyword IS NULL OR o.orderNumber LIKE %:keyword% " +
           "                     OR u.name LIKE %:keyword%) " +
           "ORDER BY rr.requestedAt DESC")
    Page<ReturnRequest> findByFilters(
        @Param("status") ReturnStatus status,
        @Param("reasonCategory") ReturnReasonCategory reasonCategory,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    /**
     * ID로 반품 요청 조회 (모든 연관 엔티티 즉시 로딩)
     */
    @Query("SELECT DISTINCT rr FROM ReturnRequest rr " +
           "LEFT JOIN FETCH rr.order o " +
           "LEFT JOIN FETCH o.user u " +
           "LEFT JOIN FETCH o.orderItems " +
           "LEFT JOIN FETCH rr.returnItems ri " +
           "LEFT JOIN FETCH ri.orderItem oi " +
           "LEFT JOIN FETCH oi.product " +
           "WHERE rr.id = :id")
    Optional<ReturnRequest> findByIdWithAll(@Param("id") Long id);
}
