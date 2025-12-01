package com.agri.market.cart;

import com.agri.market.product.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
    void deleteByProduct(Product product);

    // Lazy Loading 오류 방지를 위한 fetch join 쿼리
    @Query("SELECT ci FROM CartItem ci " +
           "JOIN FETCH ci.cart c " +
           "JOIN FETCH c.user " +
           "LEFT JOIN FETCH ci.product p " +
           "LEFT JOIN FETCH p.seller " +
           "LEFT JOIN FETCH p.productNotice " +
           "LEFT JOIN FETCH ci.productOption po " +
           "WHERE ci.id = :id")
    Optional<CartItem> findByIdWithProductAndOption(@Param("id") Long id);
}