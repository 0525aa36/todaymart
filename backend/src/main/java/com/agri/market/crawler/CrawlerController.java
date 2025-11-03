package com.agri.market.crawler;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/crawler")
@PreAuthorize("hasRole('ADMIN')")
public class CrawlerController {

    private final ProductCrawlerService crawlerService;
    private final CrawlerConfig config;

    public CrawlerController(ProductCrawlerService crawlerService, CrawlerConfig config) {
        this.crawlerService = crawlerService;
        this.config = config;
    }

    /**
     * 수동으로 크롤링 실행
     */
    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runCrawler() {
        ProductCrawlerService.CrawlResult result = crawlerService.crawlProducts();

        Map<String, Object> response = new HashMap<>();
        response.put("success", result.getSuccessCount());
        response.put("failed", result.getFailedCount());
        response.put("skipped", result.getSkippedCount());
        response.put("message", result.getMessage());

        return ResponseEntity.ok(response);
    }

    /**
     * 크롤러 설정 조회
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> configMap = new HashMap<>();
        configMap.put("enabled", config.isEnabled());
        configMap.put("targetUrl", config.getTargetUrl());
        configMap.put("requestDelay", config.getRequestDelay());
        configMap.put("timeout", config.getTimeout());

        return ResponseEntity.ok(configMap);
    }

    /**
     * 크롤러 활성화/비활성화
     */
    @PutMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleCrawler(@RequestParam boolean enabled) {
        config.setEnabled(enabled);

        Map<String, Object> response = new HashMap<>();
        response.put("enabled", config.isEnabled());
        response.put("message", enabled ? "크롤러가 활성화되었습니다." : "크롤러가 비활성화되었습니다.");

        return ResponseEntity.ok(response);
    }
}
