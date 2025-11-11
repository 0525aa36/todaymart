package com.agri.market.product;

import com.agri.market.cart.CartItemRepository;
import com.agri.market.category.Category;
import com.agri.market.category.CategoryRepository;
import com.agri.market.dto.ProductListDto;
import com.agri.market.dto.ProductOptionRequest;
import com.agri.market.dto.ProductRequest;
import com.agri.market.exception.BusinessException;
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
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository,
                          ProductOptionRepository productOptionRepository,
                          OrderItemRepository orderItemRepository,
                          CartItemRepository cartItemRepository,
                          WishlistRepository wishlistRepository,
                          ReviewRepository reviewRepository,
                          SellerRepository sellerRepository,
                          CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.wishlistRepository = wishlistRepository;
        this.reviewRepository = reviewRepository;
        this.sellerRepository = sellerRepository;
        this.categoryRepository = categoryRepository;
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

    @Transactional
    public Product createProduct(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setCategory(request.getCategory()); // 하위 호환성을 위해 유지
        product.setOrigin(request.getOrigin());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountRate(request.getDiscountRate());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        product.setImageUrls(request.getImageUrls());
        product.setDetailImageUrls(request.getDetailImageUrls());

        // 새로운 필드 설정
        product.setSupplyPrice(request.getSupplyPrice());
        product.setShippingFee(request.getShippingFee());
        product.setCanCombineShipping(request.getCanCombineShipping());
        product.setCombineShippingUnit(request.getCombineShippingUnit());
        product.setCourierCompany(request.getCourierCompany());
        product.setMinOrderQuantity(request.getMinOrderQuantity());
        product.setMaxOrderQuantity(request.getMaxOrderQuantity());
        product.setIsEventProduct(request.getIsEventProduct());
        // Category 엔티티 설정 (category code로 조회)
        if (request.getCategory() != null && !request.getCategory().isEmpty()) {
            categoryRepository.findByCode(request.getCategory())
                    .ifPresent(product::setCategoryEntity);
        }

        // Seller 설정
        if (request.getSellerId() != null) {
            Seller seller = sellerRepository.findById(request.getSellerId())
                    .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + request.getSellerId()));
            product.setSeller(seller);
        }

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found for this id :: " + id));

        product.setName(request.getName());
        product.setCategory(request.getCategory()); // 하위 호환성을 위해 유지
        product.setOrigin(request.getOrigin());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setDiscountRate(request.getDiscountRate());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        product.setImageUrls(request.getImageUrls());
        product.setDetailImageUrls(request.getDetailImageUrls());

        // 새로운 필드 설정
        product.setSupplyPrice(request.getSupplyPrice());
        product.setShippingFee(request.getShippingFee());
        product.setCanCombineShipping(request.getCanCombineShipping());
        product.setCombineShippingUnit(request.getCombineShippingUnit());
        product.setCourierCompany(request.getCourierCompany());
        product.setMinOrderQuantity(request.getMinOrderQuantity());
        product.setMaxOrderQuantity(request.getMaxOrderQuantity());
        product.setIsEventProduct(request.getIsEventProduct());

        // Category 엔티티 설정 (category code로 조회)
        if (request.getCategory() != null && !request.getCategory().isEmpty()) {
            System.out.println("[ProductService] Looking for category with code: " + request.getCategory());
            var categoryOpt = categoryRepository.findByCode(request.getCategory());
            if (categoryOpt.isPresent()) {
                System.out.println("[ProductService] Found category: " + categoryOpt.get().getName());
                product.setCategoryEntity(categoryOpt.get());
            } else {
                System.out.println("[ProductService] Category not found for code: " + request.getCategory());
            }
        } else {
            product.setCategoryEntity(null);
        }

        // Seller 설정 (null이면 판매자 제거 - 직매로 전환)
        if (request.getSellerId() != null) {
            Seller seller = sellerRepository.findById(request.getSellerId())
                    .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + request.getSellerId()));
            product.setSeller(seller);
        } else {
            product.setSeller(null);
        }

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException("상품을 찾을 수 없습니다. ID: " + id, "PRODUCT_NOT_FOUND"));

        // 주문 내역이 있는 상품은 삭제 불가 (데이터 무결성 및 감사 추적 유지)
        if (orderItemRepository.existsByProduct(product)) {
            throw new BusinessException(
                    "주문 이력이 있는 상품은 삭제할 수 없습니다. 대신 재고를 0으로 설정하여 판매를 중단할 수 있습니다.",
                    "PRODUCT_HAS_ORDER_HISTORY");
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

    // 카테고리 코드로 상품 조회 (새로운 Category 엔티티 사용)
    @Transactional(readOnly = true)
    public Page<ProductListDto> getProductsByCategoryCode(String categoryCode, Pageable pageable) {
        Page<Product> products = productRepository.findByCategoryCode(categoryCode, pageable);

        // 리뷰 통계 추가
        List<ProductListDto> productDtos = products.getContent().stream()
                .map(product -> {
                    Double avgRating = reviewRepository.findAverageRatingByProductId(product.getId());
                    Long reviewCount = reviewRepository.countByProductId(product.getId());
                    return new ProductListDto(product, avgRating, reviewCount);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(productDtos, pageable, products.getTotalElements());
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
     * 재고 부족 상품 개수 조회
     */
    public long countLowStockProducts(int threshold) {
        return productRepository.countByStockLessThan(threshold);
    }

    /**
     * 재고 부족 상품 목록 조회
     */
    public List<Product> getLowStockProducts(Integer threshold) {
        if (threshold == null) {
            threshold = 10; // 기본값
        }
        return productRepository.findByStockLessThan(threshold);
    }
}
