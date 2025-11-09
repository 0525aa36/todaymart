package com.agri.market.inquiry;

import com.agri.market.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    List<Inquiry> findByUserOrderByCreatedAtDesc(User user);
    List<Inquiry> findAllByOrderByStatusAscCreatedAtDesc();

    @Query("SELECT i FROM Inquiry i " +
           "LEFT JOIN FETCH i.user " +
           "LEFT JOIN FETCH i.answeredBy " +
           "ORDER BY i.status ASC, i.createdAt DESC")
    List<Inquiry> findAllWithUserAndAnsweredBy();

    @Query("SELECT i FROM Inquiry i " +
           "LEFT JOIN FETCH i.user " +
           "LEFT JOIN FETCH i.answeredBy " +
           "WHERE i.id = :id")
    Inquiry findByIdWithUserAndAnsweredBy(Long id);
}
