package com.agri.market.cart;

import com.agri.market.dto.AddToCartRequest;
import com.agri.market.product.Product;
import com.agri.market.product.ProductOption;
import com.agri.market.product.ProductOptionRepository;
import com.agri.market.product.ProductRepository;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       UserRepository userRepository, ProductRepository productRepository,
                       ProductOptionRepository productOptionRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productOptionRepository = productOptionRepository;
    }

    @Transactional
    public Cart addItemToCart(String userEmail, AddToCartRequest request) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Product product = productRepository.findByIdWithImagesAndOptions(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

        // 수량 검증
        if (request.getQuantity() < product.getMinOrderQuantity()) {
            throw new IllegalArgumentException("최소 주문 수량은 " + product.getMinOrderQuantity() + "개입니다");
        }
        if (product.getMaxOrderQuantity() != null && request.getQuantity() > product.getMaxOrderQuantity()) {
            throw new IllegalArgumentException("최대 주문 수량은 " + product.getMaxOrderQuantity() + "개입니다");
        }

        // 옵션 처리
        ProductOption productOption = null;
        if (request.getProductOptionId() != null) {
            productOption = productOptionRepository.findById(request.getProductOptionId())
                    .orElseThrow(() -> new RuntimeException("Product option not found with id: " + request.getProductOptionId()));

            // 옵션이 해당 상품에 속하는지 검증
            if (!productOption.getProduct().getId().equals(product.getId())) {
                throw new RuntimeException("Product option does not belong to this product");
            }

            // 옵션 재고 확인
            if (productOption.getStock() < request.getQuantity()) {
                throw new RuntimeException("Not enough stock for option: " + productOption.getName());
            }
        }

        Cart cart = cartRepository.findByUserWithItems(user)
                .orElseGet(() -> {
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });

        // 같은 상품 + 같은 옵션의 조합을 가진 기존 장바구니 아이템 찾기
        final ProductOption finalProductOption = productOption;
        Optional<CartItem> existingCartItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .filter(item -> {
                    if (finalProductOption == null && item.getProductOption() == null) {
                        return true;
                    }
                    if (finalProductOption != null && item.getProductOption() != null) {
                        return item.getProductOption().getId().equals(finalProductOption.getId());
                    }
                    return false;
                })
                .findFirst();

        if (existingCartItem.isPresent()) {
            // 기존 아이템 수량 증가
            CartItem cartItem = existingCartItem.get();
            cartItem.setQuantity(cartItem.getQuantity() + request.getQuantity());
            cartItemRepository.save(cartItem);
        } else {
            // 새 아이템 추가
            CartItem cartItem = new CartItem();
            cartItem.setCart(cart);
            cartItem.setProduct(product);
            cartItem.setProductOption(productOption);
            cartItem.setQuantity(request.getQuantity());

            // 가격 계산: 기본 가격 + 옵션 추가 가격
            BigDecimal itemPrice = product.getPrice();
            if (productOption != null && productOption.getAdditionalPrice() != null) {
                itemPrice = itemPrice.add(productOption.getAdditionalPrice());
            }
            cartItem.setPrice(itemPrice);

            cartItemRepository.save(cartItem);
            cart.getCartItems().add(cartItem);
        }

        // Manually initialize product images to avoid LazyInitializationException
        cart.getCartItems().forEach(item -> item.getProduct().getImages().size());

        return cart;
    }

    @Transactional
    public Cart getCartByUserEmail(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Cart cart = cartRepository.findByUserWithItems(user).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        });

        // Manually initialize product images to avoid LazyInitializationException
        cart.getCartItems().forEach(item -> item.getProduct().getImages().size());

        return cart;
    }

    @Transactional
    public CartItem updateCartItemQuantity(String userEmail, Long cartItemId, Integer newQuantity) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));

        // Verify that the cart item belongs to the user's cart
        if (!cartItem.getCart().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to cart item");
        }

        if (newQuantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        // 수량 검증
        Product product = cartItem.getProduct();
        if (newQuantity < product.getMinOrderQuantity()) {
            throw new IllegalArgumentException("최소 주문 수량은 " + product.getMinOrderQuantity() + "개입니다");
        }
        if (product.getMaxOrderQuantity() != null && newQuantity > product.getMaxOrderQuantity()) {
            throw new IllegalArgumentException("최대 주문 수량은 " + product.getMaxOrderQuantity() + "개입니다");
        }

        cartItem.setQuantity(newQuantity);
        CartItem savedItem = cartItemRepository.save(cartItem);

        // Manually initialize product images to avoid LazyInitializationException
        savedItem.getProduct().getImages().size();

        return savedItem;
    }

    @Transactional
    public void removeCartItem(String userEmail, Long cartItemId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));

        // Verify that the cart item belongs to the user's cart
        if (!cartItem.getCart().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized access to cart item");
        }

        cartItemRepository.delete(cartItem);
    }

    @Transactional
    public void clearCart(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Optional<Cart> cartOpt = cartRepository.findByUserWithItems(user);
        if (cartOpt.isPresent()) {
            Cart cart = cartOpt.get();
            cart.getCartItems().clear();
            cartRepository.save(cart);
        }
    }
}