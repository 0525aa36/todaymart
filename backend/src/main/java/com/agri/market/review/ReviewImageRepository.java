package com.agri.market.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {
    List<ReviewImage> findByReviewIdOrderByDisplayOrderAsc(Long reviewId);
    void deleteByReviewId(Long reviewId);
}
