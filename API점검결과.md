# API 연동 점검 결과

백엔드 없이, 명세서에 적힌 요청·응답을 그대로 흉내내어 `api.js` 가 맞게 부르는지 확인했습니다.
**19개 엔드포인트 · 80개 항목 전부 통과**했습니다.

| 엔드포인트 | 확인한 것 |
|---|---|
| POST /auth/signup | 경로 · loginId 필드명 · 5개 필드 · 201의 userId · 409는 이메일 칸 오류 |
| POST /auth/login | 경로 · 2개 필드 · accessToken/refreshToken 보관 · 400은 두 칸 표시 · 409는 탈퇴 안내 |
| POST /auth/refresh | 경로 · Authorization + X-Refresh-Token 헤더 · 새 토큰 교체 |
| POST /auth/logout | 경로 · POST · data:null 도 성공 처리 |
| DELETE /auth/me | 경로 · DELETE · withdrawnAt 파싱 |
| POST /me/onboarding | 경로 · interestCategories 배열 · 3개 필드 · onboardingCompleted |
| PATCH /me/onboarding | 바꾼 항목만 전송 · 안 바꾼 값 유지 · 온보딩 전이면 POST 로 전환 |
| POST /judgements | 경로 · inputType 대문자 · 타입별 필드 분리 · 422/429 전용 화면 |
| GET /judgements/{id} | 경로 · trustLevel 변환 · conflictOfInterest · guideCard · 이력 적립 · 403 |
| GET /judgements | 경로 · page/size 기본값 · items/hasNext · 라벨→뱃지 |
| GET /briefings/today | 경로 · category enum 변환 · relatedArchiveId 보존 |
| POST /judgments/{id}/share | 경로 · shareUrl/imageUrl 파싱 · 403/404 |
| GET /share/{token} | 경로 · 인증 헤더 없음 · 410 만료 안내 |
| DELETE /judgments/{id}/share | 경로 · DELETE · 404는 이미 회수로 처리 |
| POST /feed/posts | 경로 · judgmentId body · postId/status 파싱 · 400 게시불가 |
| GET /feed/posts | 경로 · sort/page/size · author.nickname · totalPages |
| GET /feed/posts/me | 경로 · page/size · 6.5와 같은 구조 파싱 |
| POST /feed/posts/{id}/like | 좋아요 · liked/likeCount 파싱 |
| DELETE /feed/posts/{id}/like | 취소 · 같은 URL 다른 메서드 |
| 공통 | 모든 인증 요청에 Bearer · Content-Type · 401 시 재발급 후 재시도 |

다시 돌려보려면 (Node 필요):

```bash
node api-audit.js
```

---

## 서버를 켠 뒤 반드시 확인해야 할 것

위 점검은 **제가 명세서를 읽고 만든 가짜 서버**를 상대로 한 것입니다.
실제 서버와 다를 수 있는 지점이 아래 네 가지예요.

### 1. 온보딩 enum 값 — 400 이 뜨면 여기입니다

예시에 나온 `NUTRITION_SUPPLEMENT`, `COSMETICS`, `AGE_50S`, `FEMALE` 만 확인됐고
나머지는 추측입니다. `data.js` 의 표에서 value 만 고치면 됩니다.

| 화면 | 지금 보내는 값 | 확인? |
|---|---|---|
| 미용/화장품 | `COSMETICS` | 확인됨 |
| 건강/면역 | `NUTRITION_SUPPLEMENT` | 확인됨 |
| 다이어트 | `DIET` | **추측** |
| 기타 | `ETC` | **추측** |
| 여성 | `FEMALE` | 확인됨 |
| 남성 / 기타 | `MALE` / `OTHER` | **추측** |
| 나이대 4구간 | `AGE_10S` `AGE_20S` `AGE_40S` `AGE_60S` | **추측** |

### 2. 나이대 구간이 화면과 서버가 다릅니다

화면은 `10~24 / 25~39 / 40~59 / 60 이상` 인데 서버 예시는 `AGE_50S` — 10년 단위로 보입니다.
서버 기준이 맞다면 화면 선택지를 10년 단위로 바꿔야 합니다.

### 3. 목록 응답에 빠진 필드들

세 곳에서 화면을 다 못 채웁니다. 백엔드에 함께 요청하면 좋습니다.

| API | 빠진 것 | 지금 화면 |
|---|---|---|
| 3.3 판정 히스토리 | 판정 문장(제목) | 다른 기기면 `판정 #1` 로 표시 |
| 6.5 피드 목록 | `title`, `category` | `summary` 를 제목처럼, 카테고리 자리엔 시각 |
| 6.6 내 게시물 | `judgmentId` | 다른 기기에서 올린 카드는 공유 중지 불가 |
| 6.5 피드 목록 | `liked` | 내가 이미 누른 글도 빈 하트로 보임 |

### (참고) 판정 히스토리에 제목이 없습니다

`items` 에 `judgmentId`, `trustLevelLabel`, `categoryId`, `createdAt` 만 옵니다.
지금은 이 기기에 저장된 문장이 있으면 쓰고, 없으면 `판정 #1` 로 보여줍니다.
다른 기기에서 로그인하면 전부 번호로만 보여요. `extractedText` 를 추가해달라고 요청하는 게 좋습니다.

### 4. 공유 링크만 경로 철자가 다릅니다

다른 판정 API 는 `/api/judgements` (e 있음) 인데 공유 링크만 `/api/judgments` (e 없음) 입니다.
명세서에 그렇게 적혀 있어서 그대로 넣었지만, 404 가 나면 `api.js` 의 `SHARE_PATH` 를 고치세요.

### 5. 로그인 400 이 아이디/비밀번호를 구분하지 않습니다

명세서 3-1/4-1 은 아이디 칸과 비밀번호 칸을 나눠 빨갛게 하라고 되어 있는데,
서버가 둘 다 400 으로 주고 있어서 지금은 두 칸을 함께 표시합니다.
서버가 404(아이디 없음) / 401(비밀번호 불일치)로 나눠주면 `api.js` 의 `statusMap` 한 줄로 해결됩니다.

---

## 서버 켠 다음 순서

1. `server-check.html` 로 연결·CORS 확인
2. 회원가입 → 로그인 (여기까지 되면 인증은 정상)
3. 마이페이지 → 판정 이력 (히스토리 조회 확인)
4. 판정 요청 — AI 서비스(8000)를 안 띄웠으면 `FAILED` 가 정상입니다

각 단계에서 막히면 개발자도구 콘솔에 `[API] POST ... 실패` 로그가 찍힙니다.
