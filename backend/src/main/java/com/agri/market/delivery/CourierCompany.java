package com.agri.market.delivery;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Optional;

/**
 * 택배사 코드 열거형
 * 스마트택배 API에서 사용하는 택배사 코드를 정의합니다.
 */
@Getter
@RequiredArgsConstructor
public enum CourierCompany {
    // 주요 택배사
    CJ_LOGISTICS("04", "CJ대한통운"),
    HANJIN("05", "한진택배"),
    LOGEN("06", "로젠택배"),
    LOTTE("08", "롯데택배"),
    POST_OFFICE("01", "우체국택배"),

    // 기타 택배사
    KYUNGDONG("23", "경동택배"),
    DAESIN("22", "대신택배"),
    ILYANG("11", "일양로지스"),
    KUNYOUNG("18", "건영택배"),
    HANJIN_EXPRESS("16", "한진특급"),
    CVS_NET("40", "편의점택배"),
    CU_POST("46", "CU 편의점택배"),
    GS_POSTBOX("24", "GS Postbox 택배"),

    // 국제 택배
    EMS("12", "EMS"),
    DHL("13", "DHL"),
    FEDEX("21", "FedEx"),
    UPS("14", "UPS"),

    // 퀵/화물 서비스
    GOGOEX("36", "고고택배"),
    HOMEPICK("54", "홈픽"),
    CVSNET_QUICK("56", "CVSNet 편의점택배");

    private final String code;
    private final String name;

    /**
     * 코드로 택배사 찾기
     */
    public static Optional<CourierCompany> findByCode(String code) {
        return Arrays.stream(values())
                .filter(c -> c.getCode().equals(code))
                .findFirst();
    }

    /**
     * 이름으로 택배사 찾기
     */
    public static Optional<CourierCompany> findByName(String name) {
        return Arrays.stream(values())
                .filter(c -> c.getName().equals(name))
                .findFirst();
    }

    /**
     * 이름에 포함된 문자열로 택배사 찾기
     */
    public static Optional<CourierCompany> findByNameContaining(String keyword) {
        return Arrays.stream(values())
                .filter(c -> c.getName().contains(keyword))
                .findFirst();
    }
}
