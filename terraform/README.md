# Korean Agri Shop - AWS 인프라 배포 가이드

이 디렉토리는 Terraform을 사용하여 AWS 인프라를 관리합니다.

## 아키텍처 개요

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────┐
│              Application Load Balancer           │
│          (HTTP/HTTPS - Public Subnets)          │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│            ECS Fargate Service                   │
│         (Spring Boot - Private Subnets)         │
│         Auto Scaling: 1-4 tasks                 │
└─────────────────────────────────────────────────┘
    │                            │
    ▼                            ▼
┌──────────────────┐   ┌──────────────────┐
│   RDS MySQL      │   │   S3 Bucket      │
│ (Private Subnet) │   │   (File Storage) │
└──────────────────┘   └──────────────────┘
```

## 생성되는 AWS 리소스

### 네트워킹
- **VPC**: 10.0.0.0/16
- **Public Subnets** (2개): ALB용
- **Private Subnets** (2개): ECS, RDS용
- **Internet Gateway**: 외부 통신
- **NAT Gateway**: Private subnet 아웃바운드
- **S3 VPC Endpoint**: 비용 절감

### 컴퓨팅
- **ECS Fargate Cluster**: 서버리스 컨테이너
- **ECS Service**: Auto Scaling (1-4 tasks)
- **Task Definition**: 512 CPU, 1024 MB Memory
- **ECR Repository**: Docker 이미지 저장소

### 데이터베이스
- **RDS MySQL 8.0**: db.t3.micro
- **Allocated Storage**: 20GB (자동 확장 100GB까지)
- **Backup**: 7일 보관
- **Encryption**: 저장 데이터 암호화
- **Multi-AZ**: false (비용 절감, prod는 true 권장)

### 스토리지
- **S3 Bucket**: 파일 업로드용
- **Lifecycle Policy**: 90일 후 IA로 전환
- **Versioning**: 활성화 (30일 후 삭제)
- **Public Read**: uploads/* 경로만

### 보안
- **Security Groups**: ALB, ECS, RDS 분리
- **Secrets Manager**: DB 자격 증명, JWT 등 민감 정보
- **IAM Roles**: ECS Task Execution, ECS Task Role
- **KMS**: 데이터 암호화

### 모니터링
- **CloudWatch Logs**: 애플리케이션 로그 (7일 보관)
- **Container Insights**: ECS 메트릭
- **ALB Access Logs**: (선택 사항)

## 사전 준비사항

### 1. AWS CLI 설정

```bash
# AWS CLI 설치 (이미 설치되어 있다면 생략)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS 자격 증명 설정
aws configure
# AWS Access Key ID: [YOUR_ACCESS_KEY]
# AWS Secret Access Key: [YOUR_SECRET_KEY]
# Default region name: ap-northeast-2
# Default output format: json
```

### 2. Terraform 설치


```bash
# Ubuntu/Debian
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# 설치 확인
terraform -version
```

### 3. 환경 변수 파일 생성

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` 파일을 열고 다음 값들을 설정:

```hcl
# 필수 항목
db_password                 = "YOUR_SECURE_DB_PASSWORD"
jwt_secret                  = "YOUR_512_BIT_JWT_SECRET"
toss_payments_client_key    = "YOUR_TOSS_CLIENT_KEY"
toss_payments_secret_key    = "YOUR_TOSS_SECRET_KEY"
webhook_secret              = "YOUR_WEBHOOK_SECRET"

# 선택 항목 (도메인이 있는 경우)
# domain_name     = "api.yourdomain.com"
# certificate_arn = "arn:aws:acm:ap-northeast-2:ACCOUNT_ID:certificate/CERT_ID"
```

## 배포 순서

### 1단계: Terraform 초기화

```bash
cd terraform
terraform init
```

### 2단계: 인프라 계획 검토

```bash
terraform plan
```

예상 비용 및 생성될 리소스 검토

### 3단계: 인프라 생성

```bash
terraform apply
```

`yes` 입력하여 승인. 약 10-15분 소요.

### 4단계: 출력 값 확인

```bash
terraform output
```

중요한 값들:
- `ecr_repository_url`: Docker 이미지 푸시할 ECR 주소
- `alb_dns_name`: 애플리케이션 접속 주소
- `rds_endpoint`: 데이터베이스 엔드포인트

## Docker 이미지 빌드 및 배포

### 1단계: ECR 로그인

```bash
# Terraform output에서 ECR URL 가져오기
ECR_URL=$(terraform output -raw ecr_repository_url)
ECR_REGISTRY=$(echo $ECR_URL | cut -d'/' -f1)

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $ECR_REGISTRY
```

### 2단계: Docker 이미지 빌드

```bash
cd ../backend

# Docker 이미지 빌드
docker build -t korean-agri-shop/backend:latest .

# ECR에 맞게 태그
docker tag korean-agri-shop/backend:latest $ECR_URL:latest
docker tag korean-agri-shop/backend:latest $ECR_URL:v1.0.0
```

### 3단계: ECR에 푸시

```bash
docker push $ECR_URL:latest
docker push $ECR_URL:v1.0.0
```

### 4단계: ECS 서비스 강제 재배포

```bash
cd ../terraform

# ECS 클러스터와 서비스 이름 가져오기
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
SERVICE_NAME=$(terraform output -raw ecs_service_name)

# 서비스 강제 재배포
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region ap-northeast-2
```

### 5단계: 배포 상태 확인

```bash
# ECS 서비스 상태 확인
aws ecs describe-services \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region ap-northeast-2 \
  --query 'services[0].deployments' \
  --output table

# CloudWatch Logs 확인
aws logs tail /ecs/korean-agri-shop/backend --follow --region ap-northeast-2
```

## 애플리케이션 접속

