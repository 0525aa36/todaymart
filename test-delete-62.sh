#!/bin/bash
# Test product delete functionality with product that has no orders

echo "=== Product 62 삭제 테스트 (주문 내역 없음) ==="
echo ""

echo "1. 로그인 중..."
TOKEN=$(curl -s -X POST "http://localhost:8081/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('token',''))")

echo "2. Product 62 삭제 시도 (주문이 없는 상품)..."
echo ""
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "http://localhost:8081/api/admin/products/62" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

echo ""
if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ 삭제 성공!"
else
  echo "✗ 삭제 실패 (Status: $HTTP_CODE)"
fi
