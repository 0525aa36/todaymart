package com.agri.market.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // 사용자 검색 (이름 또는 이메일)
    Page<User> findByNameContainingOrEmailContaining(String name, String email, Pageable pageable);
}
