# 한국 농수산물 쇼핑몰 프로젝트 상태 문서

**작성일**: 2025-11-01
**프로젝트**: korean-agri-shop
**현재 브랜치**: main (origin/main보다 12 커밋 앞섬)

---

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [구현된 기능](#구현된-기능)
5. [최근 작업 내역](#최근-작업-내역)
6. [서버 실행 방법](#서버-실행-방법)
7. [주요 API 엔드포인트](#주요-api-엔드포인트)
8. [테스트 가이드](#테스트-가이드)
9. [알려진 이슈](#알려진-이슈)
10. [다음 할 일](#다음-할-일)

---

## 프로젝트 개요

한국 농수산물을 판매하는 전자상거래 플랫폼입니다.
- **사용자**: 상품 검색, 주문, 리뷰 작성, 찜하기 등
- **관리자**: 상품/주문 관리, 대시보드, 통계 확인

---

## 기술 스택

### 백엔드
- **프레임워크**: Spring Boot 3.5.7
- **언어**: Java 21
- **데이터베이스**: MySQL 8.0
- **ORM**: JPA/Hibernate 6.6.33
- **보안**: Spring Security + JWT
- **빌드 도구**: Gradle
- **포트**: 8081

### 프론트엔드
- **프레임워크**: Next.js 15.2.4
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **차트**: Recharts
- **포트**: 3000

---

## 프로젝트 구조

```
korean-agri-shop/
├── backend/                          # Spring Boot 백엔드
│   ├── src/main/java/com/agri/market/
│   │   ├── config/                   # 설정 (SecurityConfig, etc.)
│   │   ├── security/                 # JWT, 인증 필터
│   │   ├── user/                     # 사용자 관리
│   │   │   ├── User.java
│   │   │   ├── UserRepository.java
│   │   │   ├── UserService.java
│   │   │   └── UserController.java
│   │   ├── product/                  # 상품 관리
│   │   ├── order/                    # 주문 관리
│   │   ├── cart/                     # 장바구니
│   │   ├── review/                   # 리뷰 시스템
│   │   ├── wishlist/                 # 찜하기
│   │   └── dto/                      # DTO 클래스
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/                         # Next.js 프론트엔드
    ├── app/
    │   ├── admin/                    # 관리자 페이지
    │   │   ├── page.tsx              # 대시보드
    │   │   ├── products/page.tsx     # 상품 관리
    │   │   └── orders/page.tsx       # 주문 관리
    │   ├── mypage/                   # 마이페이지
    │   │   ├── orders/               # 내 주문
    │   │   ├── reviews/page.tsx      # 내 리뷰
    │   │   ├── wishlist/page.tsx     # 찜 목록
    │   │   └── settings/page.tsx     # 계정 설정
    │   ├── product/[id]/page.tsx     # 상품 상세
    │   ├── search/page.tsx           # 검색 결과
    │   ├── checkout/page.tsx         # 주문/결제
    │   └── login/page.tsx            # 로그인
    └── components/
        ├── header.tsx
        └── footer.tsx
```

---

## 구현된 기능

### ✅ 사용자 기능
1. **회원 인증**
   - 회원가입, 로그인, 로그아웃
   - JWT 기반 토큰 인증
   - 역할 기반 접근 제어 (USER, ADMIN)

2. **상품 기능**
   - 상품 목록 조회 (페이지네이션)
   - 상품 상세 정보
   - 상품 검색 (키워드, 카테고리, 원산지)
   - 카테고리별 필터링

3. **찜하기 (Wishlist) 시스템** ⭐ 최근 구현
   - 상품 찜하기/취소
   - 찜 목록 페이지
   - 찜 목록에서 장바구니 담기
   - 찜 상태 실시간 반영

4. **장바구니**
   - 상품 추가/제거
   - 수량 변경
   - 장바구니에서 주문하기

5. **주문/결제**
   - 배송지 정보 입력
   - 주문 생성
   - 주문 내역 조회
   - 주문 상세 조회
   - 주문 취소
   - 배송 완료 확인

6. **리뷰 시스템** ⭐ 최근 개선
   - 리뷰 작성 (별점, 제목, 내용)
   - 상품 페이지에서 리뷰 조회
   - 내 리뷰 관리 페이지
   - 리뷰 수정/삭제
   - 평균 평점 및 리뷰 수 표시

7. **사용자 프로필** ⭐ 최근 구현
   - 프로필 정보 수정 (이름, 전화번호, 주소 등)
   - 비밀번호 변경
   - 가입일 확인

### ✅ 관리자 기능
1. **대시보드**
   - 매출 통계 (총 매출, 평균 주문액)
   - 주문 통계 (총 주문 수)
   - 상품 통계 (등록 상품 수)
   - 주간 매출 차트
   - 카테고리별 상품 분포 차트
   - 최근 주문 내역
   - 인기 상품 TOP 5

2. **상품 관리**
   - 상품 등록 (다이얼로그)
   - 상품 수정
   - 상품 삭제
   - 상품 목록 조회

3. **주문 관리**
   - 전체 주문 조회
   - 주문 상태 변경
   - 송장 번호 등록
   - 주문 필터링 (상태별)
   - 엑셀 다운로드

---

## 최근 작업 내역

### 커밋 히스토리 (최근 12개)

```bash
a666f2e feat(admin): 대시보드에서 상품 관리 페이지로 이동하는 링크 추가
12fad0a feat(user): 사용자 프로필 관리 및 비밀번호 변경 기능 추가
0ea14b2 feat(review): 리뷰 시스템 인증 수정 및 내 리뷰 관리 페이지 추가
713cd2e feat(wishlist): 찜하기/위시리스트 기능 구현
2f8e7ea fix(header): ROLE_ADMIN prefix 지원 추가
c90447d feat(header): 관리자 사용자에게 관리자 페이지 버튼 추가
1e3e6ad fix(admin): Link import 추가
be5aef9 feat(admin): 관리자 주문 관리 페이지 구현
3d4c8f2 feat(order): 주문 목록 페이지 구현
f7b2a1c fix(order): JSON 순환 참조 오류 수정
d9e8c6b feat(checkout): 실제 API 연동 및 주문 상세 페이지 구현
ca7cacc feat(admin): 관리자 상품 관리 페이지 구현
```

### 이번 세션에서 완료한 작업

#### 1. 찜하기/위시리스트 시스템 (713cd2e)
**백엔드**:
- `WishlistItem.java` - 찜 엔티티 (User-Product 관계)
- `WishlistRepository.java` - JPA 레포지토리
- `WishlistService.java` - 비즈니스 로직
- `WishlistController.java` - REST API
  - `GET /api/wishlist` - 사용자 찜 목록
  - `POST /api/wishlist` - 찜 추가
  - `DELETE /api/wishlist/{productId}` - 찜 제거
  - `GET /api/wishlist/check/{productId}` - 찜 상태 확인

**프론트엔드**:
- `frontend/app/product/[id]/page.tsx` 수정 - 찜하기 버튼 추가
- `frontend/app/mypage/wishlist/page.tsx` 생성 - 찜 목록 페이지

#### 2. 리뷰 시스템 개선 (0ea14b2)
**백엔드**:
- `ReviewController.java` 수정 - 하드코딩된 userId 제거, JWT에서 이메일 추출
- `ReviewService.java` 수정 - 이메일 기반 사용자 조회 메서드 추가

**프론트엔드**:
- `frontend/app/mypage/reviews/page.tsx` 생성 - 내 리뷰 관리 페이지
  - 리뷰 목록 조회
  - 리뷰 수정 다이얼로그
  - 리뷰 삭제 확인 다이얼로그

#### 3. 사용자 프로필 관리 (12fad0a)
**백엔드**:
- `UserController.java` 생성
  - `GET /api/users/profile` - 프로필 조회
  - `PUT /api/users/profile` - 프로필 수정
  - `POST /api/users/change-password` - 비밀번호 변경
- `UserService.java` 생성 - 프로필 업데이트 로직
- DTO 클래스:
  - `UserProfileResponse.java`
  - `UserProfileUpdateRequest.java`
  - `PasswordChangeRequest.java`

**프론트엔드**:
- `frontend/app/mypage/settings/page.tsx` 생성
  - 프로필 정보 탭 (이름, 전화번호, 주소, 생년월일, 성별)
  - 비밀번호 변경 탭

#### 4. 관리자 대시보드 개선 (a666f2e)
- 총 상품 카드를 클릭 가능하도록 수정
- `/admin/products` 페이지로 이동하는 링크 추가

---

## 서버 실행 방법

### 백엔드 서버 (Spring Boot)
```bash
cd /home/jaemin/korean-agri-shop/backend
./gradlew bootRun
```
- **URL**: http://localhost:8081
- **상태 확인**: `curl http://localhost:8081/api/products?size=1`

### 프론트엔드 서버 (Next.js)
```bash
cd /home/jaemin/korean-agri-shop/frontend
pnpm dev
```
- **URL**: http://localhost:3000

### 포트가 사용 중일 때
```bash
# 8081 포트 프로세스 종료
lsof -ti:8081 | xargs kill -9

# 3000 포트 프로세스 종료
lsof -ti:3000 | xargs kill -9
```

---

## 주요 API 엔드포인트

### 인증 (Public)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 상품 (Public)
- `GET /api/products` - 상품 목록
- `GET /api/products/{id}` - 상품 상세
- `GET /api/products/search` - 상품 검색 (keyword, category, origin)

### 사용자 (인증 필요)
- `GET /api/users/profile` - 내 프로필 조회
- `PUT /api/users/profile` - 프로필 수정
- `POST /api/users/change-password` - 비밀번호 변경

### 찜하기 (인증 필요)
- `GET /api/wishlist` - 내 찜 목록
- `POST /api/wishlist` - 찜 추가 `{"productId": 1}`
- `DELETE /api/wishlist/{productId}` - 찜 제거
- `GET /api/wishlist/check/{productId}` - 찜 상태 확인

### 장바구니 (인증 필요)
- `GET /api/cart` - 장바구니 조회
- `POST /api/cart/items` - 상품 추가
- `PUT /api/cart/items/{id}` - 수량 변경
- `DELETE /api/cart/items/{id}` - 상품 제거

### 주문 (인증 필요)
- `GET /api/orders` - 내 주문 목록
- `GET /api/orders/{id}` - 주문 상세
- `POST /api/orders` - 주문 생성
- `POST /api/orders/{id}/cancel` - 주문 취소
- `POST /api/orders/{id}/confirm` - 배송 확인

### 리뷰 (Public 조회, 인증 필요 작성)
- `GET /api/reviews/product/{productId}` - 상품 리뷰 목록
- `GET /api/reviews/product/{productId}/stats` - 평균 평점/리뷰 수
- `POST /api/reviews` - 리뷰 작성 (인증)
- `GET /api/reviews/my-reviews` - 내 리뷰 목록 (인증)
- `PUT /api/reviews/{id}` - 리뷰 수정 (인증)
- `DELETE /api/reviews/{id}` - 리뷰 삭제 (인증)

### 관리자 (ADMIN 권한)
- `GET /api/admin/orders` - 전체 주문 조회
- `PUT /api/admin/orders/{id}/status` - 주문 상태 변경
- `POST /api/admin/orders/{id}/tracking` - 송장 번호 등록
- `GET /api/admin/orders/export` - 주문 엑셀 다운로드

---

## 테스트 가이드

### 테스트 계정
**일반 사용자**:
- 이메일: `user@example.com`
- 비밀번호: (회원가입 필요)

**관리자**:
- 이메일: `admin@example.com`
- 비밀번호: `admin123!` (또는 DB 설정에 따름)

### 기능 테스트 체크리스트

#### 1. 찜하기 기능
- [ ] 상품 상세 페이지에서 하트 버튼 클릭
- [ ] 하트 아이콘 색상 변경 확인
- [ ] `/mypage/wishlist` 에서 찜 목록 확인
- [ ] 찜 목록에서 제거 (X 버튼)
- [ ] 찜 목록에서 장바구니 담기

#### 2. 리뷰 시스템
- [ ] 상품 페이지에서 "리뷰 작성하기" 클릭
- [ ] 별점, 제목, 내용 입력 후 작성
- [ ] 작성한 리뷰가 상품 페이지에 표시되는지 확인
- [ ] `/mypage/reviews` 에서 내 리뷰 확인
- [ ] 리뷰 수정 테스트
- [ ] 리뷰 삭제 테스트

#### 3. 사용자 프로필
- [ ] `/mypage/settings` 접속
- [ ] 프로필 정보 수정 (이름, 전화번호, 주소)
- [ ] 저장 후 성공 토스트 확인
- [ ] 비밀번호 변경 탭 이동
- [ ] 비밀번호 변경 후 재로그인

#### 4. 상품 검색
- [ ] 헤더 검색창에 키워드 입력 (예: "사과")
- [ ] 검색 결과 페이지 확인
- [ ] 카테고리 필터 선택
- [ ] 페이지네이션 동작 확인

#### 5. 관리자 기능
- [ ] 관리자 계정으로 로그인
- [ ] 헤더에 "관리자 페이지" 버튼 표시 확인
- [ ] `/admin` 대시보드 접속
- [ ] "총 주문" 카드 클릭 → 주문 관리 페이지
- [ ] "총 상품" 카드 클릭 → 상품 관리 페이지
- [ ] 상품 등록/수정/삭제 테스트

---

## 알려진 이슈

### 해결된 이슈
1. ✅ **리뷰 API 인증 문제** - userId 하드코딩 → JWT에서 이메일 추출로 수정
2. ✅ **주문 생성 시 JSON 순환 참조** - Jackson 어노테이션 추가로 해결
3. ✅ **관리자 버튼 미표시** - ROLE_ADMIN prefix 지원 추가
4. ✅ **사용자 프로필 API 401 오류** - 해결됨 (사용자 확인)

### 현재 이슈
- 없음

---

## 다음 할 일

### 우선순위 높음
1. **통합 테스트 완료**
   - 모든 새로 구현된 기능 테스트
   - 버그 발견 시 수정

2. **코드 정리**
   - 불필요한 주석 제거
   - 코드 스타일 통일

### 우선순위 중간
3. **추가 기능 고려 사항**
   - 소셜 로그인 (OAuth2)
   - 이메일 인증
   - 결제 시스템 연동 (PG사)
   - 이미지 업로드 (S3 등)
   - 쿠폰/할인 시스템
   - 상품 문의 게시판

4. **성능 최적화**
   - 이미지 최적화
   - 페이지 로딩 속도 개선
   - 데이터베이스 인덱스 최적화

### 우선순위 낮음
5. **배포 준비**
   - 환경 변수 설정 (.env)
   - Docker 컨테이너화
   - CI/CD 파이프라인
   - 프로덕션 데이터베이스 설정

---

## 파일 위치 참고

### 중요 설정 파일
- **백엔드 설정**: `/home/jaemin/korean-agri-shop/backend/src/main/resources/application.properties`
- **Spring Security**: `/home/jaemin/korean-agri-shop/backend/src/main/java/com/agri/market/config/SecurityConfig.java`
- **프론트엔드 설정**: `/home/jaemin/korean-agri-shop/frontend/package.json`

### 새로 추가된 파일 (이번 세션)
**백엔드**:
- `backend/src/main/java/com/agri/market/wishlist/` (전체 디렉토리)
- `backend/src/main/java/com/agri/market/user/UserController.java`
- `backend/src/main/java/com/agri/market/user/UserService.java`
- `backend/src/main/java/com/agri/market/dto/UserProfileResponse.java`
- `backend/src/main/java/com/agri/market/dto/UserProfileUpdateRequest.java`
- `backend/src/main/java/com/agri/market/dto/PasswordChangeRequest.java`

**프론트엔드**:
- `frontend/app/mypage/wishlist/page.tsx`
- `frontend/app/mypage/reviews/page.tsx`
- `frontend/app/mypage/settings/page.tsx`

---

## 개발 팁

### Git 명령어
```bash
# 현재 상태 확인
git status
git log --oneline -10

# 변경사항 커밋
git add .
git commit -m "feat: 기능 추가"

# 원격 저장소에 푸시
git push origin main

# 브랜치 생성
git checkout -b feature/new-feature
```

### 디버깅
**백엔드 로그 확인**:
- Spring Boot 콘솔에서 실시간 로그 확인
- `application.properties`에서 로그 레벨 조정

**프론트엔드 디버깅**:
- 브라우저 개발자 도구 (F12)
- Network 탭에서 API 호출 확인
- Console 탭에서 에러 메시지 확인

### 데이터베이스 접근
```bash
mysql -u root -p
use korean_agri_shop;
SHOW TABLES;
SELECT * FROM users LIMIT 10;
```

---

## 연락처 / 참고사항

**프로젝트 경로**: `/home/jaemin/korean-agri-shop`
**Git 상태**: main 브랜치, origin/main보다 12 커밋 앞섬
**마지막 작업**: 2025-11-01

---

**문서 끝**
