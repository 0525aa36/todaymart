-- Add Google Sheets related columns to sellers table
ALTER TABLE sellers ADD COLUMN spreadsheet_id VARCHAR(200) COMMENT '판매자별 구글 스프레드시트 ID';
ALTER TABLE sellers ADD COLUMN update_schedule_time TIME COMMENT '자동 업데이트 시간 (예: 23:00:00)';
ALTER TABLE sellers ADD COLUMN last_synced_at TIMESTAMP NULL COMMENT '마지막 동기화 시간';

-- Create Google Sheets sync log table
CREATE TABLE google_sheets_sync_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT,
    sync_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL COMMENT 'SUCCESS, FAILED',
    rows_updated INT DEFAULT 0 COMMENT '업데이트된 행 수',
    error_message TEXT COMMENT '오류 메시지 (실패 시)',
    triggered_by VARCHAR(50) COMMENT 'MANUAL, SCHEDULED, ADMIN',
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    INDEX idx_seller_sync (seller_id, sync_time DESC),
    INDEX idx_status (status),
    INDEX idx_sync_time (sync_time DESC)
) COMMENT='구글 스프레드시트 동기화 이력';
