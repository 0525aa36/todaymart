package com.agri.market.googlesheets;

import com.agri.market.order.Order;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderRepository;
import com.agri.market.product.Product;
import com.agri.market.product.ProductImage;
import com.agri.market.product.ProductOption;
import com.agri.market.product.ProductRepository;
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
import java.util.*;
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
    private final ProductRepository productRepository;
    private final SellerRepository sellerRepository;
    private final GoogleSheetsSyncLogRepository syncLogRepository;

    public GoogleSheetsService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            SellerRepository sellerRepository,
            GoogleSheetsSyncLogRepository syncLogRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
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

    /**
     * 특정 판매자의 상품 목록을 구글 스프레드시트에 동기화
     */
    @Transactional
    public void syncSellerProducts(Long sellerId, GoogleSheetsSyncLog.TriggerType triggerType) {
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
            log.info("Starting product sync for seller: {} (ID: {})", seller.getName(), sellerId);
            log.info("Spreadsheet ID: {}", seller.getSpreadsheetId());

            // 판매자의 상품 목록 조회 (이미지 포함)
            List<Product> products = productRepository.findBySellerIdWithImagesAndOptions(sellerId);
            log.info("Found {} products for seller {}", products.size(), seller.getName());

            // 옵션 LAZY loading 강제 초기화 (MultipleBagFetchException 방지)
            products.forEach(p -> p.getOptions().size());

            // 3개의 시트에 데이터 준비
            List<List<Object>> productData = prepareProductData(products);
            List<List<Object>> optionData = prepareProductOptionData(products);
            List<List<Object>> imageData = prepareProductImageData(products);

            log.info("Prepared {} product rows, {} option rows, {} image rows",
                    productData.size() - 1, optionData.size() - 1, imageData.size() - 1);

            // 스프레드시트 업데이트
            updateProductSpreadsheet(seller.getSpreadsheetId(), productData, optionData, imageData);
            log.info("Successfully updated product spreadsheet");

            // 서식 적용 (TODO: 시트 ID 동적 조회 후 활성화)
            // formatProductSheet(seller.getSpreadsheetId());
            log.info("Skipped formatting (sheet IDs need to be determined dynamically)");

            syncLog.setStatus(GoogleSheetsSyncLog.SyncStatus.SUCCESS);
            syncLog.setRowsUpdated(productData.size() - 1); // 헤더 제외

            // 마지막 동기화 시간 업데이트
            seller.setLastSyncedAt(LocalDateTime.now());
            sellerRepository.save(seller);

            log.info("Successfully synced products for seller: {} ({})", seller.getName(), seller.getId());

        } catch (Exception e) {
            log.error("Failed to sync products for seller: " + seller.getName(), e);
            syncLog.setStatus(GoogleSheetsSyncLog.SyncStatus.FAILED);
            syncLog.setErrorMessage(e.getMessage());
            throw new RuntimeException("상품 스프레드시트 동기화 실패: " + e.getMessage(), e);
        } finally {
            syncLogRepository.save(syncLog);
        }
    }

    /**
     * 상품 데이터를 스프레드시트 형식으로 변환
     */
    private List<List<Object>> prepareProductData(List<Product> products) {
        List<List<Object>> values = new ArrayList<>();

        // 헤더
        values.add(Arrays.asList(
                "상품ID",
                "상품명",
                "카테고리",
                "원산지",
                "판매가",
                "할인율(%)",
                "할인가",
                "공급가",
                "재고수량",
                "최소주문수량",
                "최대주문수량",
                "배송비",
                "합포장가능",
                "합포장단위",
                "택배사",
                "메인이미지URL",
                "상품설명",
                "옵션개수",
                "이미지개수",
                "등록일시",
                "수정일시",
                "동기화상태"
        ));

        // 데이터 행
        for (Product p : products) {
            values.add(Arrays.asList(
                    p.getId() != null ? p.getId().toString() : "",
                    p.getName() != null ? p.getName() : "",
                    p.getCategory() != null ? p.getCategory() : "",
                    p.getOrigin() != null ? p.getOrigin() : "",
                    p.getPrice() != null ? p.getPrice().toString() : "0",
                    p.getDiscountRate() != null ? p.getDiscountRate().toString() : "0",
                    p.getDiscountedPrice() != null ? p.getDiscountedPrice().toString() : "0",
                    p.getSupplyPrice() != null ? p.getSupplyPrice().toString() : "",
                    p.getStock() != null ? p.getStock().toString() : "0",
                    p.getMinOrderQuantity() != null ? p.getMinOrderQuantity().toString() : "1",
                    p.getMaxOrderQuantity() != null ? p.getMaxOrderQuantity().toString() : "",
                    p.getShippingFee() != null ? p.getShippingFee().toString() : "3000",
                    p.getCanCombineShipping() != null && p.getCanCombineShipping() ? "Y" : "N",
                    p.getCombineShippingUnit() != null ? p.getCombineShippingUnit().toString() : "",
                    p.getCourierCompany() != null ? p.getCourierCompany() : "",
                    p.getImageUrl() != null ? p.getImageUrl() : "",
                    p.getDescription() != null ? p.getDescription() : "",
                    p.getOptions() != null ? String.valueOf(p.getOptions().size()) : "0",
                    p.getImageUrls() != null && !p.getImageUrls().isEmpty() ? String.valueOf(p.getImageUrls().split(",").length) : "0",
                    p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FORMATTER) : "",
                    p.getUpdatedAt() != null ? p.getUpdatedAt().format(DATE_FORMATTER) : "",
                    "동기화완료"
            ));
        }

        return values;
    }

    /**
     * 상품 옵션 데이터를 스프레드시트 형식으로 변환
     */
    private List<List<Object>> prepareProductOptionData(List<Product> products) {
        List<List<Object>> values = new ArrayList<>();

        // 헤더
        values.add(Arrays.asList(
                "옵션ID",
                "상품ID",
                "상품명",
                "옵션명",
                "추가금액",
                "재고수량",
                "필수옵션"
        ));

        // 데이터 행
        for (Product p : products) {
            if (p.getOptions() != null && !p.getOptions().isEmpty()) {
                for (ProductOption option : p.getOptions()) {
                    values.add(Arrays.asList(
                            option.getId() != null ? option.getId().toString() : "",
                            p.getId() != null ? p.getId().toString() : "",
                            p.getName() != null ? p.getName() : "",
                            option.getName() != null ? option.getName() : "",
                            option.getAdditionalPrice() != null ? option.getAdditionalPrice().toString() : "0",
                            option.getStock() != null ? option.getStock().toString() : "0",
                            option.getIsRequired() != null && option.getIsRequired() ? "Y" : "N"
                    ));
                }
            }
        }

        return values;
    }

    /**
     * 상품 이미지 데이터를 스프레드시트 형식으로 변환
     */
    private List<List<Object>> prepareProductImageData(List<Product> products) {
        List<List<Object>> values = new ArrayList<>();

        // 헤더
        values.add(Arrays.asList(
                "이미지ID",
                "상품ID",
                "상품명",
                "이미지URL",
                "이미지타입",
                "표시순서"
        ));

        // 데이터 행
        for (Product p : products) {
            if (p.getImageUrls() != null && !p.getImageUrls().isEmpty()) {
                String[] imageUrls = p.getImageUrls().split(",");
                for (int i = 0; i < imageUrls.length; i++) {
                    values.add(Arrays.asList(
                            "",  // No image ID anymore
                            p.getId() != null ? p.getId().toString() : "",
                            p.getName() != null ? p.getName() : "",
                            imageUrls[i].trim(),
                            "MAIN",  // Image type
                            String.valueOf(i)  // Display order
                    ));
                }
            }
        }

        return values;
    }

    /**
     * 상품 스프레드시트 업데이트 (3개 시트)
     */
    private void updateProductSpreadsheet(String spreadsheetId,
                                          List<List<Object>> productData,
                                          List<List<Object>> optionData,
                                          List<List<Object>> imageData) throws IOException {
        // 1. 상품목록 시트 업데이트
        ClearValuesRequest clearRequest = new ClearValuesRequest();
        sheetsService.spreadsheets().values()
                .clear(spreadsheetId, "상품목록!A:Z", clearRequest)
                .execute();

        ValueRange productBody = new ValueRange().setValues(productData);
        sheetsService.spreadsheets().values()
                .update(spreadsheetId, "상품목록!A1", productBody)
                .setValueInputOption("RAW")
                .execute();

        // 2. 상품옵션 시트 업데이트
        sheetsService.spreadsheets().values()
                .clear(spreadsheetId, "상품옵션!A:Z", clearRequest)
                .execute();

        ValueRange optionBody = new ValueRange().setValues(optionData);
        sheetsService.spreadsheets().values()
                .update(spreadsheetId, "상품옵션!A1", optionBody)
                .setValueInputOption("RAW")
                .execute();

        // 3. 상품이미지 시트 업데이트
        sheetsService.spreadsheets().values()
                .clear(spreadsheetId, "상품이미지!A:Z", clearRequest)
                .execute();

        ValueRange imageBody = new ValueRange().setValues(imageData);
        sheetsService.spreadsheets().values()
                .update(spreadsheetId, "상품이미지!A1", imageBody)
                .setValueInputOption("RAW")
                .execute();
    }

    /**
     * 상품 시트 서식 적용
     */
    private void formatProductSheet(String spreadsheetId) throws IOException {
        // 스프레드시트 메타데이터 가져오기
        Spreadsheet spreadsheet = sheetsService.spreadsheets().get(spreadsheetId).execute();
        Map<String, Integer> sheetIds = new HashMap<>();

        for (Sheet sheet : spreadsheet.getSheets()) {
            String title = sheet.getProperties().getTitle();
            Integer sheetId = sheet.getProperties().getSheetId();
            sheetIds.put(title, sheetId);
            log.debug("Found sheet: {} with ID: {}", title, sheetId);
        }

        // 필요한 시트가 없으면 생성
        ensureSheetsExist(spreadsheetId, sheetIds);

        // 시트 ID를 다시 가져오기 (새로 생성된 경우)
        spreadsheet = sheetsService.spreadsheets().get(spreadsheetId).execute();
        sheetIds.clear();
        for (Sheet sheet : spreadsheet.getSheets()) {
            sheetIds.put(sheet.getProperties().getTitle(), sheet.getProperties().getSheetId());
        }

        List<Request> requests = new ArrayList<>();

        Integer productListSheetId = sheetIds.get("상품목록");
        if (productListSheetId == null) {
            log.warn("상품목록 시트를 찾을 수 없습니다. 서식 적용을 건너뜁니다.");
            return;
        }

        // 상품목록 시트 헤더 행 배경색 및 굵게
        requests.add(new Request()
                .setRepeatCell(new RepeatCellRequest()
                        .setRange(new GridRange()
                                .setSheetId(productListSheetId)
                                .setStartRowIndex(0)
                                .setEndRowIndex(1))
                        .setCell(new CellData()
                                .setUserEnteredFormat(new CellFormat()
                                        .setBackgroundColor(new Color()
                                                .setRed(0.2f)
                                                .setGreen(0.5f)
                                                .setBlue(0.8f))
                                        .setTextFormat(new TextFormat()
                                                .setBold(true)
                                                .setForegroundColor(new Color()
                                                        .setRed(1.0f)
                                                        .setGreen(1.0f)
                                                        .setBlue(1.0f)))))
                        .setFields("userEnteredFormat(backgroundColor,textFormat)")));

        // 헤더 행 고정
        requests.add(new Request()
                .setUpdateSheetProperties(new UpdateSheetPropertiesRequest()
                        .setProperties(new SheetProperties()
                                .setSheetId(productListSheetId)
                                .setGridProperties(new GridProperties()
                                        .setFrozenRowCount(1)))
                        .setFields("gridProperties.frozenRowCount")));

        Integer productOptionSheetId = sheetIds.get("상품옵션");
        if (productOptionSheetId != null) {
            // 상품옵션 시트 헤더
            requests.add(new Request()
                    .setRepeatCell(new RepeatCellRequest()
                            .setRange(new GridRange()
                                    .setSheetId(productOptionSheetId)
                                .setStartRowIndex(0)
                                .setEndRowIndex(1))
                        .setCell(new CellData()
                                .setUserEnteredFormat(new CellFormat()
                                        .setBackgroundColor(new Color()
                                                .setRed(0.3f)
                                                .setGreen(0.7f)
                                                .setBlue(0.5f))
                                        .setTextFormat(new TextFormat()
                                                .setBold(true)
                                                .setForegroundColor(new Color()
                                                        .setRed(1.0f)
                                                        .setGreen(1.0f)
                                                        .setBlue(1.0f)))))
                        .setFields("userEnteredFormat(backgroundColor,textFormat)")));

            requests.add(new Request()
                    .setUpdateSheetProperties(new UpdateSheetPropertiesRequest()
                            .setProperties(new SheetProperties()
                                    .setSheetId(productOptionSheetId)
                                    .setGridProperties(new GridProperties()
                                            .setFrozenRowCount(1)))
                            .setFields("gridProperties.frozenRowCount")));
        }

        // Apply formatting (execute requests)
        if (!requests.isEmpty()) {
            BatchUpdateSpreadsheetRequest batchRequest = new BatchUpdateSpreadsheetRequest()
                    .setRequests(requests);
            sheetsService.spreadsheets().batchUpdate(spreadsheetId, batchRequest).execute();
        }
    }

    /**
     * 필요한 시트가 없으면 생성 (미구현 - TODO)
     */
    private void ensureSheetsExist(String spreadsheetId, Map<String, Integer> existingSheets) {
        // TODO: 상품목록, 상품옵션, 상품이미지 시트가 없으면 생성
        // 지금은 수동으로 시트를 만들어야 함
    }
}
