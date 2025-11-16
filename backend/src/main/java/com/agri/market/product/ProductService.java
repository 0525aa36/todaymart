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
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

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
            logger.debug("Looking for category with code: {}", request.getCategory());
            var categoryOpt = categoryRepository.findByCode(request.getCategory());
            if (categoryOpt.isPresent()) {
                logger.debug("Found category: {}", categoryOpt.get().getName());
                product.setCategoryEntity(categoryOpt.get());
            } else {
                logger.warn("Category not found for code: {}", request.getCategory());
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

    // 리뷰 통계를 포함한 검색 기능 (N+1 쿼리 최적화)
    @RateLimiter(name = "search")
    @Transactional(readOnly = true)
    public Page<ProductListDto> searchProductsWithReviewStats(String keyword, String category, String origin, Pageable pageable) {
        Page<Product> products = productRepository.searchProducts(keyword, category, origin, pageable);

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

    // 카테고리로 검색
    public Page<Product> getProductsByCategory(String category, Pageable pageable) {
        return productRepository.findByCategory(category, pageable);
    }

    // 카테고리 코드로 상품 조회 (새로운 Category 엔티티 사용, N+1 쿼리 최적화)
    @Transactional(readOnly = true)
    public Page<ProductListDto> getProductsByCategoryCode(String categoryCode, Pageable pageable) {
        Page<Product> products = productRepository.findByCategoryCode(categoryCode, pageable);

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
                    Double avgRating = ratingMap.get(product.getId());
                    Long reviewCount = countMap.getOrDefault(product.getId(), 0L);
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

    // ==================== 재고 관리 시스템 메서드 ====================

    /**
     * 재고 통계 조회
     */
    @Transactional(readOnly = true)
    public com.agri.market.dto.admin.InventoryStatisticsResponse getInventoryStatistics() {
        List<Product> allProducts = productRepository.findAll();
        List<ProductOption> allOptions = productOptionRepository.findAll();

        // Product 통계
        long totalProducts = allProducts.size();
        long soldOutProducts = allProducts.stream().filter(p -> p.getStock() == 0).count();
        long lowStockProducts = allProducts.stream()
                .filter(p -> p.getStock() > 0 && p.getStock() <= p.getLowStockThreshold()).count();
        long inStockProducts = allProducts.stream()
                .filter(p -> p.getStock() > p.getLowStockThreshold()).count();
        java.math.BigDecimal totalProductStockValue = allProducts.stream()
                .map(p -> p.getPrice().multiply(java.math.BigDecimal.valueOf(p.getStock())))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // ProductOption 통계
        long totalOptions = allOptions.size();
        long soldOutOptions = allOptions.stream().filter(o -> o.getStock() == 0).count();
        long lowStockOptions = allOptions.stream()
                .filter(o -> o.getStock() > 0 && o.getStock() <= o.getProduct().getLowStockThreshold()).count();
        long inStockOptions = allOptions.stream()
                .filter(o -> o.getStock() > o.getProduct().getLowStockThreshold()).count();
        java.math.BigDecimal totalOptionStockValue = allOptions.stream()
                .map(o -> o.getProduct().getPrice().add(o.getAdditionalPrice())
                        .multiply(java.math.BigDecimal.valueOf(o.getStock())))
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Combined statistics
        com.agri.market.dto.admin.InventoryStatisticsResponse response =
                new com.agri.market.dto.admin.InventoryStatisticsResponse();
        response.setTotalProducts(totalProducts);
        response.setSoldOutProducts(soldOutProducts);
        response.setLowStockProducts(lowStockProducts);
        response.setInStockProducts(inStockProducts);
        response.setTotalProductStockValue(totalProductStockValue);

        response.setTotalOptions(totalOptions);
        response.setSoldOutOptions(soldOutOptions);
        response.setLowStockOptions(lowStockOptions);
        response.setInStockOptions(inStockOptions);
        response.setTotalOptionStockValue(totalOptionStockValue);

        response.setTotalItems(totalProducts + totalOptions);
        response.setTotalSoldOut(soldOutProducts + soldOutOptions);
        response.setTotalLowStock(lowStockProducts + lowStockOptions);
        response.setTotalInStock(inStockProducts + inStockOptions);
        response.setTotalStockValue(totalProductStockValue.add(totalOptionStockValue));

        return response;
    }

    /**
     * 재고 목록 조회 (필터링, 페이징)
     */
    @Transactional(readOnly = true)
    public Page<com.agri.market.dto.admin.InventoryItemResponse> getInventoryItems(
            com.agri.market.dto.StockStatus stockStatus, String keyword, Pageable pageable) {

        List<Product> allProducts = productRepository.findAll();

        // Product를 ID 순으로 정렬
        allProducts.sort(java.util.Comparator.comparing(Product::getId));

        // Convert to InventoryItemResponse
        List<com.agri.market.dto.admin.InventoryItemResponse> allItems = new java.util.ArrayList<>();

        // 각 상품과 그 옵션들을 그룹화하여 추가
        for (Product product : allProducts) {
            com.agri.market.dto.admin.InventoryItemResponse productItem =
                    com.agri.market.dto.admin.InventoryItemResponse.fromProduct(product);

            // Apply filters to product
            boolean productPassesFilter = true;
            if (stockStatus != null && productItem.getStockStatus() != stockStatus) {
                productPassesFilter = false;
            }
            if (keyword != null && !keyword.trim().isEmpty() &&
                    !productItem.getName().toLowerCase().contains(keyword.toLowerCase())) {
                productPassesFilter = false;
            }

            if (productPassesFilter) {
                allItems.add(productItem);
            }

            // 해당 상품의 옵션들을 바로 추가
            if (product.getOptions() != null && !product.getOptions().isEmpty()) {
                // 옵션을 ID 순으로 정렬
                List<ProductOption> sortedOptions = new java.util.ArrayList<>(product.getOptions());
                sortedOptions.sort(java.util.Comparator.comparing(ProductOption::getId));

                for (ProductOption option : sortedOptions) {
                    com.agri.market.dto.admin.InventoryItemResponse optionItem =
                            com.agri.market.dto.admin.InventoryItemResponse.fromProductOption(option);

                    // Apply filters to option
                    boolean optionPassesFilter = true;
                    if (stockStatus != null && optionItem.getStockStatus() != stockStatus) {
                        optionPassesFilter = false;
                    }
                    if (keyword != null && !keyword.trim().isEmpty() &&
                            !optionItem.getName().toLowerCase().contains(keyword.toLowerCase())) {
                        optionPassesFilter = false;
                    }

                    if (optionPassesFilter) {
                        allItems.add(optionItem);
                    }
                }
            }
        }

        // Apply pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), allItems.size());
        List<com.agri.market.dto.admin.InventoryItemResponse> pageContent =
                start < allItems.size() ? allItems.subList(start, end) : new java.util.ArrayList<>();

        return new PageImpl<>(pageContent, pageable, allItems.size());
    }

    /**
     * Product 재고 수정
     */
    @Transactional
    public void updateProductStock(Long productId, Integer newStock) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (newStock < 0) {
            throw new BusinessException("재고는 0 이상이어야 합니다.", "INVALID_STOCK");
        }

        product.setStock(newStock);
        productRepository.save(product);

        logger.info("Product stock updated - ID: {}, Old: {}, New: {}",
                productId, product.getStock(), newStock);
    }

    /**
     * ProductOption 재고 수정
     */
    @Transactional
    public void updateProductOptionStock(Long optionId, Integer newStock) {
        ProductOption option = productOptionRepository.findById(optionId)
                .orElseThrow(() -> new RuntimeException("ProductOption not found with id: " + optionId));

        if (newStock < 0) {
            throw new BusinessException("재고는 0 이상이어야 합니다.", "INVALID_STOCK");
        }

        option.setStock(newStock);
        productOptionRepository.save(option);

        logger.info("ProductOption stock updated - ID: {}, Old: {}, New: {}",
                optionId, option.getStock(), newStock);
    }

    /**
     * 재고 임계값 수정
     */
    @Transactional
    public void updateLowStockThreshold(Long productId, Integer newThreshold) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (newThreshold < 0) {
            throw new BusinessException("임계값은 0 이상이어야 합니다.", "INVALID_THRESHOLD");
        }

        product.setLowStockThreshold(newThreshold);
        productRepository.save(product);

        logger.info("Product low stock threshold updated - ID: {}, Old: {}, New: {}",
                productId, product.getLowStockThreshold(), newThreshold);
    }

    /**
     * 재고 일괄 수정
     */
    @Transactional
    public void bulkUpdateStock(com.agri.market.dto.admin.BulkStockUpdateRequest request) {
        for (com.agri.market.dto.admin.StockUpdateItem item : request.getItems()) {
            if ("PRODUCT".equals(item.getType())) {
                updateProductStock(item.getId(), item.getNewStock());
            } else if ("OPTION".equals(item.getType())) {
                updateProductOptionStock(item.getId(), item.getNewStock());
            }
        }

        logger.info("Bulk stock update completed - {} items updated", request.getItems().size());
    }
}
