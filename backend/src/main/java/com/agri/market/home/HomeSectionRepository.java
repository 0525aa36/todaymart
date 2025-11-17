package com.agri.market.home;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomeSectionRepository extends JpaRepository<HomeSection, Long> {

    /**
     * Find all sections ordered by display order
     */
    List<HomeSection> findAllByOrderByDisplayOrderAsc();

    /**
     * Find all active sections ordered by display order
     */
    List<HomeSection> findByIsActiveTrueOrderByDisplayOrderAsc();

    /**
     * Find sections by type
     */
    List<HomeSection> findBySectionTypeOrderByDisplayOrderAsc(HomeSection.SectionType sectionType);

    /**
     * Find the maximum display order
     */
    @Query("SELECT COALESCE(MAX(h.displayOrder), -1) FROM HomeSection h")
    Integer findMaxDisplayOrder();

    /**
     * Count active sections
     */
    long countByIsActiveTrue();
}
