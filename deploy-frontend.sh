#!/bin/bash

# Frontend 빌드 및 배포 스크립트
cd /home/jaemin/korean-agri-shop/frontend

# 의존성 설치
npm install

# 빌드 (HTTPS API URL 사용 - CloudFront를 통한 접근)
NEXT_PUBLIC_API_BASE_URL=https://api.todaymart.co.kr npm run build

# 빌드 파일을 S3에 업로드하기 위한 준비
cd .next
zip -r ../frontend-build.zip .
cd ..

echo "빌드 완료: frontend-build.zip"
echo "Amplify 콘솔에서 수동 배포하거나 GitHub 연결을 완료하세요."
