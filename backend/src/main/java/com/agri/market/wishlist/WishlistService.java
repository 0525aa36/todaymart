package com.agri.market.wishlist;

import com.agri.market.dto.WishlistItemDto;
import com.agri.market.product.Product;
import com.agri.market.product.ProductRepository;
import com.agri.market.review.ReviewRepository;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {
    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    public WishlistService(WishlistRepository wishlistRepository, UserRepository userRepository,
                          ProductRepository productRepository, ReviewRepository reviewRepository) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    public List<WishlistItemDto> getWishlistByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<WishlistItem> wishlistItems = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        return wishlistItems.stream()
                .map(item -> {
                    Product product = item.getProduct();
                    // 옵션을 미리 로드
                    product.getOptions().size();

                    Double avgRating = reviewRepository.findAverageRatingByProductId(product.getId());
                    Long reviewCount = reviewRepository.countByProductId(product.getId());

                    return new WishlistItemDto(item, avgRating, reviewCount);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public WishlistItem addToWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Check if already exists
        if (wishlistRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new RuntimeException("Product already in wishlist");
        }

        WishlistItem wishlistItem = new WishlistItem();
        wishlistItem.setUser(user);
        wishlistItem.setProduct(product);

        return wishlistRepository.save(wishlistItem);
    }

    @Transactional
    public void removeFromWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        wishlistRepository.deleteByUserIdAndProductId(user.getId(), productId);
    }

    public boolean isInWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return wishlistRepository.existsByUserIdAndProductId(user.getId(), productId);
    }
}
