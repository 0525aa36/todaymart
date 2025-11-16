#!/bin/bash

# ECS Task Definition에 CORS 및 쿠키 환경변수 추가 스크립트

echo "🔧 ECS Task Definition 업데이트 시작..."

# 1. 현재 Task Definition 가져오기
echo "📥 현재 Task Definition 가져오는 중..."
aws ecs describe-task-definition \
  --task-definition korean-agri-shop-backend \
  --region ap-northeast-2 \
  --query 'taskDefinition' \
  --output json > /tmp/current-task-def.json

if [ $? -ne 0 ]; then
  echo "❌ Task Definition 가져오기 실패"
  exit 1
fi

echo "✅ Task Definition 가져오기 완료"

# 2. 필요한 환경변수 추가
echo "🔨 환경변수 업데이트 중..."
jq '.containerDefinitions[0].environment += [
  {"name": "CORS_ALLOWED_ORIGINS", "value": "https://todaymart.co.kr,https://www.todaymart.co.kr"},
  {"name": "COOKIE_SECURE", "value": "true"},
  {"name": "COOKIE_SAME_SITE", "value": "None"}
]' /tmp/current-task-def.json > /tmp/updated-task-def.json

# 3. 불필요한 필드 제거 (새 Task Definition 등록을 위해)
echo "🧹 메타데이터 정리 중..."
jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
  /tmp/updated-task-def.json > /tmp/new-task-def.json

# 4. 새 Task Definition 등록
echo "📤 새 Task Definition 등록 중..."
aws ecs register-task-definition \
  --region ap-northeast-2 \
  --cli-input-json file:///tmp/new-task-def.json

if [ $? -ne 0 ]; then
  echo "❌ Task Definition 등록 실패"
  exit 1
fi

echo "✅ Task Definition 등록 완료"

# 5. ECS 서비스 업데이트 (새 Task Definition 적용)
echo "🔄 ECS 서비스 업데이트 중..."
aws ecs update-service \
  --cluster korean-agri-shop-cluster \
  --service korean-agri-shop-backend-service \
  --task-definition korean-agri-shop-backend \
  --force-new-deployment \
  --region ap-northeast-2

if [ $? -ne 0 ]; then
  echo "❌ ECS 서비스 업데이트 실패"
  exit 1
fi

echo "✅ ECS 서비스 업데이트 완료"

# 6. 정리
rm /tmp/current-task-def.json /tmp/updated-task-def.json /tmp/new-task-def.json

echo ""
echo "🎉 모든 작업이 완료되었습니다!"
echo ""
echo "📋 적용된 환경변수:"
echo "  - CORS_ALLOWED_ORIGINS=https://todaymart.co.kr,https://www.todaymart.co.kr"
echo "  - COOKIE_SECURE=true"
echo "  - COOKIE_SAME_SITE=None"
echo ""
echo "⏳ ECS 태스크가 재시작되는 동안 기다려주세요 (약 2-3분 소요)"
echo "   상태 확인: aws ecs describe-services --cluster korean-agri-shop-cluster --services korean-agri-shop-backend-service --region ap-northeast-2"
