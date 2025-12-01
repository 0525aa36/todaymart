package com.agri.market.review;

import com.agri.market.dto.ReviewRequest;
import com.agri.market.dto.ReviewResponse;
import com.agri.market.exception.UnauthorizedException;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private static final Logger logger = LoggerFactory.getLogger(ReviewController.class);

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // 리뷰 생성 (인증 필요) - 이미지 포함 multipart 방식
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReviewResponse> createReview(
            @RequestParam("productId") Long productId,
            @RequestParam("rating") Integer rating,
            @RequestParam("title") String title,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            Authentication authentication) {

        logger.info("Creating review with multipart - productId: {}, rating: {}, title: {}, images count: {}",
            productId, rating, title, images != null ? images.size() : 0);

        if (authentication == null || authentication.getPrincipal() == null) {
            logger.error("Authentication is null for review creation");
            throw new UnauthorizedException("인증이 필요합니다.");
        }

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();
        logger.info("Creating review for user: {}", userEmail);

        try {
            Review review = reviewService.createReview(
                productId,
                userEmail,
                rating,
                title,
                content,
                images
            );
            logger.info("Review created successfully with id: {}", review.getId());
            return ResponseEntity.ok(ReviewResponse.from(review));
        } catch (Exception e) {
            logger.error("Error creating review: {}", e.getMessage(), e);
            throw e;
        }
    }

    // 리뷰 생성 (인증 필요) - 이미지 없이 JSON 방식 (기존 호환성 유지)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ReviewResponse> createReviewJson(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        Review review = reviewService.createReview(
            request.getProductId(),
            userEmail,
            request.getRating(),
            request.getTitle(),
            request.getContent()
        );

        return ResponseEntity.ok(ReviewResponse.from(review));
    }

    // 상품별 리뷰 조회 (공개)
    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<ReviewResponse>> getProductReviews(
            @PathVariable Long productId,
            Pageable pageable) {
        Page<Review> reviews = reviewService.getReviewsByProductId(productId, pageable);
        Page<ReviewResponse> response = reviews.map(ReviewResponse::from);
        return ResponseEntity.ok(response);
    }

    // 상품 평균 평점 및 리뷰 개수 조회 (공개)
    @GetMapping("/product/{productId}/stats")
    public ResponseEntity<Map<String, Object>> getProductReviewStats(@PathVariable Long productId) {
        Double avgRating = reviewService.getAverageRating(productId);
        Long reviewCount = reviewService.getReviewCount(productId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", avgRating);
        stats.put("reviewCount", reviewCount);

        return ResponseEntity.ok(stats);
    }

    // 사용자별 리뷰 조회 (인증 필요)
    @GetMapping("/my-reviews")
    public ResponseEntity<Page<ReviewResponse>> getMyReviews(
            Authentication authentication,
            Pageable pageable) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        Page<Review> reviews = reviewService.getReviewsByUserEmail(userEmail, pageable);
        Page<ReviewResponse> response = reviews.map(ReviewResponse::from);
        return ResponseEntity.ok(response);
    }

    // 리뷰 수정 (인증 필요, 본인 확인)
    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        Review review = reviewService.updateReview(
            id,
            userEmail,
            request.getRating(),
            request.getTitle(),
            request.getContent()
        );

        return ResponseEntity.ok(ReviewResponse.from(review));
    }

    // 리뷰 삭제 (인증 필요, 본인 확인)
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteReview(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String userEmail = userDetails.getUsername();

        reviewService.deleteReview(id, userEmail);
        return ResponseEntity.ok("리뷰가 삭제되었습니다.");
    }
}
