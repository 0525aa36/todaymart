package com.agri.market.crawler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class CrawlerScheduler {

    private static final Logger logger = LoggerFactory.getLogger(CrawlerScheduler.class);

    private final ProductCrawlerService crawlerService;
    private final CrawlerConfig config;

    public CrawlerScheduler(ProductCrawlerService crawlerService, CrawlerConfig config) {
        this.crawlerService = crawlerService;
        this.config = config;
    }

    // 매일 새벽 2시에 실행 (크론 표현식: 초 분 시 일 월 요일)
    @Scheduled(cron = "0 0 2 * * ?")
    public void scheduledCrawl() {
        if (!config.isEnabled()) {
            logger.debug("크롤링 스케줄러가 비활성화되어 있습니다.");
            return;
        }

        logger.info("예약된 크롤링 작업 시작");
        try {
            ProductCrawlerService.CrawlResult result = crawlerService.crawlProducts();
            logger.info("예약된 크롤링 완료 - 성공: {}, 실패: {}, 건너뜀: {}",
                       result.getSuccessCount(), result.getFailedCount(), result.getSkippedCount());
        } catch (Exception e) {
            logger.error("예약된 크롤링 작업 실패", e);
        }
    }
}
