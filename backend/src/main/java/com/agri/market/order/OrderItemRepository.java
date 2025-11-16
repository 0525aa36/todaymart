package com.agri.market.order;

import com.agri.market.dto.TopProductDTO;
import com.agri.market.product.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    boolean existsByProduct(Product product);

    @Query("SELECT new com.agri.market.dto.TopProductDTO(" +
            "oi.product.id, " +
            "oi.product.name, " +
            "SUM(oi.quantity), " +
            "SUM(oi.price * oi.quantity), " +
            "oi.product.imageUrl) " +
            "FROM OrderItem oi " +
            "WHERE oi.order.createdAt >= :startDate " +
            "AND oi.order.orderStatus IN ('PAID', 'PREPARING', 'SHIPPED', 'DELIVERED') " +
            "GROUP BY oi.product.id, oi.product.name, oi.product.imageUrl " +
            "ORDER BY SUM(oi.quantity) DESC")
    List<TopProductDTO> findTopProducts(@Param("startDate") LocalDateTime startDate, Pageable pageable);
}