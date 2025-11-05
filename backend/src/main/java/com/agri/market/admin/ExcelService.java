package com.agri.market.admin;

import com.agri.market.order.Order;
import com.agri.market.order.OrderRepository;
import com.agri.market.order.OrderItem;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ExcelService {

    private final OrderRepository orderRepository;

    public ExcelService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public ByteArrayOutputStream exportOrdersToExcel(LocalDate fromDate, LocalDate toDate) throws IOException {
        LocalDateTime startDateTime = fromDate != null ? fromDate.atStartOfDay() : null;
        LocalDateTime endDateTime = toDate != null ? toDate.atTime(LocalTime.MAX) : null;

        List<Order> orders = orderRepository.findOrdersForExport(startDateTime, endDateTime);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Orders");

        // Create header row - 본사 요청 양식
        String[] headers = {"주문번호", "기재X", "송하인", "송하인 연락처", "수취인", "수취인 연락처", "우편번호", "주소", "상품명", "수량", "배송 메세지", "송장번호"};
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
        }

        // Populate data rows
        int rowNum = 1;

        for (Order order : orders) {
            for (OrderItem item : order.getOrderItems()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(order.getId()); // 주문번호
                row.createCell(1).setCellValue(""); // 기재X
                row.createCell(2).setCellValue(order.getSenderName() != null ? order.getSenderName() : order.getUser().getName()); // 송하인
                row.createCell(3).setCellValue(order.getSenderPhone() != null ? order.getSenderPhone() : order.getUser().getPhone()); // 송하인 연락처
                row.createCell(4).setCellValue(order.getRecipientName()); // 수취인
                row.createCell(5).setCellValue(order.getRecipientPhone()); // 수취인 연락처
                row.createCell(6).setCellValue(order.getShippingPostcode()); // 우편번호
                
                // 주소 합치기
                String fullAddress = order.getShippingAddressLine1();
                if (order.getShippingAddressLine2() != null && !order.getShippingAddressLine2().trim().isEmpty()) {
                    fullAddress += " " + order.getShippingAddressLine2();
                }
                row.createCell(7).setCellValue(fullAddress); // 주소
                
                row.createCell(8).setCellValue(item.getProduct().getName()); // 상품명
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
