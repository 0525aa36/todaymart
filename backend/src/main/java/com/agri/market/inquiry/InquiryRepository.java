package com.agri.market.inquiry;

import com.agri.market.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByUserOrderByCreatedAtDesc(User user);
    List<Inquiry> findAllByOrderByStatusAscCreatedAtDesc();
}