```bash
# ALB DNS 주소 가져오기
ALB_URL=$(terraform output -raw alb_dns_name)

# Health check
curl http://$ALB_URL/actuator/health

# API 테스트
curl http://$ALB_URL/api/products
```

## 프론트엔드 배포 (AWS Amplify)

### 1단계: Amplify 앱 생성

AWS Console에서 AWS Amplify로 이동:

1. "New app" → "Host web app" 선택
2. GitHub 리포지토리 연결
3. Branch: `main` 선택
4. Build settings 설정:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

5. 환경 변수 설정:
   - `NEXT_PUBLIC_API_BASE_URL`: `http://[ALB_DNS_NAME]` (Terraform output에서 확인)
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY`: Toss Payments Client Key

### 2단계: 배포 확인

Amplify가 자동으로 빌드 및 배포 진행. 완료 후 제공된 URL로 접속.

### 3단계: 커스텀 도메인 설정 (선택)

Amplify Console에서:
1. "Domain management" 선택
2. "Add domain" 클릭
3. 도메인 소유권 검증
4. SSL 인증서 자동 발급 (AWS Certificate Manager)

## 모니터링 및 유지보수

### CloudWatch Logs 확인

```bash
# 실시간 로그
aws logs tail /ecs/korean-agri-shop/backend --follow --region ap-northeast-2

# 특정 시간대 로그
aws logs filter-log-events \
  --log-group-name /ecs/korean-agri-shop/backend \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region ap-northeast-2
```

### ECS 태스크 확인

```bash
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)

# 실행 중인 태스크 목록
aws ecs list-tasks --cluster $CLUSTER_NAME --region ap-northeast-2

# 태스크 상세 정보
aws ecs describe-tasks \
  --cluster $CLUSTER_NAME \
  --tasks [TASK_ARN] \
  --region ap-northeast-2
```

### 데이터베이스 접속

```bash
# RDS 엔드포인트 확인
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# MySQL 클라이언트로 접속 (Bastion 호스트 또는 VPN 필요)
mysql -h $RDS_ENDPOINT -u admin -p agrimarket
```

### Auto Scaling 모니터링

```bash
# Auto Scaling 활동 확인
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/$CLUSTER_NAME/korean-agri-shop-backend-service \
  --region ap-northeast-2
```

## 비용 최적화

### 현재 구성 예상 월 비용 (ap-northeast-2)

- **ECS Fargate**: ~$15-30 (1 task, 0.5 vCPU, 1GB RAM)
- **RDS MySQL** (db.t3.micro): ~$15
- **ALB**: ~$20
- **NAT Gateway**: ~$32
- **S3**: 사용량 기반 (~$1-5)
- **Data Transfer**: 사용량 기반 (~$5-10)
- **CloudWatch Logs**: ~$1-3
- **총합**: **약 $90-115/월**

### 비용 절감 팁

1. **NAT Gateway 제거** (개발 환경):
   - Private subnet에서 NAT Gateway 제거
   - ECS 태스크에 Public IP 할당
   - 보안 그룹으로 접근 제어
   - **절감**: ~$32/월

2. **RDS 스케줄링**:
   - 개발/테스트 환경에서 야간 자동 중지
   - Lambda + EventBridge로 자동화
   - **절감**: ~50%

3. **Fargate Spot 사용**:
   - 개발 환경에서 Spot 인스턴스 사용
   - **절감**: ~70%

4. **S3 Intelligent-Tiering**:
   - 자주 접근하지 않는 파일 자동 이동
   - **절감**: ~30-50%

## CI/CD 파이프라인 (GitHub Actions)

`../.github/workflows/deploy-backend.yml` 예시:

```yaml
name: Deploy Backend to AWS ECS

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: korean-agri-shop/backend
  ECS_SERVICE: korean-agri-shop-backend-service
  ECS_CLUSTER: korean-agri-shop-cluster

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        working-directory: backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --force-new-deployment \
            --region $AWS_REGION
```

## 트러블슈팅

### ECS 태스크가 시작되지 않음

1. **CloudWatch Logs 확인**:
   ```bash
   aws logs tail /ecs/korean-agri-shop/backend --follow
   ```

2. **ECS 태스크 이벤트 확인**:
   ```bash
   aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME
   ```

3. **일반적인 원인**:
   - Docker 이미지 빌드 실패
   - Secrets Manager 권한 부족
   - 메모리 부족
   - Health check 실패

### ALB Health Check 실패

```bash
# Target 상태 확인
TARGET_GROUP_ARN=$(terraform output -json | jq -r '.alb_target_group_arn.value')
aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN
```

일반적인 원인:
- `/actuator/health` 엔드포인트 접근 불가
- Security Group 설정 오류
- Container 시작 시간 초과

### RDS 연결 실패

```bash
# Security Group 확인
aws ec2 describe-security-groups --group-ids [RDS_SG_ID]

# RDS 상태 확인
aws rds describe-db-instances --db-instance-identifier korean-agri-shop-mysql
```

## 인프라 삭제

**주의**: 이 작업은 모든 데이터를 삭제합니다!

```bash
# RDS 삭제 보호 해제
terraform apply -var="deletion_protection=false"

# 모든 리소스 삭제
terraform destroy

# 확인
yes
```

삭제 전 확인사항:
- RDS 최종 스냅샷 생성 여부
- S3 버킷 데이터 백업
- CloudWatch Logs 백업

## 참고 자료

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Spring Boot on AWS](https://spring.io/guides/gs/spring-boot-aws/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## 지원

문제가 발생하면 다음을 포함하여 이슈를 생성해주세요:
- Terraform 버전
- AWS CLI 버전
- 오류 메시지 및 로그
- `terraform plan` 출력
