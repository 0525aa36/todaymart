package com.agri.market.delivery;

import com.agri.market.dto.CourierCompanyResponse;
import com.agri.market.dto.DeliveryTrackingResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 배송 조회 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryTrackingController {

    private final DeliveryTrackingService deliveryTrackingService;

    /**
     * 배송 정보 조회
     *
     * @param courierCode    택배사 코드
     * @param trackingNumber 송장번호
     * @return 배송 조회 결과
     */
    @GetMapping("/tracking")
    public ResponseEntity<DeliveryTrackingResponse> trackDelivery(
            @RequestParam String courierCode,
            @RequestParam String trackingNumber) {

        log.info("Tracking delivery request: courierCode={}, trackingNumber={}", courierCode, trackingNumber);

        DeliveryTrackingResponse response = deliveryTrackingService.trackDelivery(courierCode, trackingNumber);

        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * 택배사 목록 조회
     *
     * @return 전체 택배사 목록
     */
    @GetMapping("/couriers")
    public ResponseEntity<List<CourierCompanyResponse>> getCourierList() {
        return ResponseEntity.ok(deliveryTrackingService.getCourierList());
    }

    /**
     * 주요 택배사 목록 조회 (상위 5개)
     *
     * @return 주요 택배사 목록
     */
    @GetMapping("/couriers/major")
    public ResponseEntity<List<CourierCompanyResponse>> getMajorCourierList() {
        return ResponseEntity.ok(deliveryTrackingService.getMajorCourierList());
    }
}
