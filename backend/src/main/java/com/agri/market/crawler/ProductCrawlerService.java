package com.agri.market.crawler;

import com.agri.market.file.FileStorageService;
import com.agri.market.product.Product;
import com.agri.market.product.ProductImage;
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
import java.math.RoundingMode;
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
            // 1단계: 메인 페이지에서 상품 링크 수집
            Document mainPage = Jsoup.connect(config.getTargetUrl())
                    .userAgent(config.getUserAgent())
                    .timeout(config.getTimeout())
                    .get();

            Elements productLinks = mainPage.select("a[href^='/Goods/Detail/']");
            logger.info("발견된 상품 링크 수: {}", productLinks.size());

            // 중복 제거
            List<String> uniqueLinks = new ArrayList<>();
            for (Element link : productLinks) {
                String href = link.attr("href");
                if (!uniqueLinks.contains(href)) {
                    uniqueLinks.add(href);
                }
            }

            logger.info("고유 상품 수: {}", uniqueLinks.size());

            // 2단계: 각 상품 상세 페이지 방문
            for (String productUrl : uniqueLinks) {
                try {
                    Thread.sleep(config.getRequestDelay()); // Rate limiting

                    String fullUrl = "https://www.onong.co.kr" + productUrl;
                    logger.debug("상품 페이지 방문: {}", fullUrl);

                    Product product = crawlProductDetailPage(fullUrl);

                    if (product != null && isValidProduct(product)) {
                        logger.info("✓ 상품 검증 성공 - 이름: {}, 가격: {}", product.getName(), product.getPrice());
                        // 중복 체크 (상품명으로)
                        if (!productRepository.existsByName(product.getName())) {
                            logger.info("DB에 저장 시도 중...");
                            productRepository.save(product);
                            result.incrementSuccess();
                            logger.info("✓ 상품 저장 완료: {}", product.getName());
                        } else {
                            logger.info("이미 존재하는 상품 건너뜀: {}", product.getName());
                            result.incrementSkipped();
                        }
                    } else {
                        if (product == null) {
                            logger.error("✗ 상품 객체가 null");
                        } else {
                            logger.error("✗ 상품 검증 실패 - 이름: {}, 가격: {}", product.getName(), product.getPrice());
                        }
                        result.incrementFailed();
                    }

                } catch (Exception e) {
                    logger.error("상품 처리 중 오류 발생: {}", productUrl, e);
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

    private Product crawlProductDetailPage(String url) throws IOException {
        logger.info("=== 상세 페이지 크롤링 시작: {} ===", url);

        Document detailPage = Jsoup.connect(url)
                .userAgent(config.getUserAgent())
                .timeout(config.getTimeout())
                .get();

        Product product = new Product();

        // 상품명 추출: 여러 선택자 시도
        Element nameElement = detailPage.selectFirst("h3.prod-title");
        logger.info("h3.prod-title 시도: {}", nameElement != null ? nameElement.text() : "없음");

        if (nameElement == null) {
            nameElement = detailPage.selectFirst("span.title.text-break");
            logger.info("span.title.text-break 시도: {}", nameElement != null ? nameElement.text() : "없음");
        }
        if (nameElement == null) {
            nameElement = detailPage.selectFirst("h1");
            logger.info("h1 시도: {}", nameElement != null ? nameElement.text() : "없음");
        }
        if (nameElement != null) {
            product.setName(nameElement.text().trim());
            logger.info("✓ 상품명 추출 성공: {}", product.getName());
        } else {
            logger.error("✗ 상품명 추출 실패");
        }

        // 메인 이미지: 여러 선택자 시도
        Element mainImage = detailPage.selectFirst("#detailImgSwiper img");
        logger.info("#detailImgSwiper img 시도: {}", mainImage != null ? mainImage.absUrl("src") : "없음");

        if (mainImage == null) {
            mainImage = detailPage.selectFirst("img#prodImage");
            logger.info("img#prodImage 시도: {}", mainImage != null ? mainImage.absUrl("src") : "없음");
        }
        if (mainImage == null) {
            mainImage = detailPage.selectFirst(".swiper-slide img");
            logger.info(".swiper-slide img 시도: {}", mainImage != null ? mainImage.absUrl("src") : "없음");
        }
        if (mainImage != null) {
            String imageUrl = mainImage.absUrl("src");
            logger.info("✓ 이미지 URL 추출 성공: {}", imageUrl);
            if (!imageUrl.isEmpty() && !imageUrl.contains("noimage")) {
                logger.info("이미지 다운로드 시도 중...");
                String savedImageUrl = downloadAndSaveImage(imageUrl);
                if (savedImageUrl != null) {
                    product.setImageUrl(savedImageUrl);

                    // 정규화: ProductImage 엔티티로 저장
                    ProductImage productImage = new ProductImage();
                    productImage.setImageUrl(savedImageUrl);
                    productImage.setImageType(ProductImage.ImageType.MAIN);
                    productImage.setDisplayOrder(0);
                    product.addImage(productImage);

                    logger.info("✓ 이미지 저장 성공: {}", savedImageUrl);
                }
            }
        } else {
            logger.error("✗ 이미지 추출 실패");
        }

        // 가격 및 할인 정보 추출
        logger.info("가격 정보 추출 시작...");
        extractPriceAndDiscount(detailPage, product);
        logger.info("추출된 가격: {}, 할인율: {}%", product.getPrice(), product.getDiscountRate());

        // 상품 설명: detail-summary 텍스트 + 상세 이미지들 HTML로 구성
        StringBuilder descriptionHtml = new StringBuilder();

        Element summaryElement = detailPage.selectFirst("p.detail-summary");
        if (summaryElement != null) {
            descriptionHtml.append("<p>").append(summaryElement.text().trim()).append("</p>");
            logger.info("✓ 상품 요약 추출: {}", summaryElement.text().trim());
        }

        // 상세 이미지들 추출 (userfiles 경로의 이미지들, 마지막 이미지 제외)
        Elements detailImages = detailPage.select("img[src*='userfiles'], img[data-src*='userfiles']");
        logger.info("상세 이미지 개수: {}", detailImages.size());

        int downloadedCount = 0;
        // 마지막 이미지 제외 (마지막 이미지는 불필요한 이미지)
        int imagesToProcess = detailImages.size() > 0 ? detailImages.size() - 1 : 0;
        for (int i = 0; i < imagesToProcess; i++) {
            Element imgElement = detailImages.get(i);
            String imgUrl = imgElement.absUrl("src");
            if (imgUrl.isEmpty()) {
                imgUrl = imgElement.absUrl("data-src");
            }

            if (!imgUrl.isEmpty() && !imgUrl.contains("noimage")) {
                logger.info("상세 이미지 다운로드 시도: {}", imgUrl);
                String savedImgUrl = downloadAndSaveImage(imgUrl);
                if (savedImgUrl != null) {
                    descriptionHtml.append("<img src=\"").append(savedImgUrl).append("\" style=\"max-width:100%;\" />");

                    // 정규화: ProductImage 엔티티로 저장
                    ProductImage detailImage = new ProductImage();
                    detailImage.setImageUrl(savedImgUrl);
                    detailImage.setImageType(ProductImage.ImageType.DETAIL);
                    detailImage.setDisplayOrder(downloadedCount + 1); // 메인 이미지가 0이므로 1부터 시작
                    product.addImage(detailImage);

                    downloadedCount++;
                    logger.info("✓ 상세 이미지 저장 완료: {}", savedImgUrl);
                }
            }
        }

        logger.info("✓ 총 {}개의 상세 이미지 다운로드 완료 (마지막 이미지 제외)", downloadedCount);

        if (descriptionHtml.length() > 0) {
            product.setDescription(descriptionHtml.toString());
        } else if (product.getName() != null) {
            product.setDescription(product.getName());
            logger.info("상품 설명을 상품명으로 설정");
        }

        // 기본값 설정
        if (product.getCategory() == null) {
            product.setCategory("농수산물");
        }
        if (product.getOrigin() == null) {
            product.setOrigin("국내산");
        }
        if (product.getStock() == null) {
            product.setStock(100);
        }

        return product;
    }

    private void extractPriceAndDiscount(Document doc, Product product) {
        // 할인율 추출: 여러 선택자 시도
        Element discountElement = doc.selectFirst("span.discount-percent");
        logger.info("span.discount-percent 시도: {}", discountElement != null ? discountElement.text() : "없음");

        if (discountElement == null) {
            discountElement = doc.selectFirst("span.discount.text-danger");
            logger.info("span.discount.text-danger 시도: {}", discountElement != null ? discountElement.text() : "없음");
        }
        if (discountElement == null) {
            discountElement = doc.selectFirst(".discount-rate");
            logger.info(".discount-rate 시도: {}", discountElement != null ? discountElement.text() : "없음");
        }

        if (discountElement != null) {
            String discountText = discountElement.text().replaceAll("[^0-9]", "");
            if (!discountText.isEmpty()) {
                try {
                    BigDecimal discountRate = new BigDecimal(discountText);
                    product.setDiscountRate(discountRate);
                    logger.info("✓ 할인율 추출 성공: {}%", discountRate);
                } catch (NumberFormatException e) {
                    logger.error("할인율 파싱 실패: {}", discountText);
                }
            }
        }

        // 가격 정보: JavaScript 변수에서 추출 (최우선)
        String pageHtml = doc.html();
        Pattern jsVarPattern = Pattern.compile("var m_amt\\s*=\\s*['\"]([0-9]+)['\"]");
        Matcher jsVarMatcher = jsVarPattern.matcher(pageHtml);

        boolean priceFound = false;

        if (jsVarMatcher.find()) {
            try {
                String priceStr = jsVarMatcher.group(1);
                BigDecimal price = new BigDecimal(priceStr);
                product.setPrice(price);
                logger.info("✓ JavaScript 변수에서 가격 추출 성공: {}원", price);
                priceFound = true;
            } catch (Exception e) {
                logger.error("JavaScript 변수 가격 파싱 실패", e);
            }
        } else {
            logger.info("JavaScript 변수 m_amt를 찾을 수 없음");
        }

        // JavaScript 변수에서 찾았으면 종료
        if (priceFound) {
            return;
        }

        // JSON-LD 스키마에서 추출 시도
        Elements scriptTags = doc.select("script[type=\"application/ld+json\"]");
        for (Element scriptTag : scriptTags) {
            String jsonContent = scriptTag.html();
            Pattern pricePattern = Pattern.compile("\"price\"\\s*:\\s*([0-9]+)");
            Matcher priceMatcher = pricePattern.matcher(jsonContent);
            if (priceMatcher.find()) {
                try {
                    String priceStr = priceMatcher.group(1);
                    BigDecimal price = new BigDecimal(priceStr);
                    product.setPrice(price);
                    logger.info("✓ JSON-LD 스키마에서 가격 추출 성공: {}원", price);
                    priceFound = true;
                    break;
                } catch (Exception e) {
                    logger.error("JSON-LD 가격 파싱 실패", e);
                }
            }
        }

        if (!priceFound) {
            logger.info("JSON-LD 스키마에서 가격을 찾을 수 없음");
        } else {
            return;
        }

        // 가격 정보: 명시적 선택자 시도
        Element salePriceElement = doc.selectFirst("span.sale-price");
        logger.info("span.sale-price 시도: {}", salePriceElement != null ? salePriceElement.text() : "없음");

        Element originalPriceElement = doc.selectFirst("span.original-price");
        logger.info("span.original-price 시도: {}", originalPriceElement != null ? originalPriceElement.text() : "없음");

        Element goodsPriceElement = doc.selectFirst("#goodsPrice");
        logger.info("#goodsPrice 시도: {}", goodsPriceElement != null ? goodsPriceElement.text() : "없음");

        if (salePriceElement != null) {
            try {
                BigDecimal salePrice = parsePrice(salePriceElement.text());
                product.setPrice(salePrice);
                logger.info("✓ 할인가 추출 성공: {}원", salePrice);
            } catch (Exception e) {
                logger.error("할인가 파싱 실패", e);
            }
        } else if (goodsPriceElement != null && !goodsPriceElement.text().equals("0")) {
            try {
                BigDecimal price = parsePrice(goodsPriceElement.text());
                product.setPrice(price);
                logger.info("✓ 가격 추출 성공: {}원", price);
            } catch (Exception e) {
                logger.error("가격 파싱 실패", e);
            }
        } else {
            logger.info("명시적 가격 선택자 실패, 패턴 매칭 시도...");
            // 가격 정보: 전체 텍스트에서 패턴 매칭 (fallback)
            String pageText = doc.text();
            Pattern pricePattern = Pattern.compile("([0-9,]+)원");
            Matcher matcher = pricePattern.matcher(pageText);

            List<BigDecimal> prices = new ArrayList<>();
            while (matcher.find()) {
                try {
                    BigDecimal price = parsePrice(matcher.group(1));
                    if (price.compareTo(new BigDecimal("100")) > 0) { // 100원 이상만
                        prices.add(price);
                    }
                } catch (Exception e) {
                    // 무시
                }
            }

            // 가격이 여러 개 있으면 작은 값이 할인가
            if (prices.size() >= 2) {
                BigDecimal minPrice = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                product.setPrice(minPrice);
                logger.debug("가격: {}원", minPrice);
            } else if (prices.size() == 1) {
                product.setPrice(prices.get(0));
                logger.debug("가격: {}원", prices.get(0));
            }
        }
    }

    private Product extractProductFromCard(Element card) {
        try {
            Product product = new Product();

            // 전체 텍스트 추출 (디버깅용)
            String fullText = card.text();
            logger.debug("카드 텍스트: {}", fullText);

            // 1. 상품명 추출 - h4, h5 태그 또는 첫 번째 줄
            Element nameElement = card.selectFirst("h4, h5");
            if (nameElement != null && !nameElement.text().trim().isEmpty()) {
                product.setName(nameElement.text().trim());
            } else {
                // h4/h5가 없으면 카드 내 첫 번째 텍스트 라인 사용
                String[] lines = fullText.split("\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (!trimmed.isEmpty() && trimmed.length() > 2) {
                        product.setName(trimmed);
                        break;
                    }
                }
            }

            // 2. 가격 정보 추출 - 텍스트에서 패턴 매칭
            extractPriceFromText(fullText, product);

            // 3. 이미지 추출 및 다운로드
            Element imgElement = card.selectFirst("img");
            if (imgElement != null) {
                String imageUrl = imgElement.absUrl("src");
                if (!imageUrl.isEmpty() && !imageUrl.contains("noimage")) {
                    logger.debug("이미지 URL: {}", imageUrl);
                    String savedImageUrl = downloadAndSaveImage(imageUrl);
                    if (savedImageUrl != null) {
                        product.setImageUrl(savedImageUrl);

                        // 정규화: ProductImage 엔티티로 저장
                        ProductImage productImage = new ProductImage();
                        productImage.setImageUrl(savedImageUrl);
                        productImage.setImageType(ProductImage.ImageType.MAIN);
                        productImage.setDisplayOrder(0);
                        product.addImage(productImage);
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
            if (product.getDescription() == null && product.getName() != null) {
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

    private void extractPriceFromText(String text, Product product) {
        // 모든 가격 패턴 찾기 (숫자,숫자원 형식)
        Pattern pricePattern = Pattern.compile("([0-9,]+)원");
        Matcher matcher = pricePattern.matcher(text);

        List<BigDecimal> prices = new ArrayList<>();
        while (matcher.find()) {
            try {
                BigDecimal price = parsePrice(matcher.group(1));
                prices.add(price);
            } catch (Exception e) {
                logger.debug("가격 파싱 실패: {}", matcher.group(1));
            }
        }

        // 가격이 2개 이상이면 작은 것이 할인가, 큰 것이 정가
        if (prices.size() >= 2) {
            BigDecimal price1 = prices.get(0);
            BigDecimal price2 = prices.get(1);

            // 할인가는 작은 값
            BigDecimal salePrice = price1.min(price2);
            BigDecimal originalPrice = price1.max(price2);

            product.setPrice(salePrice);

            // 할인율 계산
            if (originalPrice.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal discount = originalPrice.subtract(salePrice);
                BigDecimal rate = discount.multiply(new BigDecimal("100"))
                                         .divide(originalPrice, 2, RoundingMode.HALF_UP);
                product.setDiscountRate(rate);
            }
        } else if (prices.size() == 1) {
            product.setPrice(prices.get(0));
        }

        // 할인율 텍스트에서 직접 추출 (더 정확함)
        Pattern ratePattern = Pattern.compile("([0-9]+)%");
        Matcher rateMatcher = ratePattern.matcher(text);
        if (rateMatcher.find()) {
            try {
                BigDecimal discountRate = new BigDecimal(rateMatcher.group(1));
                product.setDiscountRate(discountRate);
            } catch (NumberFormatException e) {
                logger.debug("할인율 파싱 실패");
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
