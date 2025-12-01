package com.agri.market.payment;

import com.agri.market.order.Order;
import com.agri.market.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrder(Order order);

    // 사용자별 결제 내역 조회
    @Query("SELECT p FROM Payment p WHERE p.order.user = :user ORDER BY p.paymentDate DESC")
    List<Payment> findByUser(@Param("user") User user);

    // paymentKey(transactionId)로 결제 조회 - 멱등성 체크용
    Optional<Payment> findByTransactionId(String transactionId);
}