package com.agri.market.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 구글 시트 동기화 결과를 표현하는 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncResult {

    /**
     * 동기화 성공 여부
     */
    private boolean success;

    /**
     * 동기화된 총 레코드 수
     */
    private int totalCount;

    /**
     * 성공한 레코드 수
     */
    private int successCount;

    /**
     * 실패한 레코드 수
     */
    private int failureCount;

    /**
     * 동기화 시작 시각
     */
    private LocalDateTime startTime;

    /**
     * 동기화 종료 시각
     */
    private LocalDateTime endTime;

    /**
     * 동기화 소요 시간 (밀리초)
     */
    private long durationMs;

    /**
     * 전체 메시지
     */
    private String message;

    /**
     * 에러 메시지 목록
     */
    @Builder.Default
    private List<String> errors = new ArrayList<>();

    /**
     * 경고 메시지 목록
     */
    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    /**
     * 동기화 타입 (DB_TO_SHEET, SHEET_TO_DB)
     */
    private String syncType;

    /**
     * 스프레드시트 ID
     */
    private String spreadsheetId;

    /**
     * 판매자 ID
     */
    private Long sellerId;

    /**
     * 에러 메시지 추가
     */
    public void addError(String error) {
        if (errors == null) {
            errors = new ArrayList<>();
        }
        errors.add(error);
        failureCount++;
    }

    /**
     * 경고 메시지 추가
     */
    public void addWarning(String warning) {
        if (warnings == null) {
            warnings = new ArrayList<>();
        }
        warnings.add(warning);
    }

    /**
     * 성공 카운트 증가
     */
    public void incrementSuccess() {
        successCount++;
    }

    /**
     * 동기화 완료 처리 (종료 시각 및 소요 시간 계산)
     */
    public void complete() {
        this.endTime = LocalDateTime.now();
        if (this.startTime != null && this.endTime != null) {
            this.durationMs = java.time.Duration.between(startTime, endTime).toMillis();
        }
        this.success = (failureCount == 0);
    }
}
