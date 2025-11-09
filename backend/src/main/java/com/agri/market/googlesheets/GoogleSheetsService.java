package com.agri.market.googlesheets;

import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderRepository;
import com.agri.market.seller.Seller;
import com.agri.market.seller.SellerRepository;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@ConditionalOnProperty(name = "google.sheets.enabled", havingValue = "true")
public class GoogleSheetsService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired(required = false)
    @Qualifier("googleSheetsClient")
    private Sheets sheetsService;

    private final OrderRepository orderRepository;
    private final SellerRepository sellerRepository;
    private final GoogleSheetsSyncLogRepository syncLogRepository;

    public GoogleSheetsService(
            OrderRepository orderRepository,
            SellerRepository sellerRepository,
            GoogleSheetsSyncLogRepository syncLogRepository) {
        this.orderRepository = orderRepository;
        this.sellerRepository = sellerRepository;
        this.syncLogRepository = syncLogRepository;
    }

    /**
     * 특정 판매자의 주문 내역을 구글 스프레드시트에 동기화
     */
    @Transactional
    public void syncSellerOrders(Long sellerId, GoogleSheetsSyncLog.TriggerType triggerType) {
        if (sheetsService == null) {
            log.warn("Google Sheets service is not enabled");
            return;
        }

        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("판매자를 찾을 수 없습니다: " + sellerId));

        if (seller.getSpreadsheetId() == null || seller.getSpreadsheetId().isEmpty()) {
            throw new RuntimeException("판매자의 스프레드시트 ID가 설정되지 않았습니다.");
        }

        GoogleSheetsSyncLog syncLog = new GoogleSheetsSyncLog();
        syncLog.setSeller(seller);
        syncLog.setTriggeredBy(triggerType);
        syncLog.setSyncTime(LocalDateTime.now());

        try {
            log.info("Starting sync for seller: {} (ID: {})", seller.getName(), sellerId);
            log.info("Spreadsheet ID: {}", seller.getSpreadsheetId());

            // 판매자의 주문 내역 조회
            List<Order> orders = orderRepository.findAll().stream()
                    .filter(order -> order.getOrderItems().stream()
                            .anyMatch(item -> item.getProduct().getSeller() != null
                                    && item.getProduct().getSeller().getId().equals(sellerId)))
                    .collect(Collectors.toList());

            log.info("Found {} orders for seller {}", orders.size(), seller.getName());

            // 스프레드시트 데이터 준비
            List<List<Object>> values = prepareOrderData(orders, sellerId);
            log.info("Prepared {} rows of data (including header)", values.size());

            // 스프레드시트 업데이트
            updateSpreadsheet(seller.getSpreadsheetId(), values);
            log.info("Successfully updated spreadsheet");

            syncLog.setStatus(GoogleSheetsSyncLog.SyncStatus.SUCCESS);
            syncLog.setRowsUpdated(values.size() - 1); // 헤더 제외

            // 마지막 동기화 시간 업데이트
            seller.setLastSyncedAt(LocalDateTime.now());
            sellerRepository.save(seller);

            log.info("Successfully synced orders for seller: {} ({})", seller.getName(), seller.getId());

        } catch (Exception e) {
            log.error("Failed to sync orders for seller: " + seller.getName(), e);
            syncLog.setStatus(GoogleSheetsSyncLog.SyncStatus.FAILED);
            syncLog.setErrorMessage(e.getMessage());
            throw new RuntimeException("스프레드시트 동기화 실패: " + e.getMessage(), e);
        } finally {
            syncLogRepository.save(syncLog);
        }
    }

    /**
     * 모든 판매자의 주문 내역을 동기화
     */
    @Transactional
    public void syncAllSellers(GoogleSheetsSyncLog.TriggerType triggerType) {
        List<Seller> sellers = sellerRepository.findAll().stream()
                .filter(seller -> seller.getSpreadsheetId() != null && !seller.getSpreadsheetId().isEmpty())
                .collect(Collectors.toList());

        log.info("Syncing orders for {} sellers", sellers.size());

        for (Seller seller : sellers) {
            try {
                syncSellerOrders(seller.getId(), triggerType);
            } catch (Exception e) {
                log.error("Failed to sync seller: " + seller.getName(), e);
                // 한 판매자 실패해도 다른 판매자는 계속 진행
            }
        }
    }

    /**
     * 주문 데이터를 스프레드시트 형식으로 변환
     */
    private List<List<Object>> prepareOrderData(List<Order> orders, Long sellerId) {
        List<List<Object>> values = new ArrayList<>();

        // 헤더
        values.add(Arrays.asList(
                "주문번호",
                "주문일시",
                "고객명",
                "고객이메일",
                "상품명",
                "수량",
                "단가",
                "금액",
                "주문상태",
                "배송지",
                "수령인",
                "연락처",
                "송장번호"
        ));

        // 데이터 행
        for (Order order : orders) {
            for (OrderItem item : order.getOrderItems()) {
                // 해당 판매자의 상품만 포함
                if (item.getProduct().getSeller() != null
                        && item.getProduct().getSeller().getId().equals(sellerId)) {

                    values.add(Arrays.asList(
                            order.getId().toString(),
                            order.getCreatedAt().format(DATE_FORMATTER),
                            order.getUser().getName(),
                            order.getUser().getEmail(),
                            item.getProduct().getName(),
                            item.getQuantity().toString(),
                            item.getPrice().toString(),
                            item.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())).toString(),
                            getOrderStatusKorean(order.getOrderStatus().name()),
                            order.getShippingAddressLine1() + " " + (order.getShippingAddressLine2() != null ? order.getShippingAddressLine2() : ""),
                            order.getRecipientName(),
                            order.getRecipientPhone(),
                            order.getTrackingNumber() != null ? order.getTrackingNumber() : ""
                    ));
                }
            }
        }

        return values;
    }

    /**
     * 스프레드시트 업데이트
     */
    private void updateSpreadsheet(String spreadsheetId, List<List<Object>> values) throws IOException {
        String range = "주문내역!A1"; // 시트 이름과 범위

        // 기존 데이터 삭제
        ClearValuesRequest clearRequest = new ClearValuesRequest();
        sheetsService.spreadsheets().values()
                .clear(spreadsheetId, "주문내역!A:Z", clearRequest)
                .execute();

        // 새 데이터 쓰기
        ValueRange body = new ValueRange()
                .setValues(values);

        sheetsService.spreadsheets().values()
                .update(spreadsheetId, range, body)
                .setValueInputOption("RAW")
                .execute();

        // 헤더 서식 적용
        formatHeader(spreadsheetId);
    }

    /**
     * 헤더 서식 적용
     */
    private void formatHeader(String spreadsheetId) throws IOException {
        List<Request> requests = new ArrayList<>();

        // 헤더 행 배경색 (회색)
        requests.add(new Request()
                .setRepeatCell(new RepeatCellRequest()
                        .setRange(new GridRange()
                                .setSheetId(0)
                                .setStartRowIndex(0)
                                .setEndRowIndex(1))
                        .setCell(new CellData()
                                .setUserEnteredFormat(new CellFormat()
                                        .setBackgroundColor(new Color()
                                                .setRed(0.9f)
                                                .setGreen(0.9f)
                                                .setBlue(0.9f))
                                        .setTextFormat(new TextFormat()
                                                .setBold(true))))
                        .setFields("userEnteredFormat(backgroundColor,textFormat)")));

        // 헤더 행 고정
        requests.add(new Request()
                .setUpdateSheetProperties(new UpdateSheetPropertiesRequest()
                        .setProperties(new SheetProperties()
                                .setSheetId(0)
                                .setGridProperties(new GridProperties()
                                        .setFrozenRowCount(1)))
                        .setFields("gridProperties.frozenRowCount")));

        BatchUpdateSpreadsheetRequest batchRequest = new BatchUpdateSpreadsheetRequest()
                .setRequests(requests);

        sheetsService.spreadsheets().batchUpdate(spreadsheetId, batchRequest).execute();
    }

    /**
     * 주문 상태 한글 변환
     */
    private String getOrderStatusKorean(String status) {
        switch (status) {
            case "PENDING_PAYMENT":
                return "결제 대기";
            case "PAYMENT_FAILED":
                return "결제 실패";
            case "PAID":
                return "결제 완료";
            case "PREPARING":
                return "상품 준비중";
            case "SHIPPED":
                return "배송중";
            case "DELIVERED":
                return "배송 완료";
            case "CANCELLED":
                return "주문 취소";
            default:
                return status;
        }
    }
}
