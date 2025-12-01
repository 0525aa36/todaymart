package com.agri.market.dto;

import com.agri.market.review.Review;
import com.agri.market.review.ReviewImage;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class ReviewResponse {
    private Long id;
    private Long productId;
    private String productName;
    private Long userId;
    private String userName;
    private Integer rating;
    private String title;
    private String content;
    private List<ReviewImageResponse> images = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    public static class ReviewImageResponse {
        private Long id;
        private String imageUrl;
        private Integer displayOrder;

        public static ReviewImageResponse from(ReviewImage image) {
            ReviewImageResponse response = new ReviewImageResponse();
            response.setId(image.getId());
            response.setImageUrl(image.getImageUrl());
            response.setDisplayOrder(image.getDisplayOrder());
            return response;
        }
    }

    public static ReviewResponse from(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setProductId(review.getProduct().getId());
        response.setProductName(review.getProduct().getName());
        response.setUserId(review.getUser().getId());
        response.setUserName(review.getUser().getName());
        response.setRating(review.getRating());
        response.setTitle(review.getTitle());
        response.setContent(review.getContent());
        response.setCreatedAt(review.getCreatedAt());
        response.setUpdatedAt(review.getUpdatedAt());

        // 이미지 목록 변환
        if (review.getImages() != null && !review.getImages().isEmpty()) {
            response.setImages(
                review.getImages().stream()
                    .map(ReviewImageResponse::from)
                    .collect(Collectors.toList())
            );
        }

        return response;
    }
}
