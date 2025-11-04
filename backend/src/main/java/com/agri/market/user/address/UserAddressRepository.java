package com.agri.market.user.address;

import com.agri.market.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUserOrderByIsDefaultDescCreatedAtDesc(User user);
    Optional<UserAddress> findByIdAndUser(Long id, User user);
    Optional<UserAddress> findByUserAndIsDefaultTrue(User user);
    boolean existsByUser(User user);
    Optional<UserAddress> findFirstByUserOrderByCreatedAtAsc(User user);
}
