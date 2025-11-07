package com.agri.market.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    long countByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);

    // 관리자용: 이름 또는 이메일로 검색
    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    // 관리자용: 역할별 조회
    Page<User> findByRole(String role, Pageable pageable);

    // 이름 또는 이메일로 검색 (findByNameContainingOrEmailContaining 메서드)
    Page<User> findByNameContainingOrEmailContaining(String name, String email, Pageable pageable);
}
