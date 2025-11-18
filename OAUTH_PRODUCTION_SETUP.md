# OAuth2 Production Setup Guide

This guide explains how to configure Naver and Kakao OAuth login for production deployment.

## Problem Summary

OAuth login works locally but fails in production due to:
1. Incorrect redirect URI configuration
2. Missing production environment variables
3. Hardcoded cookie security settings (now fixed)
4. Missing OAuth provider console configuration

---

## Backend Configuration

### 1. Environment Variables

Set these on your production server (ECS, EC2, Docker, etc.):

```bash
# Production Frontend URL (REQUIRED)
FRONTEND_URL=https://your-frontend-domain.com

# CORS (REQUIRED - include your production frontend domain)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Naver OAuth (REQUIRED)
NAVER_CLIENT_ID=your_production_naver_client_id
NAVER_CLIENT_SECRET=your_production_naver_secret

# Kakao OAuth (REQUIRED)
KAKAO_CLIENT_ID=your_production_kakao_client_id
KAKAO_CLIENT_SECRET=your_production_kakao_secret

# Cookie Security for HTTPS (REQUIRED for production)
COOKIE_SECURE=true
COOKIE_SAME_SITE=None

# Other required environment variables
JWT_SECRET=your_512_bit_secret_key
DB_PASSWORD=your_db_password
WEBHOOK_SECRET=your_webhook_secret
TOSS_PAYMENTS_CLIENT_KEY=your_toss_client_key
TOSS_PAYMENTS_SECRET_KEY=your_toss_secret_key
SENDGRID_API_KEY=your_sendgrid_key
```

### 2. Verify application.properties

The redirect URIs in `backend/src/main/resources/application.properties` use `{baseUrl}` which Spring Security automatically resolves:

```properties
# These automatically resolve to your production backend URL
spring.security.oauth2.client.registration.naver.redirect-uri={baseUrl}/login/oauth2/code/naver
spring.security.oauth2.client.registration.kakao.redirect-uri={baseUrl}/login/oauth2/code/kakao
```

No changes needed - Spring Boot will automatically use your production domain.

---

## OAuth Provider Console Configuration

### Naver Developers Console

1. Go to: https://developers.naver.com/apps/
2. Select your application or create a new one
3. Navigate to **API 설정** (API Settings)
4. Add **Callback URL**:
   ```
   https://your-backend-domain.com/login/oauth2/code/naver
   ```
   Example: `https://api.todaymart.co.kr/login/oauth2/code/naver`

5. Under **제공 정보 선택** (Provided Information), ensure these are checked:
   - 이메일 주소 (Email)
   - 이름 (Name)
   - 휴대전화번호 (Mobile)
   - 생일 (Birthday)
   - 출생연도 (Birth year)
   - 성별 (Gender)

6. Set **서비스 URL** (Service URL) to your frontend domain:
   ```
   https://your-frontend-domain.com
   ```

7. Copy the **Client ID** and **Client Secret** to your environment variables

### Kakao Developers Console

1. Go to: https://developers.kakao.com/console/app
2. Select your application or create a new one
3. Navigate to **앱 설정 > 플랫폼** (App Settings > Platform)
4. Add **Web 플랫폼**:
   ```
   https://your-frontend-domain.com
   ```

5. Navigate to **제품 설정 > 카카오 로그인** (Product Settings > Kakao Login)
6. Enable **카카오 로그인 활성화** (Activate Kakao Login)
7. Add **Redirect URI**:
   ```
   https://your-backend-domain.com/login/oauth2/code/kakao
   ```
   Example: `https://api.todaymart.co.kr/login/oauth2/code/kakao`

8. Navigate to **제품 설정 > 카카오 로그인 > 동의항목** (Consent Items)
9. Set these permissions:
   - 프로필 정보 (닉네임) - Profile (Nickname)
   - 카카오계정 (이메일) - Kakao Account (Email)
   - 전화번호 - Phone Number
   - 생일 - Birthday
   - 성별 - Gender

10. Copy the **REST API 키** (Client ID) and **Client Secret** to your environment variables
    - Client Secret: Go to **제품 설정 > 카카오 로그인 > 보안** to generate

---

## Frontend Configuration

### Update API Base URL

