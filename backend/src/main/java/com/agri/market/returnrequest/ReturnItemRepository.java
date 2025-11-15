package com.agri.market.returnrequest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {

    /**
     * 반품 요청의 모든 아이템 조회
     */
    List<ReturnItem> findByReturnRequest(ReturnRequest returnRequest);

    /**
     * 반품 요청 ID로 아이템 조회
     */
    @Query("SELECT ri FROM ReturnItem ri WHERE ri.returnRequest.id = :returnRequestId")
    List<ReturnItem> findByReturnRequestId(@Param("returnRequestId") Long returnRequestId);

    /**
     * 주문 아이템 ID로 반품 아이템 조회
     */
    @Query("SELECT ri FROM ReturnItem ri WHERE ri.orderItem.id = :orderItemId")
    List<ReturnItem> findByOrderItemId(@Param("orderItemId") Long orderItemId);
}
