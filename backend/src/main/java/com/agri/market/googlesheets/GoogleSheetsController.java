package com.agri.market.googlesheets;

import com.agri.market.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/admin/sheets")
@PreAuthorize("hasRole('ADMIN')")
@ConditionalOnProperty(name = "google.sheets.enabled", havingValue = "true")
public class GoogleSheetsController {

    @Autowired(required = false)
    private GoogleSheetsService googleSheetsService;

    private final GoogleSheetsSyncLogRepository syncLogRepository;

    public GoogleSheetsController(GoogleSheetsSyncLogRepository syncLogRepository) {
        this.syncLogRepository = syncLogRepository;
    }

    /**
     * 전체 판매자 동기화 (관리자용)
     */
    @PostMapping("/sync-all")
    public ResponseEntity<?> syncAllSellers() {
        if (googleSheetsService == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Google Sheets 서비스가 활성화되어 있지 않습니다."));
        }

        try {
            googleSheetsService.syncAllSellers(GoogleSheetsSyncLog.TriggerType.ADMIN);
            return ResponseEntity.ok(ApiResponse.success("모든 판매자의 주문 내역이 동기화되었습니다.", null));
        } catch (Exception e) {
            log.error("Failed to sync all sellers", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("동기화 실패: " + e.getMessage()));
        }
    }

    /**
     * 특정 판매자 동기화
     */
    @PostMapping("/sync/{sellerId}")
    public ResponseEntity<?> syncSeller(@PathVariable Long sellerId) {
        if (googleSheetsService == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Google Sheets 서비스가 활성화되어 있지 않습니다."));
        }

        try {
            googleSheetsService.syncSellerOrders(sellerId, GoogleSheetsSyncLog.TriggerType.ADMIN);
            return ResponseEntity.ok(ApiResponse.success("판매자의 주문 내역이 동기화되었습니다.", null));
        } catch (Exception e) {
            log.error("Failed to sync seller: " + sellerId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("동기화 실패: " + e.getMessage()));
        }
    }

    /**
     * 마지막 동기화 상태 조회
     */
    @GetMapping("/last-sync")
    public ResponseEntity<?> getLastSyncStatus() {
        try {
            List<GoogleSheetsSyncLog> allLogs = syncLogRepository.findAllSyncLogs();

            Map<String, Object> response = new HashMap<>();
            if (!allLogs.isEmpty()) {
                GoogleSheetsSyncLog lastLog = allLogs.get(0);
                response.put("lastSyncTime", lastLog.getSyncTime());
                response.put("status", lastLog.getStatus());
                response.put("triggeredBy", lastLog.getTriggeredBy());
                response.put("rowsUpdated", lastLog.getRowsUpdated());
                if (lastLog.getErrorMessage() != null) {
                    response.put("errorMessage", lastLog.getErrorMessage());
                }
            } else {
                response.put("lastSyncTime", null);
                response.put("status", "NEVER_SYNCED");
            }

            return ResponseEntity.ok(ApiResponse.success("동기화 상태 조회 성공", response));
        } catch (Exception e) {
            log.error("Failed to get last sync status", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("상태 조회 실패: " + e.getMessage()));
        }
    }

    /**
     * 특정 판매자의 마지막 동기화 상태 조회
     */
    @GetMapping("/last-sync/{sellerId}")
    public ResponseEntity<?> getSellerLastSyncStatus(@PathVariable Long sellerId) {
        try {
            Optional<GoogleSheetsSyncLog> lastLog = syncLogRepository.findTopBySellerIdOrderBySyncTimeDesc(sellerId);

            Map<String, Object> response = new HashMap<>();
            if (lastLog.isPresent()) {
                GoogleSheetsSyncLog log = lastLog.get();
                response.put("lastSyncTime", log.getSyncTime());
                response.put("status", log.getStatus());
                response.put("triggeredBy", log.getTriggeredBy());
                response.put("rowsUpdated", log.getRowsUpdated());
                if (log.getErrorMessage() != null) {
                    response.put("errorMessage", log.getErrorMessage());
                }
            } else {
                response.put("lastSyncTime", null);
                response.put("status", "NEVER_SYNCED");
            }

            return ResponseEntity.ok(ApiResponse.success("동기화 상태 조회 성공", response));
        } catch (Exception e) {
            log.error("Failed to get seller last sync status: " + sellerId, e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("상태 조회 실패: " + e.getMessage()));
        }
    }

    /**
     * 동기화 이력 조회
     */
    @GetMapping("/sync-logs")
    public ResponseEntity<?> getSyncLogs(
            @RequestParam(required = false) Long sellerId,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<GoogleSheetsSyncLog> logs;
            if (sellerId != null) {
                logs = syncLogRepository.findBySellerIdOrderBySyncTimeDesc(sellerId).stream()
                        .limit(limit)
                        .toList();
            } else {
                logs = syncLogRepository.findAllSyncLogs().stream()
                        .limit(limit)
                        .toList();
            }

            return ResponseEntity.ok(ApiResponse.success("동기화 이력 조회 성공", logs));
        } catch (Exception e) {
            log.error("Failed to get sync logs", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("이력 조회 실패: " + e.getMessage()));
        }
    }
}
