package com.agri.market.googlesheets;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(name = "google.sheets.sync.enabled", havingValue = "true")
public class GoogleSheetsScheduler {

    @Autowired(required = false)
    private GoogleSheetsService googleSheetsService;

    /**
     * 매일 자정에 모든 판매자의 주문 내역 동기화
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "${google.sheets.sync.cron:0 0 0 * * ?}")
    public void scheduledSync() {
        if (googleSheetsService == null) {
            log.warn("Google Sheets service is not available for scheduled sync");
            return;
        }

        log.info("Starting scheduled Google Sheets sync");
        try {
            googleSheetsService.syncAllSellers(GoogleSheetsSyncLog.TriggerType.SCHEDULED);
            log.info("Scheduled Google Sheets sync completed successfully");
        } catch (Exception e) {
            log.error("Scheduled Google Sheets sync failed", e);
        }
    }
}
