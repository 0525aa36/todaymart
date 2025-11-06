package com.agri.market.admin;

import com.agri.market.order.Order;
import com.agri.market.order.OrderRepository;
import com.agri.market.user.User;
import com.agri.market.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public AdminUserService(UserRepository userRepository, OrderRepository orderRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * 모든 사용자 조회
     */
    @Transactional(readOnly = true)
    public Page<UserDto> getAllUsers(Pageable pageable) {
        Page<User> users = userRepository.findAll(pageable);

        List<UserDto> userDtos = users.getContent().stream()
                .map(user -> {
                    long orderCount = orderRepository.countByUserId(user.getId());
                    BigDecimal totalSpent = orderRepository.sumTotalAmountByUserId(user.getId());
                    return new UserDto(user, orderCount, totalSpent != null ? totalSpent : BigDecimal.ZERO);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(userDtos, pageable, users.getTotalElements());
    }

    /**
     * 사용자 검색
     */
    @Transactional(readOnly = true)
    public Page<UserDto> searchUsers(String query, Pageable pageable) {
        Page<User> users = userRepository.findByNameContainingOrEmailContaining(query, query, pageable);

        List<UserDto> userDtos = users.getContent().stream()
                .map(user -> {
                    long orderCount = orderRepository.countByUserId(user.getId());
                    BigDecimal totalSpent = orderRepository.sumTotalAmountByUserId(user.getId());
                    return new UserDto(user, orderCount, totalSpent != null ? totalSpent : BigDecimal.ZERO);
                })
                .collect(Collectors.toList());

        return new PageImpl<>(userDtos, pageable, users.getTotalElements());
    }

    /**
     * 사용자 상세 정보 조회
     */
    @Transactional(readOnly = true)
    public UserDetailDto getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));

        // 주문 이력 조회
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);

        // 통계 계산
        long orderCount = orders.size();
        BigDecimal totalSpent = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new UserDetailDto(user, orders, orderCount, totalSpent);
    }

    /**
     * 사용자 활성화/비활성화
     */
    @Transactional
    public void updateUserStatus(Long userId, boolean enabled) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));

        user.setEnabled(enabled);
        userRepository.save(user);
    }

    /**
     * 사용자 역할 변경
     */
    @Transactional
    public void updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다: " + userId));

        user.setRole(role);
        userRepository.save(user);
    }
}
