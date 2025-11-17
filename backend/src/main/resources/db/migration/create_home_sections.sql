-- Home Sections table for dynamic homepage management
CREATE TABLE IF NOT EXISTS home_sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    section_type VARCHAR(50) NOT NULL COMMENT 'Type of section: BANNER, SPECIAL_DEAL, MD_PICK, RANKING, NEW_ARRIVAL, CATEGORY, CUSTOM',
    title VARCHAR(255) COMMENT 'Section title displayed to users',
    description TEXT COMMENT 'Section description or subtitle',
    display_order INT NOT NULL DEFAULT 0 COMMENT 'Order in which section appears on homepage (0 = first)',
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether section is currently visible on homepage',
    config JSON COMMENT 'JSON configuration specific to section type',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_section_type (section_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Dynamic homepage section management';

-- Insert default sections based on current homepage layout
INSERT INTO home_sections (section_type, title, description, display_order, is_active, config) VALUES
('BANNER', '메인 배너', '홈페이지 상단 배너 캐러셀', 0, TRUE, '{"autoPlay": true, "interval": 5000}'),
('SPECIAL_DEAL', '이번 주 특가', '주간 특별 할인 상품', 1, TRUE, '{"maxProducts": 10, "showTimer": true}'),
('MD_PICK', 'MD 추천', 'MD가 엄선한 상품', 2, TRUE, '{"limit": 10}'),
('RANKING', '실시간 인기 랭킹', '지금 인기있는 상품', 3, TRUE, '{"limit": 10, "showRank": true}'),
('NEW_ARRIVAL', '신상품', '이번 주 새로 입고된 상품', 4, TRUE, '{"limit": 10}'),
('CATEGORY', '채소', '신선한 채소', 5, TRUE, '{"category": "채소", "limit": 10}'),
('CATEGORY', '과일', '달콤한 과일', 6, TRUE, '{"category": "과일", "limit": 10}'),
('CATEGORY', '수산물', '신선한 수산물', 7, TRUE, '{"category": "수산물", "limit": 10}'),
('CATEGORY', '축산물', '품질 좋은 축산물', 8, TRUE, '{"category": "축산물", "limit": 10}');
