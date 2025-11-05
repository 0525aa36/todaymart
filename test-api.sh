#!/bin/bash

# 한국 농산물 쇼핑몰 API 테스트 스크립트
# 사용법: ./test-api.sh [test_name]
# 예시: ./test-api.sh login
#       ./test-api.sh all

set -e  # 에러 발생 시 스크립트 중단

BASE_URL="http://localhost:8081"
ADMIN_EMAIL="test@test.com"
ADMIN_PASSWORD="password123"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 토큰 저장 변수
TOKEN=""

# 헬퍼 함수: API 호출 및 결과 출력
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}[API TEST]${NC} $method $endpoint"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    local curl_cmd="curl -s -X $method \"$BASE_URL$endpoint\" -H 'Content-Type: application/json'"

    if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $TOKEN'"
    fi

    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi

    local response=$(eval $curl_cmd)
    local status=$?

    if [ $status -eq 0 ]; then
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        echo -e "\n${GREEN}✓ 성공${NC}\n"

        # 로그인 응답에서 토큰 추출
        if [[ "$endpoint" == *"/auth/login"* ]]; then
            TOKEN=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('token', ''))" 2>/dev/null)
            if [ -n "$TOKEN" ]; then
                echo -e "${GREEN}토큰 저장 완료${NC}"
            fi
        fi

        return 0
    else
        echo -e "${RED}✗ 실패 (HTTP Error)${NC}\n"
        return 1
    fi
}

# 테스트 함수들
test_login() {
    echo -e "\n${YELLOW}========== 1. 로그인 테스트 ==========${NC}\n"
    api_call "POST" "/api/auth/login" "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}"
}

test_products_list() {
    echo -e "\n${YELLOW}========== 2. 상품 목록 조회 테스트 ==========${NC}\n"
    api_call "GET" "/api/products?page=0&size=5"
}

test_product_detail() {
    echo -e "\n${YELLOW}========== 3. 상품 상세 조회 테스트 ==========${NC}\n"
    api_call "GET" "/api/products/63"
}

test_product_options() {
    echo -e "\n${YELLOW}========== 4. 상품 옵션 조회 테스트 ==========${NC}\n"
    api_call "GET" "/api/products/63/options/public"
}

test_cart() {
    echo -e "\n${YELLOW}========== 5. 장바구니 테스트 ==========${NC}\n"

    # 장바구니 조회
    echo -e "${BLUE}5.1 장바구니 조회${NC}"
    api_call "GET" "/api/cart" "" "true"

    sleep 1

    # 장바구니에 상품 추가
    echo -e "${BLUE}5.2 장바구니에 상품 추가${NC}"
    api_call "POST" "/api/cart/items" "{\"productId\":63,\"quantity\":2}" "true"
}

test_orders() {
    echo -e "\n${YELLOW}========== 6. 주문 테스트 ==========${NC}\n"

    # 주문 목록 조회
    echo -e "${BLUE}6.1 내 주문 목록 조회${NC}"
    api_call "GET" "/api/orders" "" "true"
}

test_admin_dashboard() {
    echo -e "\n${YELLOW}========== 7. 관리자 대시보드 테스트 ==========${NC}\n"
    api_call "GET" "/api/admin/dashboard/stats" "" "true"
}

test_admin_orders() {
    echo -e "\n${YELLOW}========== 8. 관리자 주문 조회 테스트 ==========${NC}\n"
    api_call "GET" "/api/admin/orders?page=0&size=5" "" "true"
}

test_admin_products() {
    echo -e "\n${YELLOW}========== 9. 관리자 상품 조회 테스트 ==========${NC}\n"
    api_call "GET" "/api/admin/products?page=0&size=5" "" "true"
}

test_search() {
    echo -e "\n${YELLOW}========== 10. 상품 검색 테스트 ==========${NC}\n"
    api_call "GET" "/api/products/search?keyword=밤"
}

test_wishlist() {
    echo -e "\n${YELLOW}========== 11. 위시리스트 테스트 ==========${NC}\n"
    api_call "GET" "/api/wishlist" "" "true"
}

test_user_profile() {
    echo -e "\n${YELLOW}========== 12. 사용자 프로필 테스트 ==========${NC}\n"
    api_call "GET" "/api/users/me" "" "true"
}

test_reviews() {
    echo -e "\n${YELLOW}========== 13. 리뷰 조회 테스트 ==========${NC}\n"
    api_call "GET" "/api/reviews/product/63?page=0&size=5"
}

# 전체 테스트 실행
test_all() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║       한국 농산물 쇼핑몰 API 전체 테스트 시작            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    # 먼저 로그인하여 토큰 획득
    test_login

    # 공개 API 테스트
    test_products_list
    test_product_detail
    test_product_options
    test_search
    test_reviews

    # 인증 필요 API 테스트
    if [ -n "$TOKEN" ]; then
        test_cart
        test_orders
        test_wishlist
        test_user_profile

        # 관리자 API 테스트
        test_admin_dashboard
        test_admin_orders
        test_admin_products
    else
        echo -e "${RED}토큰이 없어 인증 필요 API를 테스트할 수 없습니다${NC}"
    fi

    echo -e "\n${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              전체 테스트 완료!                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# 빠른 테스트 (핵심 기능만)
test_quick() {
    echo -e "${GREEN}빠른 테스트 모드 (핵심 기능만)${NC}\n"

    test_login
    test_products_list

    if [ -n "$TOKEN" ]; then
        test_cart
        test_admin_orders
    fi
}

# 도움말 출력
show_help() {
    echo "사용법: ./test-api.sh [command]"
    echo ""
    echo "Commands:"
    echo "  all              - 모든 API 테스트 실행"
    echo "  quick            - 빠른 테스트 (핵심 기능만)"
    echo "  login            - 로그인 테스트"
    echo "  products         - 상품 목록 테스트"
    echo "  product-detail   - 상품 상세 테스트"
    echo "  product-options  - 상품 옵션 테스트"
    echo "  cart             - 장바구니 테스트"
    echo "  orders           - 주문 테스트"
    echo "  admin-dashboard  - 관리자 대시보드 테스트"
    echo "  admin-orders     - 관리자 주문 조회 테스트"
    echo "  admin-products   - 관리자 상품 조회 테스트"
    echo "  search           - 상품 검색 테스트"
    echo "  wishlist         - 위시리스트 테스트"
    echo "  profile          - 사용자 프로필 테스트"
    echo "  reviews          - 리뷰 조회 테스트"
    echo ""
    echo "예시:"
    echo "  ./test-api.sh all              # 전체 테스트"
    echo "  ./test-api.sh quick            # 빠른 테스트"
    echo "  ./test-api.sh login            # 로그인만 테스트"
    echo "  ./test-api.sh cart             # 장바구니만 테스트"
}

# 메인 실행
case "${1:-all}" in
    all)
        test_all
        ;;
    quick)
        test_quick
        ;;
    login)
        test_login
        ;;
    products)
        test_products_list
        ;;
    product-detail)
        test_product_detail
        ;;
    product-options)
        test_product_options
        ;;
    cart)
        test_login
        test_cart
        ;;
    orders)
        test_login
        test_orders
        ;;
    admin-dashboard)
        test_login
        test_admin_dashboard
        ;;
    admin-orders)
        test_login
        test_admin_orders
        ;;
    admin-products)
        test_login
        test_admin_products
        ;;
    search)
        test_search
        ;;
    wishlist)
        test_login
        test_wishlist
        ;;
    profile)
        test_login
        test_user_profile
        ;;
    reviews)
        test_reviews
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}알 수 없는 명령어: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
