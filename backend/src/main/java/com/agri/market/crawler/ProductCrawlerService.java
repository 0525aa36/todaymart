package com.agri.market.crawler;

import com.agri.market.file.FileStorageService;
import com.agri.market.product.Product;
import com.agri.market.product.ProductRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ProductCrawlerService {

    private static final Logger logger = LoggerFactory.getLogger(ProductCrawlerService.class);

    private final CrawlerConfig config;
    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    public ProductCrawlerService(CrawlerConfig config, ProductRepository productRepository,
                                  FileStorageService fileStorageService) {
        this.config = config;
        this.productRepository = productRepository;
        this.fileStorageService = fileStorageService;
    }

    @Transactional
    public CrawlResult crawlProducts() {
        if (!config.isEnabled()) {
            logger.warn("크롤링이 비활성화되어 있습니다. application.properties에서 crawler.enabled=true로 설정하세요.");
            return new CrawlResult(0, 0, "크롤링이 비활성화되어 있습니다.");
        }

        logger.info("상품 크롤링 시작: {}", config.getTargetUrl());

        CrawlResult result = new CrawlResult();

        try {
            Document doc = Jsoup.connect(config.getTargetUrl())
                    .userAgent(config.getUserAgent())
                    .timeout(config.getTimeout())
                    .get();

            Elements productCards = doc.select(config.getProductCardSelector());
            logger.info("발견된 상품 카드 수: {}", productCards.size());

            for (Element card : productCards) {
                try {
                    Thread.sleep(config.getRequestDelay()); // Rate limiting

                    Product product = extractProductFromCard(card);

                    if (product != null && isValidProduct(product)) {
                        // 중복 체크 (상품명으로)
                        if (!productRepository.existsByName(product.getName())) {
                            productRepository.save(product);
                            result.incrementSuccess();
                            logger.info("상품 저장 완료: {}", product.getName());
                        } else {
                            logger.debug("이미 존재하는 상품: {}", product.getName());
                            result.incrementSkipped();
                        }
                    } else {
                        result.incrementFailed();
                    }

                } catch (Exception e) {
                    logger.error("상품 처리 중 오류 발생", e);
                    result.incrementFailed();
                }
            }

        } catch (IOException e) {
            logger.error("크롤링 중 오류 발생", e);
            result.setMessage("크롤링 실패: " + e.getMessage());
        }

        logger.info("크롤링 완료 - 성공: {}, 실패: {}, 건너뜀: {}",
                    result.getSuccessCount(), result.getFailedCount(), result.getSkippedCount());

        return result;
    }

    private Product extractProductFromCard(Element card) {
        try {
            Product product = new Product();

            // 상품명 추출
            Element nameElement = card.selectFirst(config.getProductNameSelector());
            if (nameElement != null) {
                product.setName(nameElement.text().trim());
            }

            // 가격 정보 추출
            extractPriceInfo(card, product);

            // 이미지 추출 및 다운로드
            Element imgElement = card.selectFirst(config.getImageSelector());
            if (imgElement != null) {
                String imageUrl = imgElement.absUrl("src");
                if (!imageUrl.isEmpty() && !imageUrl.contains("noimage")) {
                    String savedImageUrl = downloadAndSaveImage(imageUrl);
                    if (savedImageUrl != null) {
                        product.setImageUrl(savedImageUrl);
                        product.setImageUrls(savedImageUrl);
                    }
                }
            }

            // 기본값 설정
            if (product.getCategory() == null) {
                product.setCategory("농수산물");
            }
            if (product.getOrigin() == null) {
                product.setOrigin("국내산");
            }
            if (product.getDescription() == null) {
                product.setDescription(product.getName());
            }
            if (product.getStock() == null) {
                product.setStock(100); // 기본 재고
            }

            return product;

        } catch (Exception e) {
            logger.error("상품 정보 추출 실패", e);
            return null;
        }
    }

    private void extractPriceInfo(Element card, Product product) {
        // 할인가 추출
        Element discountPriceElement = card.selectFirst(config.getDiscountPriceSelector());
        String priceText = null;

        if (discountPriceElement != null) {
            priceText = discountPriceElement.text();
        } else {
            // 할인가가 없으면 일반 가격 텍스트에서 추출
            String cardText = card.text();
            Pattern pricePattern = Pattern.compile("([0-9,]+)원");
            Matcher matcher = pricePattern.matcher(cardText);
            if (matcher.find()) {
                priceText = matcher.group(1);
            }
        }

        if (priceText != null) {
            BigDecimal price = parsePrice(priceText);
            product.setPrice(price);
        }

        // 할인율 추출
        Element discountRateElement = card.selectFirst(config.getDiscountRateSelector());
        if (discountRateElement != null) {
            String rateText = discountRateElement.text().replaceAll("[^0-9.]", "");
            try {
                BigDecimal discountRate = new BigDecimal(rateText);
                product.setDiscountRate(discountRate);
            } catch (NumberFormatException e) {
                logger.debug("할인율 파싱 실패: {}", rateText);
            }
        } else {
            // 텍스트에서 할인율 추출 시도
            String cardText = card.text();
            Pattern ratePattern = Pattern.compile("([0-9]+)%");
            Matcher matcher = ratePattern.matcher(cardText);
            if (matcher.find()) {
                try {
                    BigDecimal discountRate = new BigDecimal(matcher.group(1));
                    product.setDiscountRate(discountRate);
                } catch (NumberFormatException e) {
                    logger.debug("할인율 파싱 실패");
                }
            }
        }
    }

    private BigDecimal parsePrice(String priceText) {
        String cleanPrice = priceText.replaceAll("[^0-9]", "");
        return new BigDecimal(cleanPrice);
    }

    private String downloadAndSaveImage(String imageUrl) {
        try {
            logger.debug("이미지 다운로드 시작: {}", imageUrl);

            URL url = new URL(imageUrl);
            String fileName = generateImageFileName(imageUrl);
            Path targetPath = fileStorageService.loadFile(fileName);

            try (InputStream in = url.openStream()) {
                Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            String savedUrl = "http://localhost:8081/api/files/" + fileName;
            logger.debug("이미지 저장 완료: {}", savedUrl);
            return savedUrl;

        } catch (Exception e) {
            logger.error("이미지 다운로드 실패: {}", imageUrl, e);
            return null;
        }
    }

    private String generateImageFileName(String imageUrl) {
        String extension = ".jpg";

        // URL에서 확장자 추출
        if (imageUrl.contains(".png")) {
            extension = ".png";
        } else if (imageUrl.contains(".jpeg")) {
            extension = ".jpeg";
        } else if (imageUrl.contains(".webp")) {
            extension = ".webp";
        }

        return System.currentTimeMillis() + "_" +
               Math.abs(imageUrl.hashCode()) + extension;
    }

    private boolean isValidProduct(Product product) {
        return product.getName() != null &&
               !product.getName().isEmpty() &&
               product.getPrice() != null &&
               product.getPrice().compareTo(BigDecimal.ZERO) > 0;
    }

    // 크롤링 결과 DTO
    public static class CrawlResult {
        private int successCount = 0;
        private int failedCount = 0;
        private int skippedCount = 0;
        private String message = "크롤링 완료";

        public CrawlResult() {}

        public CrawlResult(int success, int failed, String message) {
            this.successCount = success;
            this.failedCount = failed;
            this.message = message;
        }

        public void incrementSuccess() { successCount++; }
        public void incrementFailed() { failedCount++; }
        public void incrementSkipped() { skippedCount++; }

        public int getSuccessCount() { return successCount; }
        public int getFailedCount() { return failedCount; }
        public int getSkippedCount() { return skippedCount; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