In `frontend/lib/api-client.ts`, ensure `API_BASE_URL` points to production:

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"
```

Set environment variable:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## AWS ECS Deployment (if using ECS)

### Task Definition Environment Variables

Add to your task definition JSON:

```json
{
  "containerDefinitions": [
    {
      "name": "backend",
      "environment": [
        {
          "name": "FRONTEND_URL",
          "value": "https://your-frontend-domain.com"
        },
        {
          "name": "CORS_ALLOWED_ORIGINS",
          "value": "https://your-frontend-domain.com"
        },
        {
          "name": "COOKIE_SECURE",
          "value": "true"
        },
        {
          "name": "COOKIE_SAME_SITE",
          "value": "None"
        }
      ],
      "secrets": [
        {
          "name": "NAVER_CLIENT_ID",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        },
        {
          "name": "NAVER_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        },
        {
          "name": "KAKAO_CLIENT_ID",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        },
        {
          "name": "KAKAO_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:name"
        }
      ]
    }
  ]
}
```

---

## Testing OAuth in Production

### 1. Test Naver Login

1. Navigate to `https://your-frontend-domain.com/login`
2. Click **네이버** button
3. Should redirect to Naver login page
4. After login, should redirect to: `https://your-backend-domain.com/login/oauth2/code/naver?code=...&state=...`
5. Backend processes OAuth and redirects to: `https://your-frontend-domain.com/oauth2/redirect?token=...`
6. Frontend saves token and redirects to homepage

### 2. Test Kakao Login

1. Navigate to `https://your-frontend-domain.com/login`
2. Click **카카오** button
3. Should redirect to Kakao login page
4. After login, should redirect to: `https://your-backend-domain.com/login/oauth2/code/kakao?code=...`
5. Backend processes OAuth and redirects to: `https://your-frontend-domain.com/oauth2/redirect?token=...`
6. Frontend saves token and redirects to homepage

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause**: The redirect URI in the OAuth provider console doesn't match the one sent by your backend.

**Solution**:
1. Check browser network tab for the actual redirect URI being sent
2. Ensure it exactly matches what's registered in Naver/Kakao console
3. Remember `{baseUrl}` resolves to your backend domain (not frontend)

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause**: Frontend domain not in `CORS_ALLOWED_ORIGINS`

**Solution**: Add your frontend domain to the environment variable

### Error: "Cookie not set" or "Token not received"

**Cause**: Cookie security settings incorrect for HTTPS

**Solution**: Ensure `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=None` on production

### Error: "OAuth2AuthenticationException"

**Cause**: Invalid client credentials or missing user info permissions

**Solution**:
1. Verify `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` are correct
2. Check OAuth provider console logs for API errors
3. Ensure all required scopes/permissions are enabled

### Backend Logs

Check your production logs for OAuth-related errors:

```bash
# For ECS
aws logs tail /aws/ecs/your-service --follow

# For Docker
docker logs -f container_name

# Look for these log patterns
grep "OAuth2" logs.txt
grep "login/oauth2/code" logs.txt
```

---

## Local Development vs Production

### Local Development

For local development, you can use different OAuth apps or the same ones:

**Option 1: Separate Development Apps** (Recommended)
- Create separate Naver/Kakao apps for development
- Set redirect URIs to `http://localhost:8081/login/oauth2/code/naver` and `/kakao`
- Use different client IDs/secrets in your local environment

**Option 2: Same Apps with Multiple Redirect URIs**
- Add both production and local redirect URIs to the same app
- Naver and Kakao allow multiple redirect URIs per app

Environment variables for local development:
```bash
FRONTEND_URL=http://localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
COOKIE_SECURE=false
COOKIE_SAME_SITE=Lax
NAVER_CLIENT_ID=dev_client_id
NAVER_CLIENT_SECRET=dev_secret
KAKAO_CLIENT_ID=dev_client_id
KAKAO_CLIENT_SECRET=dev_secret
```

---

## Security Best Practices

1. **Never commit secrets to git**: Use environment variables or AWS Secrets Manager
2. **Use HTTPS in production**: Required for secure cookies
3. **Rotate secrets regularly**: Change OAuth secrets periodically
4. **Monitor failed login attempts**: Set up alerts for OAuth failures
5. **Validate token expiration**: JWT tokens expire after 1 hour by default

---

## Summary Checklist

Before deploying to production, ensure:

- [ ] Production environment variables set (FRONTEND_URL, CORS_ALLOWED_ORIGINS, etc.)
- [ ] Naver redirect URI registered in Naver Developers Console
- [ ] Kakao redirect URI registered in Kakao Developers Console
- [ ] Frontend domain added to both OAuth provider platforms
- [ ] Required scopes/permissions enabled in both consoles
- [ ] COOKIE_SECURE=true and COOKIE_SAME_SITE=None for production
- [ ] SSL/TLS certificate installed on production backend
- [ ] NEXT_PUBLIC_API_URL set to production backend URL
- [ ] Tested OAuth flow end-to-end in production environment

---

## Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check backend logs for OAuth errors
3. Verify network tab shows correct redirect URIs
4. Confirm OAuth provider console configuration
5. Test with a fresh incognito/private browser window
