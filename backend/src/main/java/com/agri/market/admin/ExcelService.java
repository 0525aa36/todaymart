package com.agri.market.admin;

import com.agri.market.order.Order;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderItem;
import com.agri.market.order.OrderStatus;
import com.agri.market.seller.Seller;
import com.agri.market.seller.SellerRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class ExcelService {

    private final OrderRepository orderRepository;
    private final SellerRepository sellerRepository;

    public ExcelService(OrderRepository orderRepository, SellerRepository sellerRepository) {
        this.orderRepository = orderRepository;
        this.sellerRepository = sellerRepository;
    }

    @Transactional(readOnly = true)
    public ByteArrayOutputStream exportOrdersToExcel(LocalDate fromDate, LocalDate toDate, OrderStatus status, Long sellerId) throws IOException {
        LocalDateTime startDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime endDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        List<Order> orders;
        String sellerName = "오늘마트"; // 기본값

        if (sellerId != null) {
            orders = orderRepository.findOrdersForExportBySeller(startDateTime, endDateTime, status, sellerId);
            // 판매자명 조회
            Seller seller = sellerRepository.findById(sellerId).orElse(null);
            if (seller != null) {
                sellerName = seller.getName();
            }
        } else {
            orders = orderRepository.findOrdersForExport(startDateTime, endDateTime, status);
        }

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Orders");

        // Create header row - 판매자 양식에 맞춤
        String[] headers = {sellerName, "기재X", "송하인", "송하인 연락처", "수취인", "수취인 연락처", "우편번호", "주소", "상품명", "수량", "배송 메세지", "송장번호"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        // Populate data rows
        int rowNum = 1;

        for (Order order : orders) {
            for (OrderItem item : order.getOrderItems()) {
                // 판매자 필터가 있는 경우, 해당 판매자 상품만 포함
                if (sellerId != null && item.getProduct().getSeller() != null
                    && !item.getProduct().getSeller().getId().equals(sellerId)) {
                    continue;
                }

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(order.getOrderNumber()); // 주문번호 (ORDER_xxx 형식)
                row.createCell(1).setCellValue(""); // 기재X
                row.createCell(2).setCellValue("오늘마트"); // 송하인
                row.createCell(3).setCellValue("1644-1473"); // 송하인 연락처
                row.createCell(4).setCellValue(order.getRecipientName()); // 수취인
                row.createCell(5).setCellValue(order.getRecipientPhone()); // 수취인 연락처
                row.createCell(6).setCellValue(order.getShippingPostcode()); // 우편번호

                // 주소 합치기
                String fullAddress = order.getShippingAddressLine1();
                if (order.getShippingAddressLine2() != null && !order.getShippingAddressLine2().trim().isEmpty()) {
                    fullAddress += " " + order.getShippingAddressLine2();
                }
                row.createCell(7).setCellValue(fullAddress); // 주소

                // 상품명 + 옵션 정보
                String productName = item.getProduct().getName();
                if (item.getProductOption() != null) {
                    productName += " (" + item.getProductOption().getOptionValue() + ")";
                }
                row.createCell(8).setCellValue(productName); // 상품명 + 옵션
                row.createCell(9).setCellValue(item.getQuantity()); // 수량
                row.createCell(10).setCellValue(order.getDeliveryMessage() != null ? order.getDeliveryMessage() : ""); // 배송 메세지
                row.createCell(11).setCellValue(order.getTrackingNumber() != null ? order.getTrackingNumber() : ""); // 송장번호
            }
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();
        return outputStream;
    }
}
