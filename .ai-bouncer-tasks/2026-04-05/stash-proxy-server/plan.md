# Stash Proxy Server — 설계서 vs 기존 코드 전면 비교 + 최소 보정

## Context

기존에 이미 구현된 코드의 아키텍처를 유지하면서, 설계서와 안 맞는 부분만 최소한으로 보정한다.

## 전면 비교 결과

### ✅ 이미 일치하는 부분 (변경 불필요)

| 항목 | 설계서 | 현재 코드 | 판정 |
|------|--------|----------|------|
| 엔드포인트 | POST /api/summarize | `app/api/summarize/route.ts` | ✅ |
| x-device-id 헤더 필수 | 없으면 400 | line 23-28 | ✅ |
| text 필수 검증 | 빈 문자열 거부 | line 40-44 | ✅ |
| 3,000자 truncate | 앞부분만 사용 | line 66 `text.slice(0, MAX_TEXT_LENGTH)` | ✅ |
| RevenueCat 구독 확인 | GET /v1/subscribers/{id} | `lib/revenuecat.ts` line 5-8 | ✅ |
| RevenueCat 에러→무료 간주 | 보수적 처리 | catch → return false | ✅ |
| 프리미엄이면 제한 스킵 | 무제한 요약 | line 48-51 | ✅ |
| 무료 일일 3건 제한 | KV/DB 카운트 | `lib/ratelimit.ts` FREE_DAILY_LIMIT=3 | ✅ |
| daily_limit_exceeded 응답 | 429 + error + message + remaining:0 | line 54-60 | ✅ |
| 카테고리 7개 | 맛집,운동,꿀팁,제품,여행,음악,기타 | line 7 | ✅ |
| 50자 이내 요약 | summary.slice(0,50) | line 89 | ✅ |
| 모델 | claude-haiku-4-5-20251001 | line 72 | ✅ |
| Supabase 사용량 관리 | upsert + select | `lib/ratelimit.ts` | ✅ |
| 환경변수 4개 | ANTHROPIC, REVENUECAT, SUPABASE_URL, SUPABASE_KEY | `.env.example` | ✅ |
| 디렉토리 구조 | app/api/summarize, lib/ | 일치 | ✅ |

### ⚠️ 불일치 — 보정 필요 (기존 아키텍처 유지)

| # | 항목 | 설계서 | 현재 코드 | 보정 방법 |
|---|------|--------|----------|----------|
| 1 | 프리미엄 remaining | `-1` (무제한 표시) | `undefined` (필드 자체 없음) | route.ts: 프리미엄이면 `remaining: -1` 반환 |
| 2 | max_tokens | `200` | `256` | route.ts: 256→200 |
| 3 | temperature | `0` | 미지정 (기본값) | route.ts: `temperature: 0` 추가 |
| 4 | JSON 파싱 실패 fallback | category "기타", summary 자막 첫 50자 | 500 에러 반환 | route.ts: try-catch에서 fallback 처리 |
| 5 | RevenueCat 타임아웃 | 3초 | 없음 | revenuecat.ts: `signal: AbortSignal.timeout(3000)` |
| 6 | Supabase 에러 시 | 제한 없이 진행 | 예외 전파→500 | ratelimit.ts: try-catch로 감싸서 `allowed: true` 반환 |

### ❌ 설계서에만 있으나 추가하지 않는 것 (기존 아키텍처 유지)

| 항목 | 이유 |
|------|------|
| `lib/summarize.ts` 별도 파일 | 프롬프트 로직이 20줄 미만, route.ts에 있는 게 자연스러움 |
| UUID v4 형식 검증 | 설계서에 있지만, 디바이스 ID는 앱이 생성하므로 형식 강제 불필요. 있기만 하면 됨 |
| 에러 응답 형식 `invalid_request`/`internal_error` | 기존 에러 메시지가 충분히 명확. 앱 클라이언트가 아직 없으므로 나중에 맞춰도 됨 |
| DAILY_FREE_LIMIT 환경변수 | 하드코딩 3이 적절. 바꿀 일 없음 |

## 변경 파일 (3개, 최소 수정)

### 1. `app/api/summarize/route.ts`
- line 72: `max_tokens: 256` → `200`
- line 72 부근: `temperature: 0` 추가
- line 49: 프리미엄이면 `remaining = -1` 설정
- line 87-94: JSON.parse 실패 시 fallback (500 대신)

### 2. `lib/revenuecat.ts`
- fetch에 `signal: AbortSignal.timeout(3000)` 추가

### 3. `lib/ratelimit.ts`
- 전체를 try-catch로 감싸서 Supabase 에러 시 `{ allowed: true, remaining: -1 }` 반환

## 검증
1. `npm run build` 성공
2. 설계서 체크리스트 대비 재확인
