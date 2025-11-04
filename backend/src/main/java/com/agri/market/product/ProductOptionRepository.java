package com.agri.market.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {
    List<ProductOption> findByProductId(Long productId);

    List<ProductOption> findByProductIdAndIsAvailable(Long productId, Boolean isAvailable);

    void deleteByProductId(Long productId);
}
