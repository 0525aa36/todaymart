package com.agri.market.notice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByOrderByIsPinnedDescCreatedAtDesc();
    List<Notice> findByIsPopupTrueOrderByCreatedAtDesc();
}
