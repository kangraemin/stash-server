# 누적 rate limit 전환 계획

## Context
기존: 무료 유저 3회/일 제한
변경: 누적 100회까지 무료, 그 이후 유료 전환 필요

Gemma 4가 무료이므로 서버 비용 없이 관대한 무료 정책 가능.
사용자 경험 개선 + 구독 전환 유도 구조 확립.

## Supabase 테이블 변경

기존 `usage` 테이블: `(device_id, used_date, count)` — 날짜별 카운트
새 테이블 구조: `(device_id, total_count)` — 누적 카운트

```sql
create table usage_cumulative (
  device_id text primary key,
  total_count integer not null default 0
);
```

## 변경 파일

### `lib/ratelimit.ts`

`today()` 함수 제거. 테이블명 `usage` → `usage_cumulative`. 일별 3회 → 누적 100회.

## 검증 방법
```bash
curl -X POST http://localhost:3001/api/summarize \
  -H "Content-Type: application/json" \
  -H "x-device-id: test-new-device" \
  -d '{"text": "테스트 텍스트", "lang": "ko"}'
# 기대: {"summary":"...","category":"...","remaining":99}
```
