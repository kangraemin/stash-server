# stash-server

## 이게 뭔가
숏폼 영상 자막을 받아서 한 줄 요약 + 카테고리를 반환하는 Next.js 프록시 서버

## 왜 만들었나
stash 앱(숏폼 저장 앱)에서 Claude API 키를 클라이언트에 직접 노출하지 않으려고 만든 서버.
클라이언트는 이 서버를 통해서만 AI 요약 기능을 씀.

## 구조
```
app/
  api/summarize/route.ts  — POST /api/summarize 엔드포인트 (핵심 로직)
  layout.tsx              — Next.js 기본 레이아웃
lib/
  ratelimit.ts            — Supabase 기반 일일 사용량 체크 + 증가
  revenuecat.ts           — RevenueCat API로 구독 상태 확인
  supabase.ts             — Supabase 클라이언트 팩토리
```

## 기술 스택
- **Next.js 16 (App Router)** — API Route로 서버리스 엔드포인트 구성, Vercel 배포 타겟
- **Claude Haiku** (`claude-haiku-4-5-20251001`) — 빠르고 저렴한 요약 모델
- **Supabase** — 무료 유저 일일 사용량 카운트 저장 (`usage` 테이블)
- **RevenueCat** — 구독 상태 확인 (프리미엄이면 제한 없음)

## 주요 결정들
- **Vercel KV 대신 Supabase 사용**: Vercel KV가 유료 플랜 전용이라 Supabase로 교체
- **deviceId 기반 식별**: 로그인 없이 기기 단위로 제한 — 클라이언트가 `x-device-id` 헤더로 전달
- **프리미엄 유저는 rate limit 제외**: RevenueCat entitlement가 유효하면 Supabase 체크 스킵
- **Supabase 에러 시 허용으로 fallback**: 인프라 장애가 사용자 경험을 막지 않도록
- **RevenueCat 타임아웃 3초**: 구독 확인이 느려도 요청이 너무 오래 걸리지 않게

## 해결한 문제들
- **Claude API 키 노출**: 프록시 서버로 키를 서버 환경변수에만 보관
- **무료 유저 무제한 사용 방지**: Supabase `usage` 테이블에 `(device_id, used_date)` upsert로 일일 3회 제한
- **JSON 파싱 실패 처리**: Claude 응답이 JSON 형식이 아닐 때 원문 앞 50자 + "기타" 카테고리로 fallback

## 지금 상태
- `/api/summarize` 엔드포인트 완성, 무료 3회/일 제한 + 프리미엄 무제한 동작
- 카테고리: 맛집, 운동, 꿀팁, 제품, 여행, 음악, 기타
- 텍스트 최대 3000자 트림, 요약 최대 50자
- `remaining` 필드로 남은 횟수 클라이언트에 전달 (프리미엄은 -1)
- Vercel에 배포 중
