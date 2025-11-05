package com.agri.market.review;

import com.agri.market.exception.ForbiddenException;
import com.agri.market.product.Product;
import com.agri.market.product.ProductRepository;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    // 리뷰 생성
    @Transactional
    public Review createReview(Long productId, String userEmail, Integer rating, String title, String content) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setRating(rating);
        review.setTitle(title);
        review.setContent(content);

        return reviewRepository.save(review);
    }

    // 상품별 리뷰 조회
    public Page<Review> getReviewsByProductId(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable);
    }

    // 사용자별 리뷰 조회
    public Page<Review> getReviewsByUserId(Long userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable);
    }

    // 이메일로 사용자 리뷰 조회
    public Page<Review> getReviewsByUserEmail(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));
        return reviewRepository.findByUserId(user.getId(), pageable);
    }

    // 리뷰 상세 조회
    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    // 리뷰 수정
    @Transactional
    public Review updateReview(Long id, String userEmail, Integer rating, String title, String content) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));

        // 권한 검증: 본인만 수정 가능
        if (!review.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("You are not authorized to update this review");
        }

        if (rating != null) {
            review.setRating(rating);
        }
        if (title != null) {
            review.setTitle(title);
        }
        if (content != null) {
            review.setContent(content);
        }

        return reviewRepository.save(review);
    }

    // 리뷰 삭제
    @Transactional
    public void deleteReview(Long id, String userEmail) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));

        // 권한 검증: 본인만 삭제 가능
        if (!review.getUser().getEmail().equals(userEmail)) {
            throw new ForbiddenException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }

    // 상품 평균 평점 조회
    public Double getAverageRating(Long productId) {
        Double avgRating = reviewRepository.findAverageRatingByProductId(productId);
        return avgRating != null ? avgRating : 0.0;
    }

    // 상품 리뷰 개수 조회
    public Long getReviewCount(Long productId) {
        return reviewRepository.countByProductId(productId);
    }
}
