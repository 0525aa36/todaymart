package com.agri.market.product;

import com.agri.market.cart.CartItemRepository;
import com.agri.market.dto.ProductListDto;
import com.agri.market.dto.ProductOptionRequest;
import com.agri.market.order.OrderItemRepository;
import com.agri.market.review.ReviewRepository;
import com.agri.market.wishlist.WishlistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistRepository wishlistRepository;
    private final ReviewRepository reviewRepository;

    public ProductService(ProductRepository productRepository,
                          ProductOptionRepository productOptionRepository,
                          OrderItemRepository orderItemRepository,
                          CartItemRepository cartItemRepository,
                          WishlistRepository wishlistRepository,
                          ReviewRepository reviewRepository) {
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.wishlistRepository = wishlistRepository;
        this.reviewRepository = reviewRepository;
    }

    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAllWithImages(pageable);
    }

    // 리뷰 통계를 포함한 상품 목록 조회
    @Transactional(readOnly = true)
    public Page<ProductListDto> getAllProductsWithReviewStats(Pageable pageable) {
        Page<Product> products = productRepository.findAllWithImages(pageable);

        List<ProductListDto> productDtos = products.getContent().stream()
                .map(product -> {
                    // 옵션을 미리 로드
                    product.getOptions().size();
                    Double avgRating = reviewRepository.findAverageRatingByProductId(product.getId());
                    Long reviewCount = reviewRepository.countByProductId(product.getId());
                    return new ProductListDto(product, avgRating, reviewCount);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(productDtos, pageable, products.getTotalElements());
    }

    @Transactional
    public Optional<Product> getProductById(Long id) {
        Optional<Product> productOpt = productRepository.findByIdWithImagesAndOptions(id);
        // options를 미리 로드 (LazyInitializationException 방지)
        productOpt.ifPresent(product -> product.getOptions().size());
        return productOpt;
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found for this id :: " + id));

        product.setName(productDetails.getName());
        product.setCategory(productDetails.getCategory());
        product.setOrigin(productDetails.getOrigin());
        product.setDescription(productDetails.getDescription());
        product.setPrice(productDetails.getPrice());
        product.setStock(productDetails.getStock());
        product.setImageUrl(productDetails.getImageUrl());

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found for this id :: " + id));

        // 주문 내역이 있는 상품은 삭제 불가 (데이터 무결성 및 감사 추적 유지)
        if (orderItemRepository.existsByProduct(product)) {
            throw new RuntimeException("Cannot delete product that has been ordered. " +
                    "Product ID: " + id + " has existing order history. " +
                    "Consider marking it as out of stock instead.");
        }

        // 주문되지 않은 상품의 경우, 연관된 데이터를 먼저 삭제
        // 1. 장바구니 아이템 삭제
        cartItemRepository.deleteByProduct(product);

        // 2. 위시리스트 아이템 삭제
        wishlistRepository.deleteByProduct(product);

        // 3. 리뷰 삭제
        reviewRepository.deleteByProduct(product);

        // 4. 상품 삭제 (ProductImage와 ProductOption은 cascade로 자동 삭제됨)
        productRepository.delete(product);
    }

    // 검색 기능
    public Page<Product> searchProducts(String keyword, String category, String origin, Pageable pageable) {
        return productRepository.searchProducts(keyword, category, origin, pageable);
    }

    // 리뷰 통계를 포함한 검색 기능
    @Transactional(readOnly = true)
    public Page<ProductListDto> searchProductsWithReviewStats(String keyword, String category, String origin, Pageable pageable) {
        Page<Product> products = productRepository.searchProducts(keyword, category, origin, pageable);

        List<ProductListDto> productDtos = products.getContent().stream()
                .map(product -> {
                    // 옵션을 미리 로드
                    product.getOptions().size();
                    Double avgRating = reviewRepository.findAverageRatingByProductId(product.getId());
                    Long reviewCount = reviewRepository.countByProductId(product.getId());
                    return new ProductListDto(product, avgRating, reviewCount);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(productDtos, pageable, products.getTotalElements());
    }

    // 카테고리로 검색
    public Page<Product> getProductsByCategory(String category, Pageable pageable) {
        return productRepository.findByCategory(category, pageable);
    }

    // 상품명으로 검색
    public Page<Product> searchProductsByName(String name, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCase(name, pageable);
    }

    // 원산지로 검색
    public Page<Product> searchProductsByOrigin(String origin, Pageable pageable) {
        return productRepository.findByOriginContainingIgnoreCase(origin, pageable);
    }

    // ========== 상품 옵션 관리 ==========

    @Transactional
    public ProductOption addProductOption(Long productId, ProductOptionRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

        ProductOption option = new ProductOption();
        option.setOptionName(request.getOptionName());
        option.setOptionValue(request.getOptionValue());
        option.setAdditionalPrice(request.getAdditionalPrice());
        option.setStock(request.getStock());
        option.setIsAvailable(request.getIsAvailable());

        product.addOption(option);
        productRepository.save(product);

        return option;
    }

    @Transactional
    public ProductOption updateProductOption(Long optionId, ProductOptionRequest request) {
        ProductOption option = productOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("Product option not found: " + optionId));

        option.setOptionName(request.getOptionName());
        option.setOptionValue(request.getOptionValue());
        option.setAdditionalPrice(request.getAdditionalPrice());
        option.setStock(request.getStock());
        option.setIsAvailable(request.getIsAvailable());

        return productOptionRepository.save(option);
    }

    @Transactional
    public void deleteProductOption(Long optionId) {
        ProductOption option = productOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("Product option not found: " + optionId));
        productOptionRepository.delete(option);
    }

    public List<ProductOption> getProductOptions(Long productId) {
        return productOptionRepository.findByProductId(productId);
    }
}