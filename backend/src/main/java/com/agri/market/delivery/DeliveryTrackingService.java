package com.agri.market.delivery;

import com.agri.market.dto.CourierCompanyResponse;
import com.agri.market.dto.DeliveryTrackingResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 스마트택배 API를 이용한 배송조회 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryTrackingService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${sweettracker.api-key:}")
    private String apiKey;

    @Value("${sweettracker.api-url:http://info.sweettracker.co.kr/api/v1}")
    private String apiUrl;

    /**
     * 배송 정보 조회
     *
     * @param courierCode    택배사 코드
     * @param trackingNumber 송장번호
     * @return 배송 조회 결과
     */
    public DeliveryTrackingResponse trackDelivery(String courierCode, String trackingNumber) {
        try {
            // API URL 구성
            String url = UriComponentsBuilder.fromHttpUrl(apiUrl + "/trackingInfo")
                    .queryParam("t_key", apiKey)
                    .queryParam("t_code", courierCode)
                    .queryParam("t_invoice", trackingNumber)
                    .toUriString();

            log.info("Calling SweetTracker API: courierCode={}, trackingNumber={}", courierCode, trackingNumber);

            // API 호출
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("SweetTracker API error: status={}", response.getStatusCode());
                return createErrorResponse("배송 조회에 실패했습니다. (HTTP " + response.getStatusCode() + ")");
            }

            // 응답 파싱
            JsonNode root = objectMapper.readTree(response.getBody());

            // 에러 체크
            if (root.has("status") && !root.get("status").asBoolean()) {
                String msg = root.has("msg") ? root.get("msg").asText() : "배송 조회에 실패했습니다.";
                log.warn("SweetTracker API returned error: {}", msg);
                return createErrorResponse(msg);
            }

            // 정상 응답 파싱
            DeliveryTrackingResponse tracking = DeliveryTrackingResponse.builder()
                    .success(true)
                    .complete(root.has("complete") && root.get("complete").asBoolean())
                    .level(root.has("level") ? root.get("level").asInt() : 0)
                    .itemName(getTextOrNull(root, "itemName"))
                    .invoiceNo(getTextOrNull(root, "invoiceNo"))
                    .receiverName(getTextOrNull(root, "receiverName"))
                    .receiverAddr(getTextOrNull(root, "receiverAddr"))
                    .senderName(getTextOrNull(root, "senderName"))
                    .courierCode(courierCode)
                    .build();

            // 택배사 이름 설정
            CourierCompany.findByCode(courierCode)
                    .ifPresent(c -> tracking.setCourierName(c.getName()));

            // 배송 상태 레벨 설명 설정
            tracking.setLevelDescription(DeliveryTrackingResponse.getLevelDescription(tracking.getLevel()));

            // 배송 이력 파싱
            if (root.has("trackingDetails") && root.get("trackingDetails").isArray()) {
                List<DeliveryTrackingResponse.TrackingDetail> details = new ArrayList<>();
                for (JsonNode detail : root.get("trackingDetails")) {
                    DeliveryTrackingResponse.TrackingDetail td = new DeliveryTrackingResponse.TrackingDetail();
                    td.setTimeString(getTextOrNull(detail, "timeString"));
                    td.setTime(getTextOrNull(detail, "time"));
                    td.setLocation(getTextOrNull(detail, "where"));
                    td.setStatus(getTextOrNull(detail, "kind"));
                    td.setTelNo(getTextOrNull(detail, "telno"));
                    td.setCode(getTextOrNull(detail, "code"));
                    details.add(td);
                }
                tracking.setTrackingDetails(details);
            }

            log.info("Delivery tracking success: invoice={}, level={}, complete={}",
                    trackingNumber, tracking.getLevel(), tracking.isComplete());

            return tracking;

        } catch (Exception e) {
            log.error("Error tracking delivery: courierCode={}, trackingNumber={}", courierCode, trackingNumber, e);
            return createErrorResponse("배송 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * 택배사 목록 조회
     *
     * @return 택배사 목록
     */
    public List<CourierCompanyResponse> getCourierList() {
        return Arrays.stream(CourierCompany.values())
                .map(c -> CourierCompanyResponse.builder()
                        .code(c.getCode())
                        .name(c.getName())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 주요 택배사 목록 조회 (상위 5개)
     *
     * @return 주요 택배사 목록
     */
    public List<CourierCompanyResponse> getMajorCourierList() {
        List<CourierCompany> majorCouriers = List.of(
                CourierCompany.CJ_LOGISTICS,
                CourierCompany.HANJIN,
                CourierCompany.LOGEN,
                CourierCompany.LOTTE,
                CourierCompany.POST_OFFICE
        );

        return majorCouriers.stream()
                .map(c -> CourierCompanyResponse.builder()
                        .code(c.getCode())
                        .name(c.getName())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * JSON 노드에서 텍스트 값 추출
     */
    private String getTextOrNull(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull()
                ? node.get(field).asText()
                : null;
    }

    /**
     * 에러 응답 생성
     */
    private DeliveryTrackingResponse createErrorResponse(String message) {
        return DeliveryTrackingResponse.builder()
                .success(false)
                .errorMessage(message)
                .build();
    }
}
