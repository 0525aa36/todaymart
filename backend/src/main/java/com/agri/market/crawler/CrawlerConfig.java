package com.agri.market.crawler;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

@Component
@ConfigurationProperties(prefix = "crawler")
@Getter
@Setter
public class CrawlerConfig {

    private String targetUrl = "https://www.onong.co.kr/";
    private int requestDelay = 2000; // 요청 간 딜레이 (밀리초)
    private int timeout = 10000; // 타임아웃 (밀리초)
    private String userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    private boolean enabled = false; // 기본적으로 비활성화

    // 셀렉터 설정 (나중에 properties에서 설정 가능)
    private String productCardSelector = "a[href^='/Goods/Detail/']";
    private String productNameSelector = "h4, h5";
    private String originalPriceSelector = ".original-price, del";
    private String discountPriceSelector = ".discount-price, .sale-price";
    private String discountRateSelector = ".discount-rate";
    private String imageSelector = "img";
}
