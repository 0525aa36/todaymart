package com.agri.market.settlement;

import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.PaymentStatus;
import com.agri.market.seller.Seller;
import com.agri.market.seller.SellerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final SellerRepository sellerRepository;
    private final OrderRepository orderRepository;

    public SettlementService(SettlementRepository settlementRepository,
                             SellerRepository sellerRepository,
                             OrderRepository orderRepository) {
        this.settlementRepository = settlementRepository;
        this.sellerRepository = sellerRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * 정산 생성 (특정 기간)
     */
    @Transactional
    public Settlement createSettlement(Long sellerId, LocalDate startDate, LocalDate endDate) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + sellerId));

        // 중복 정산 체크
        if (settlementRepository.findBySellerIdAndStartDateAndEndDate(sellerId, startDate, endDate).isPresent()) {
            throw new RuntimeException("해당 기간의 정산이 이미 존재합니다.");
        }

        // 해당 기간의 결제 완료된 주문 조회
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);

        List<Order> orders = orderRepository.findAll()
                .stream()
                .filter(order -> order.getCreatedAt().isAfter(startDateTime) &&
                               order.getCreatedAt().isBefore(endDateTime) &&
                               order.getPaymentStatus() == PaymentStatus.PAID)
                .collect(Collectors.toList());

        // 판매자별 주문 아이템 필터링 및 집계
        BigDecimal totalSales = BigDecimal.ZERO;
        int orderCount = 0;

        for (Order order : orders) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() != null &&
                    item.getProduct().getSeller() != null &&
                    item.getProduct().getSeller().getId().equals(sellerId)) {

                    BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    totalSales = totalSales.add(itemTotal);
                    orderCount++;
                }
            }
        }

        // 수수료 및 정산 금액 계산
        BigDecimal commissionAmount = totalSales
                .multiply(seller.getCommissionRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal settlementAmount = totalSales.subtract(commissionAmount);

        // 정산 엔티티 생성
        Settlement settlement = new Settlement();
        settlement.setSeller(seller);
        settlement.setStartDate(startDate);
        settlement.setEndDate(endDate);
        settlement.setTotalSalesAmount(totalSales);
        settlement.setCommissionAmount(commissionAmount);
        settlement.setSettlementAmount(settlementAmount);
        settlement.setCommissionRate(seller.getCommissionRate());
        settlement.setOrderCount(orderCount);
        settlement.setStatus(SettlementStatus.PENDING);

        return settlementRepository.save(settlement);
    }

    /**
     * 일괄 정산 생성 (모든 판매자)
     */
    @Transactional
    public List<Settlement> createSettlementsForAllSellers(LocalDate startDate, LocalDate endDate) {
        List<Seller> activeSellers = sellerRepository.findByIsActiveTrue(null).getContent();

        return activeSellers.stream()
                .map(seller -> {
                    try {
                        return createSettlement(seller.getId(), startDate, endDate);
                    } catch (RuntimeException e) {
                        // 이미 정산이 존재하면 스킵
                        return null;
                    }
                })
                .filter(settlement -> settlement != null)
                .collect(Collectors.toList());
    }

    /**
     * 정산 완료 처리
     */
    @Transactional
    public Settlement completeSettlement(Long id, String settledBy) {
        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + id));

        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            throw new RuntimeException("이미 완료된 정산입니다.");
        }

        settlement.setStatus(SettlementStatus.COMPLETED);
        settlement.setSettledAt(LocalDateTime.now());
        settlement.setSettledBy(settledBy);

        return settlementRepository.save(settlement);
    }

    /**
     * 정산 취소
     */
    @Transactional
    public Settlement cancelSettlement(Long id) {
        Settlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + id));

        settlement.setStatus(SettlementStatus.CANCELLED);
        return settlementRepository.save(settlement);
    }

    /**
     * 정산 조회
     */
    @Transactional(readOnly = true)
    public Settlement getSettlement(Long id) {
        return settlementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("정산을 찾을 수 없습니다: " + id));
    }

    /**
     * 모든 정산 조회
     */
    @Transactional(readOnly = true)
    public Page<Settlement> getAllSettlements(Pageable pageable) {
        return settlementRepository.findAll(pageable);
    }

    /**
     * 판매자별 정산 조회
     */
    @Transactional(readOnly = true)
    public Page<Settlement> getSettlementsBySeller(Long sellerId, Pageable pageable) {
        return settlementRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable);
    }

    /**
     * 정산 상태별 조회
     */
    @Transactional(readOnly = true)
    public Page<Settlement> getSettlementsByStatus(SettlementStatus status, Pageable pageable) {
        return settlementRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }
}
