package com.agri.market.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByCode(String code);

    List<Category> findByParentIsNullOrderByDisplayOrderAsc();

    List<Category> findByIsVisibleTrueAndParentIsNullOrderByDisplayOrderAsc();

    List<Category> findByIsVisibleTrueOrderByDisplayOrderAsc();

    List<Category> findByIsEventTrue();

    boolean existsByCode(String code);

    @Query("SELECT c FROM Category c LEFT JOIN FETCH c.children WHERE c.parent IS NULL ORDER BY c.displayOrder")
    List<Category> findAllRootCategoriesWithChildren();
}