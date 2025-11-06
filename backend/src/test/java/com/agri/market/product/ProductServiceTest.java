package com.agri.market.product;

import com.agri.market.cart.CartItemRepository;
import com.agri.market.dto.ProductListDto;
import com.agri.market.order.OrderItemRepository;
import com.agri.market.review.ReviewRepository;
import com.agri.market.wishlist.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService 단위 테스트")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductOptionRepository productOptionRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private List<Product> testProducts;

    @BeforeEach
    void setUp() {
        // 테스트용 상품 데이터 생성
        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("테스트 상품");
        testProduct.setPrice(new BigDecimal("10000"));
        testProduct.setStock(100);
        testProduct.setOptions(new ArrayList<>());

        Product product2 = new Product();
        product2.setId(2L);
        product2.setName("테스트 상품2");
        product2.setPrice(new BigDecimal("20000"));
        product2.setStock(50);
        product2.setOptions(new ArrayList<>());

        testProducts = Arrays.asList(testProduct, product2);
    }

    @Test
    @DisplayName("상품 목록 조회 - 성공")
    void getAllProducts_Success() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(testProducts, pageable, testProducts.size());
        when(productRepository.findAllWithImages(pageable)).thenReturn(productPage);

        // When
        Page<Product> result = productService.getAllProducts(pageable);

        // Then
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        verify(productRepository, times(1)).findAllWithImages(pageable);
    }

    @Test
    @DisplayName("리뷰 통계 포함 상품 목록 조회 - N+1 쿼리 최적화 검증")
    void getAllProductsWithReviewStats_OptimizedQuery() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(testProducts, pageable, testProducts.size());
        when(productRepository.findAllWithImages(pageable)).thenReturn(productPage);

        // 배치 조회 Mock 데이터
        Map<String, Object> ratingMap1 = new HashMap<>();
        ratingMap1.put("productId", 1L);
        ratingMap1.put("avgRating", 4.5);

        Map<String, Object> ratingMap2 = new HashMap<>();
        ratingMap2.put("productId", 2L);
        ratingMap2.put("avgRating", 3.8);

        Map<String, Object> countMap1 = new HashMap<>();
        countMap1.put("productId", 1L);
        countMap1.put("reviewCount", 10L);

        Map<String, Object> countMap2 = new HashMap<>();
        countMap2.put("productId", 2L);
        countMap2.put("reviewCount", 5L);

        when(reviewRepository.findAverageRatingsByProductIds(anyList()))
                .thenReturn(Arrays.asList(ratingMap1, ratingMap2));
        when(reviewRepository.countReviewsByProductIds(anyList()))
                .thenReturn(Arrays.asList(countMap1, countMap2));

        // When
        Page<ProductListDto> result = productService.getAllProductsWithReviewStats(pageable);

        // Then
        assertNotNull(result);
        assertEquals(2, result.getContent().size());

        // N+1 쿼리가 아닌 배치 조회 검증
        verify(reviewRepository, times(1)).findAverageRatingsByProductIds(anyList());
        verify(reviewRepository, times(1)).countReviewsByProductIds(anyList());
        // 개별 상품당 쿼리는 호출되지 않아야 함
        verify(reviewRepository, never()).findAverageRatingByProductId(anyLong());
        verify(reviewRepository, never()).countByProductId(anyLong());

        // 리뷰 통계 데이터 검증
        ProductListDto dto1 = result.getContent().get(0);
        assertEquals(4.5, dto1.getAverageRating());
        assertEquals(10L, dto1.getReviewCount());
    }

    @Test
    @DisplayName("상품 ID로 조회 - 성공")
    void getProductById_Success() {
        // Given
        when(productRepository.findByIdWithImagesAndOptions(1L))
                .thenReturn(Optional.of(testProduct));

        // When
        Optional<Product> result = productService.getProductById(1L);

        // Then
        assertTrue(result.isPresent());
        assertEquals("테스트 상품", result.get().getName());
        verify(productRepository, times(1)).findByIdWithImagesAndOptions(1L);
    }

    @Test
    @DisplayName("상품 ID로 조회 - 존재하지 않는 상품")
    void getProductById_NotFound() {
        // Given
        when(productRepository.findByIdWithImagesAndOptions(999L))
                .thenReturn(Optional.empty());

        // When
        Optional<Product> result = productService.getProductById(999L);

        // Then
        assertFalse(result.isPresent());
        verify(productRepository, times(1)).findByIdWithImagesAndOptions(999L);
    }

    @Test
    @DisplayName("상품 생성 - 성공")
    void createProduct_Success() {
        // Given
        Product newProduct = new Product();
        newProduct.setName("새 상품");
        newProduct.setPrice(new BigDecimal("15000"));

        when(productRepository.save(newProduct)).thenReturn(newProduct);

        // When
        Product result = productService.createProduct(newProduct);

        // Then
        assertNotNull(result);
        assertEquals("새 상품", result.getName());
        verify(productRepository, times(1)).save(newProduct);
    }

    @Test
    @DisplayName("리뷰 없는 상품 조회 - 기본값 반환")
    void getAllProductsWithReviewStats_NoReviews() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(testProducts, pageable, testProducts.size());
        when(productRepository.findAllWithImages(pageable)).thenReturn(productPage);

        // 리뷰가 없는 경우 빈 리스트 반환
        when(reviewRepository.findAverageRatingsByProductIds(anyList()))
                .thenReturn(Collections.emptyList());
        when(reviewRepository.countReviewsByProductIds(anyList()))
                .thenReturn(Collections.emptyList());

        // When
        Page<ProductListDto> result = productService.getAllProductsWithReviewStats(pageable);

        // Then
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        // 리뷰가 없으면 평점은 0.0, 리뷰 수는 0
        ProductListDto dto = result.getContent().get(0);
        assertEquals(0.0, dto.getAverageRating());
        assertEquals(0L, dto.getReviewCount());
    }
}
