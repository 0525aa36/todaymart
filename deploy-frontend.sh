#!/bin/bash

# Frontend 빌드 및 배포 스크립트
cd /home/jaemin/korean-agri-shop/frontend

# 의존성 설치
npm install

# 빌드
NEXT_PUBLIC_API_URL=http://korean-agri-shop-alb-1602964285.ap-northeast-2.elb.amazonaws.com npm run build

# 빌드 파일을 S3에 업로드하기 위한 준비
cd .next
zip -r ../frontend-build.zip .
cd ..

echo "빌드 완료: frontend-build.zip"
echo "Amplify 콘솔에서 수동 배포하거나 GitHub 연결을 완료하세요."
