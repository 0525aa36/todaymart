package com.agri.market.cart;

import com.agri.market.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(User user);

    // Lazy loading 문제 해결: user, cartItems, product, productOption을 fetch join으로 미리 로드
    // Note: product.images는 여러 List를 동시에 fetch join할 수 없어 제외 (MultipleBagFetchException 방지)
    @Query("SELECT DISTINCT c FROM Cart c " +
           "LEFT JOIN FETCH c.user " +
           "LEFT JOIN FETCH c.cartItems ci " +
           "LEFT JOIN FETCH ci.product p " +
           "LEFT JOIN FETCH ci.productOption " +
           "WHERE c.user = :user")
    Optional<Cart> findByUserWithItems(@Param("user") User user);
}