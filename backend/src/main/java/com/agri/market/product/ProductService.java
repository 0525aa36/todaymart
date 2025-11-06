package com.agri.market.product;

import com.agri.market.cart.CartItemRepository;
import com.agri.market.dto.ProductListDto;
import com.agri.market.dto.ProductOptionRequest;
import com.agri.market.dto.ProductRequest;
import com.agri.market.order.OrderItemRepository;
import com.agri.market.review.ReviewRepository;
import com.agri.market.seller.Seller;
import com.agri.market.seller.SellerRepository;
import com.agri.market.wishlist.WishlistRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final SellerRepository sellerRepository;

    public ProductService(ProductRepository productRepository,
                          ProductOptionRepository productOptionRepository,
                          OrderItemRepository orderItemRepository,
                          CartItemRepository cartItemRepository,
                          WishlistRepository wishlistRepository,
                          ReviewRepository reviewRepository,
                          SellerRepository sellerRepository) {
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.wishlistRepository = wishlistRepository;
        this.reviewRepository = reviewRepository;
        this.sellerRepository = sellerRepository;
    }

    public Page<Product> getAllProducts(Pageable pageable) {
        return productRepository.findAllWithImages(pageable);
    }

    // 리뷰 통계를 포함한 상품 목록 조회 (N+1 쿼리 최적화)
    @Transactional(readOnly = true)
    public Page<ProductListDto> getAllProductsWithReviewStats(Pageable pageable) {
        Page<Product> products = productRepository.findAllWithImages(pageable);

        // 모든 상품 ID 추출
        List<Long> productIds = products.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        // 배치로 평점과 리뷰 수를 한 번에 조회 (N+1 쿼리 해결!)
        Map<Long, Double> ratingMap = new HashMap<>();
        Map<Long, Long> countMap = new HashMap<>();

        if (!productIds.isEmpty()) {
            // 평균 평점 배치 조회
            List<Map<String, Object>> ratings = reviewRepository.findAverageRatingsByProductIds(productIds);
            ratings.forEach(row -> {
                Long productId = ((Number) row.get("productId")).longValue();
                Double avgRating = row.get("avgRating") != null ? ((Number) row.get("avgRating")).doubleValue() : null;
                ratingMap.put(productId, avgRating);
            });

            // 리뷰 개수 배치 조회
            List<Map<String, Object>> counts = reviewRepository.countReviewsByProductIds(productIds);
            counts.forEach(row -> {
                Long productId = ((Number) row.get("productId")).longValue();
                Long reviewCount = ((Number) row.get("reviewCount")).longValue();
                countMap.put(productId, reviewCount);
            });
        }

        // DTO 생성 (이제 Map에서 조회하므로 추가 쿼리 없음)
        List<ProductListDto> productDtos = products.getContent().stream()
                .map(product -> {
                    // 옵션을 미리 로드
                    product.getOptions().size();
                    Double avgRating = ratingMap.get(product.getId());
                    Long reviewCount = countMap.getOrDefault(product.getId(), 0L);
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

    public Product createProduct(ProductRequest request) {
        System.out.println("=== Creating Product ===");
        System.out.println("Request sellerId: " + request.getSellerId());

        Product product = new Product();
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setOrigin(request.getOrigin());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountRate(request.getDiscountRate());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());

        // Seller 설정
        if (request.getSellerId() != null) {
            System.out.println("Finding seller with ID: " + request.getSellerId());
            Seller seller = sellerRepository.findById(request.getSellerId())
                    .orElseThrow(() -> new RuntimeException("Seller not found for this id :: " + request.getSellerId()));
            product.setSeller(seller);
            System.out.println("Seller set: " + seller.getName());
        } else {
            System.out.println("No sellerId provided - creating product without seller");
        }

        Product saved = productRepository.save(product);
        System.out.println("Product saved with ID: " + saved.getId() + ", Seller: " + (saved.getSeller() != null ? saved.getSeller().getName() : "null"));
        return saved;
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found for this id :: " + id));

        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setOrigin(request.getOrigin());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountRate(request.getDiscountRate());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());

        // Seller 설정
        if (request.getSellerId() != null) {
            Seller seller = sellerRepository.findById(request.getSellerId())
                    .orElseThrow(() -> new RuntimeException("Seller not found for this id :: " + request.getSellerId()));
            product.setSeller(seller);
        } else {
            product.setSeller(null);
        }

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

    /**
     * 재고 부족 상품 조회
     * @param threshold 재고 기준값
     * @return 재고가 threshold 이하인 상품 목록
     */
    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts(Integer threshold) {
        return productRepository.findLowStockProducts(threshold);
    }

    /**
     * 재고 부족 상품 수 조회
     * @param threshold 재고 기준값
     * @return 재고가 threshold 이하인 상품 수
     */
    @Transactional(readOnly = true)
    public long countLowStockProducts(Integer threshold) {
        return productRepository.countLowStockProducts(threshold);
    }
}