package com.agri.market.faq;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {
    List<Faq> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();
    List<Faq> findByCategoryAndIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc(FaqCategory category);
    List<Faq> findAllByOrderByDisplayOrderAscCreatedAtDesc();
}
