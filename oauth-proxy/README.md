# OAuth Proxy (Cloudflare Worker)

GitHub OAuth token 교환 프록시입니다.

## 배포 방법

### 1. Cloudflare 계정 생성
https://dash.cloudflare.com/sign-up (무료)

### 2. wrangler CLI 설치
```bash
npm install -g wrangler
```

### 3. Cloudflare 로그인
```bash
wrangler login
```

### 4. client_secret 설정
GitHub OAuth App에서 Client Secret을 생성한 후:
```bash
cd oauth-proxy
wrangler secret put GITHUB_CLIENT_SECRET
```
프롬프트에 secret 값을 붙여넣기

### 5. 배포
```bash
wrangler deploy
```

배포 완료 후 URL이 출력됩니다 (예: `https://whipping-time-oauth.your-account.workers.dev`)

### 6. 프론트엔드에 URL 설정
프로젝트 루트의 `.env` 파일에:
```
VITE_OAUTH_PROXY_URL=https://whipping-time-oauth.your-account.workers.dev
```

이후 로그인 버튼 클릭만으로 OAuth 로그인이 완료됩니다.
