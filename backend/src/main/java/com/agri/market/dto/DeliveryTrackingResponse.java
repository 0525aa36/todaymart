package com.agri.market.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 스마트택배 API 배송조회 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeliveryTrackingResponse {

    /**
     * 배송 완료 여부
     */
    private boolean complete;

    /**
     * 배송 상태 레벨 (1-6)
     * 1: 배송준비중 (상품인수 전)
     * 2-5: 배송중
     * 6: 배송완료
     */
    private int level;

    /**
     * 배송 상태 레벨 설명
     */
    private String levelDescription;

    /**
     * 상품명
     */
    @JsonProperty("itemName")
    private String itemName;

    /**
     * 송장번호
     */
    @JsonProperty("invoiceNo")
    private String invoiceNo;

    /**
     * 택배사 코드
     */
    private String courierCode;

    /**
     * 택배사 이름
     */
    private String courierName;

    /**
     * 수령인
     */
    @JsonProperty("receiverName")
    private String receiverName;

    /**
     * 배송지 주소
     */
    @JsonProperty("receiverAddr")
    private String receiverAddr;

    /**
     * 발송인
     */
    @JsonProperty("senderName")
    private String senderName;

    /**
     * 배송 이력
     */
    @JsonProperty("trackingDetails")
    private List<TrackingDetail> trackingDetails;

    /**
     * 에러 메시지 (조회 실패 시)
     */
    private String errorMessage;

    /**
     * 조회 성공 여부
     */
    private boolean success;

    /**
     * 배송 상세 이력
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TrackingDetail {
        /**
         * 처리 시간
         */
        @JsonProperty("timeString")
        private String timeString;

        /**
         * 처리 일시 (yyyy.MM.dd 형식)
         */
        private String time;

        /**
         * 처리 위치
         */
        @JsonProperty("where")
        private String location;

        /**
         * 처리 상태
         */
        @JsonProperty("kind")
        private String status;

        /**
         * 연락처
         */
        @JsonProperty("telno")
        private String telNo;

        /**
         * 배송 상태 코드
         */
        private String code;
    }

    /**
     * 배송 상태 레벨에 따른 설명 반환
     */
    public static String getLevelDescription(int level) {
        return switch (level) {
            case 1 -> "배송준비중";
            case 2 -> "집화처리";
            case 3 -> "배송중";
            case 4 -> "지점도착";
            case 5 -> "배송출발";
            case 6 -> "배송완료";
            default -> "알 수 없음";
        };
    }
}
