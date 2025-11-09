# Google Sheets API 연동 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)
3. 프로젝트 이름: `korean-agri-shop` (원하는 이름 사용 가능)

### 1.2 Google Sheets API 활성화
1. 왼쪽 메뉴: **API 및 서비스 → 라이브러리**
2. "Google Sheets API" 검색
3. **Google Sheets API** 선택 → **사용 설정** 클릭

### 1.3 서비스 계정 생성
1. 왼쪽 메뉴: **API 및 서비스 → 사용자 인증 정보**
2. 상단: **+ 사용자 인증 정보 만들기 → 서비스 계정**
3. 서비스 계정 정보:
   - 이름: `sheets-sync-service`
   - ID: 자동 생성됨
   - 설명: "주문 내역 구글 시트 동기화"
4. **만들기 및 계속** 클릭
5. 역할 선택 단계: 건너뛰기
6. **완료** 클릭

### 1.4 서비스 계정 키(JSON) 다운로드
1. 생성된 서비스 계정 클릭
2. 상단 **"키"** 탭 선택
3. **키 추가 → 새 키 만들기** 클릭
4. **JSON** 선택 → **만들기**
5. JSON 파일 자동 다운로드됨

## 2. 백엔드 설정

### 2.1 JSON 키 파일 복사
다운로드한 JSON 파일을 `google-credentials.json`으로 복사:

```bash
cp ~/Downloads/[다운로드된파일].json /home/jaemin/korean-agri-shop/backend/google-credentials.json
```

### 2.2 환경변수 설정

**방법 1: 실행 시 환경변수 설정**
```bash
cd /home/jaemin/korean-agri-shop/backend

GOOGLE_SHEETS_ENABLED=true \
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json \
./gradlew bootRun
```

**방법 2: .env 파일 사용 (권장)**
```bash
# .env.example을 복사
cp .env.example .env

# .env 파일 수정
nano .env
```

`.env` 파일 내용:
```properties
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json
GOOGLE_SHEETS_SYNC_ENABLED=false  # 자동 동기화 비활성화 (수동만 사용)
```

### 2.3 백엔드 재시작
```bash
# 기존 프로세스 종료
lsof -ti:8081 | xargs kill -9

# 백엔드 재시작
cd /home/jaemin/korean-agri-shop/backend
./gradlew bootRun
```

## 3. Google Sheets 생성 및 설정

### 3.1 스프레드시트 생성
1. [Google Sheets](https://sheets.google.com) 접속
2. 새 스프레드시트 생성
3. 이름: "판매자명 - 주문내역" (예: "농장A - 주문내역")

### 3.2 시트 이름 설정
- 시트 이름을 **"주문내역"**으로 변경 (중요!)
- 시스템이 "주문내역" 시트에 데이터를 작성합니다

### 3.3 서비스 계정에 권한 부여
1. 스프레드시트 우측 상단 **"공유"** 클릭
2. JSON 파일에서 `client_email` 값 복사
   ```json
   {
     "client_email": "sheets-sync-service@프로젝트ID.iam.gserviceaccount.com"
   }
   ```
3. 이 이메일을 **편집자** 권한으로 추가
4. **완료** 클릭

### 3.4 스프레드시트 ID 확인
스프레드시트 URL에서 ID 추출:
```
https://docs.google.com/spreadsheets/d/[스프레드시트ID]/edit
                                      ↑ 이 부분을 복사
```

## 4. 데이터베이스 설정

### 4.1 판매자 테이블에 스프레드시트 ID 저장
```sql
-- MySQL 접속
mysql -u agrimarket -p

-- 데이터베이스 선택
USE agrimarket;

-- 판매자 스프레드시트 ID 업데이트
UPDATE sellers 
SET spreadsheet_id = '복사한스프레드시트ID'
WHERE id = 1;  -- 판매자 ID에 맞게 수정

-- 확인
SELECT id, name, spreadsheet_id FROM sellers;
```

### 4.2 자동 동기화 시간 설정 (선택사항)
```sql
-- 매일 자정에 자동 동기화하려면
UPDATE sellers 
SET update_schedule_time = '00:00:00'
WHERE id = 1;
```

그리고 `.env` 파일에서:
```properties
GOOGLE_SHEETS_SYNC_ENABLED=true
```

## 5. 동기화 테스트

### 5.1 관리자 페이지에서 테스트
1. 프론트엔드 접속: http://localhost:3000
2. 관리자 계정으로 로그인
3. **주문 관리** 페이지 이동
4. **구글 시트 동기화** 버튼 클릭
5. Google Sheets에서 데이터 확인

### 5.2 API로 직접 테스트
```bash
# 관리자 토큰 얻기 (로그인)
TOKEN="your-admin-jwt-token"

# 전체 판매자 동기화
curl -X POST http://localhost:8081/api/admin/sheets/sync-all \
  -H "Authorization: Bearer $TOKEN"

# 특정 판매자만 동기화
curl -X POST http://localhost:8081/api/admin/sheets/sync/1 \
  -H "Authorization: Bearer $TOKEN"

# 마지막 동기화 상태 확인
curl http://localhost:8081/api/admin/sheets/last-sync \
  -H "Authorization: Bearer $TOKEN"
```

## 6. 생성되는 스프레드시트 형식

| 주문번호 | 주문일시 | 고객명 | 고객이메일 | 상품명 | 수량 | 단가 | 금액 | 주문상태 | 배송지 | 수령인 | 연락처 | 송장번호 |
|---------|---------|--------|-----------|--------|------|------|------|---------|--------|--------|--------|---------|
| 1 | 2025-01-15 10:30:00 | 홍길동 | hong@example.com | 친환경 쌀 10kg | 2 | 50000 | 100000 | 결제 완료 | 서울시... | 홍길동 | 010-1234-5678 | 1234567890 |

- 헤더는 회색 배경으로 자동 서식 적용
- 헤더 행은 고정되어 스크롤 시에도 보임
- 판매자별로 해당 판매자의 상품이 포함된 주문만 표시

## 7. 문제 해결

### "Google Sheets service is not enabled" 오류
- `GOOGLE_SHEETS_ENABLED=true` 확인
- 백엔드 재시작

### "Credentials file not found" 오류
- `google-credentials.json` 파일 경로 확인
- 파일이 `backend/` 폴더에 있는지 확인

### "Permission denied" 오류
- 스프레드시트에 서비스 계정 이메일이 **편집자** 권한으로 추가되었는지 확인

### "No sheet named '주문내역'" 오류
- 스프레드시트의 시트 이름이 정확히 **"주문내역"**인지 확인 (따옴표 제외)

## 8. 보안 주의사항

⚠️ **중요: `google-credentials.json` 파일을 Git에 커밋하지 마세요!**

`.gitignore`에 추가되어 있는지 확인:
```bash
# .gitignore에 다음 라인 추가
backend/google-credentials.json
```

## 9. 자동 동기화 스케줄 설정

자동 동기화를 활성화하려면:

1. `.env` 파일 수정:
```properties
GOOGLE_SHEETS_SYNC_ENABLED=true
```

2. `application.properties`에서 cron 표현식 수정 (선택):
```properties
# 기본값: 매일 자정
google.sheets.sync.cron=0 0 0 * * ?

# 예: 매시간 정각
google.sheets.sync.cron=0 0 * * * ?

# 예: 매일 오전 9시
google.sheets.sync.cron=0 0 9 * * ?
```

Cron 표현식 형식: `초 분 시 일 월 요일`
