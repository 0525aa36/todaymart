#!/bin/bash
# Test product delete functionality

echo "1. 로그인 중..."
TOKEN=$(curl -s -X POST "http://localhost:8081/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin).get('token',''))")

echo "2. Product 64 삭제 시도 (주문이 있는 상품)..."
echo ""
curl -s -X DELETE "http://localhost:8081/api/admin/products/64" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  | python3 -m json.tool

echo ""
echo "3. Done!"
