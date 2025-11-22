package com.agri.market.settlement;

import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderStatus;
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
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
     * 특정 기간의 정산 생성 (모든 활성 판매자 대상)
     */
    @Transactional
    public List<Settlement> generateSettlementsForPeriod(LocalDate startDate, LocalDate endDate) {
        // 활성 판매자 목록 조회
        List<Seller> activeSellers = sellerRepository.findByIsActiveTrue();

        return activeSellers.stream()
                .map(seller -> generateSettlementForSeller(seller, startDate, endDate))
                .toList();
    }

    /**
     * 특정 판매자의 정산 생성
     */
    @Transactional
    public Settlement generateSettlementForSeller(Seller seller, LocalDate startDate, LocalDate endDate) {
        // 이미 존재하는 정산인지 확인
        settlementRepository.findBySellerIdAndPeriod(seller.getId(), startDate, endDate)
                .ifPresent(existing -> {
                    throw new RuntimeException("이미 해당 기간의 정산이 존재합니다: " + existing.getId());
                });

        // 기간 내 결제 완료된 주문 조회
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        List<Order> paidOrders = orderRepository.findOrdersForExport(startDateTime, endDateTime, OrderStatus.PAID);

        // 해당 판매자의 상품 매출 및 주문 건수 계산
        BigDecimal totalSales = calculateSalesForSeller(paidOrders, seller);
        int orderCount = countOrdersForSeller(paidOrders, seller);

        // 수수료 계산 (매출 * 수수료율 / 100)
        BigDecimal commissionRate = seller.getCommissionRate();
        BigDecimal commissionAmount = totalSales
                .multiply(commissionRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        // 정산 금액 (매출 - 수수료)
        BigDecimal netAmount = totalSales.subtract(commissionAmount);

        // 정산 엔티티 생성
        Settlement settlement = new Settlement();
        settlement.setSeller(seller);
        settlement.setStartDate(startDate);
        settlement.setEndDate(endDate);
        settlement.setOrderCount(orderCount);
        settlement.setTotalSales(totalSales);
        settlement.setCommissionRate(commissionRate);
        settlement.setCommissionAmount(commissionAmount);
        settlement.setNetAmount(netAmount);
        settlement.setStatus(SettlementStatus.PENDING);

        return settlementRepository.save(settlement);
    }

    /**
     * 특정 판매자의 매출 계산 (주문 목록에서)
     */
    private BigDecimal calculateSalesForSeller(List<Order> orders, Seller seller) {
        BigDecimal totalSales = BigDecimal.ZERO;

        for (Order order : orders) {
            for (OrderItem item : order.getOrderItems()) {
                // 상품의 판매자가 대상 판매자인 경우만 집계
                if (item.getProduct().getSeller() != null &&
                    item.getProduct().getSeller().getId().equals(seller.getId())) {
                    BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                    totalSales = totalSales.add(itemTotal);
                }
            }
        }

        return totalSales;
    }

    /**
     * 특정 판매자의 주문 건수 계산 (주문 목록에서)
     */
    private int countOrdersForSeller(List<Order> orders, Seller seller) {
        int count = 0;

        for (Order order : orders) {
            boolean hasSellerProduct = false;
            for (OrderItem item : order.getOrderItems()) {
                // 상품의 판매자가 대상 판매자인 경우
                if (item.getProduct().getSeller() != null &&
                    item.getProduct().getSeller().getId().equals(seller.getId())) {
                    hasSellerProduct = true;
                    break;
                }
            }
            if (hasSellerProduct) {
                count++;
            }
        }

        return count;
    }

    /**
     * 정산 상세 조회
     */
    @Transactional(readOnly = true)
    public Settlement getSettlementById(Long id) {
        return settlementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("정산 내역을 찾을 수 없습니다: " + id));
    }

    /**
     * 정산 상세 조회 (getSettlement 메서드)
     */
    @Transactional(readOnly = true)
    public Settlement getSettlement(Long id) {
        return getSettlementById(id);
    }

    /**
     * 특정 판매자의 정산 생성 (createSettlement 메서드)
     */
    @Transactional
    public Settlement createSettlement(Long sellerId, LocalDate startDate, LocalDate endDate) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + sellerId));
        return generateSettlementForSeller(seller, startDate, endDate);
    }

    /**
     * 모든 판매자의 정산 생성 (createSettlementsForAllSellers 메서드)
     */
    @Transactional
    public List<Settlement> createSettlementsForAllSellers(LocalDate startDate, LocalDate endDate) {
        return generateSettlementsForPeriod(startDate, endDate);
    }

    /**
     * 정산 완료 처리 (completeSettlement 메서드)
     */
    @Transactional
    public Settlement completeSettlement(Long id, String settledBy) {
        Settlement settlement = getSettlementById(id);
        
        if (settlement.getStatus() != SettlementStatus.APPROVED) {
            throw new RuntimeException("승인된 정산만 완료 처리할 수 있습니다.");
        }

        settlement.setStatus(SettlementStatus.PAID);
        settlement.setPaymentDate(LocalDate.now());
        settlement.setMemo("정산 완료 - 처리자: " + settledBy);
        return settlementRepository.save(settlement);
    }

    /**
     * 모든 정산 내역 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<Settlement> getAllSettlements(Pageable pageable) {
        return settlementRepository.findAllWithSeller(pageable);
    }

    /**
     * 판매자별 정산 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<Settlement> getSettlementsBySeller(Long sellerId, Pageable pageable) {
        return settlementRepository.findBySellerId(sellerId, pageable);
    }

    /**
     * 상태별 정산 내역 조회
     */
    @Transactional(readOnly = true)
    public Page<Settlement> getSettlementsByStatus(SettlementStatus status, Pageable pageable) {
        return settlementRepository.findByStatus(status, pageable);
    }

    /**
     * 정산 승인
     */
    @Transactional
    public Settlement approveSettlement(Long id) {
        Settlement settlement = getSettlementById(id);

        if (settlement.getStatus() != SettlementStatus.PENDING) {
            throw new RuntimeException("대기 중인 정산만 승인할 수 있습니다.");
        }

        settlement.setStatus(SettlementStatus.APPROVED);
        return settlementRepository.save(settlement);
    }

    /**
     * 정산 지급 완료 처리
     */
    @Transactional
    public Settlement markAsPaid(Long id, String paymentMethod, LocalDate paymentDate) {
        Settlement settlement = getSettlementById(id);

        if (settlement.getStatus() != SettlementStatus.APPROVED) {
            throw new RuntimeException("승인된 정산만 지급 처리할 수 있습니다.");
        }

        settlement.setStatus(SettlementStatus.PAID);
        settlement.setPaymentMethod(paymentMethod);
        settlement.setPaymentDate(paymentDate);
        return settlementRepository.save(settlement);
    }

    /**
     * 정산 취소
     */
    @Transactional
    public Settlement cancelSettlement(Long id, String reason) {
        Settlement settlement = getSettlementById(id);

        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new RuntimeException("지급 완료된 정산은 취소할 수 없습니다.");
        }

        settlement.setStatus(SettlementStatus.CANCELLED);
        settlement.setMemo(reason);
        return settlementRepository.save(settlement);
    }

    /**
     * 정산 수정 (비고, 금액 조정 등)
     */
    @Transactional
    public Settlement updateSettlement(Long id, Settlement updates) {
        Settlement settlement = getSettlementById(id);

        if (settlement.getStatus() == SettlementStatus.PAID) {
            throw new RuntimeException("지급 완료된 정산은 수정할 수 없습니다.");
        }

        // 수정 가능한 필드만 업데이트
        if (updates.getMemo() != null) {
            settlement.setMemo(updates.getMemo());
        }

        // 금액 수동 조정 (필요시)
        if (updates.getTotalSales() != null) {
            settlement.setTotalSales(updates.getTotalSales());
            // 수수료 재계산 (정산 당시의 수수료율 사용)
            BigDecimal commissionAmount = updates.getTotalSales()
                    .multiply(settlement.getCommissionRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            settlement.setCommissionAmount(commissionAmount);
            settlement.setNetAmount(updates.getTotalSales().subtract(commissionAmount));
        }

        return settlementRepository.save(settlement);
    }

    /**
     * 정산 통계
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSettlementStats() {
        long totalSettlements = settlementRepository.count();
        long pendingCount = settlementRepository.findByStatus(SettlementStatus.PENDING, Pageable.unpaged()).getTotalElements();
        long approvedCount = settlementRepository.findByStatus(SettlementStatus.APPROVED, Pageable.unpaged()).getTotalElements();
        long paidCount = settlementRepository.findByStatus(SettlementStatus.PAID, Pageable.unpaged()).getTotalElements();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSettlements", totalSettlements);
        stats.put("pendingCount", pendingCount);
        stats.put("approvedCount", approvedCount);
        stats.put("paidCount", paidCount);

        return stats;
    }
}
