# TC — 설계서 정합성 보정

| TC | 검증 항목 | 기대 결과 | 상태 |
|----|----------|----------|------|
| TC-01 | route.ts: max_tokens 값 | 200 | ✅ |
| TC-02 | route.ts: temperature 값 | 0 | ✅ |
| TC-03 | route.ts: 프리미엄 유저 remaining | -1 반환 | ✅ |
| TC-04 | route.ts: JSON 파싱 실패 fallback | category "기타", summary 자막 첫 50자 | ✅ |
| TC-05 | revenuecat.ts: fetch 타임아웃 | AbortSignal.timeout(3000) 존재 | ✅ |
| TC-06 | ratelimit.ts: Supabase 에러 시 | allowed: true 반환 (500 아님) | ✅ |
| TC-07 | npm run build | 빌드 성공 | ✅ |

## ���행출력

TC-01: grep "max_tokens: 200" route.ts
→ 73:      max_tokens: 200,

TC-02: grep "temperature: 0" route.ts
→ 74:      temperature: 0,

TC-03: grep "remaining.*-1" route.ts
→ 49:  let remaining: number = premium ? -1 : 0;

TC-04: grep "trimmedText.slice.*50" route.ts
→ 95:        : trimmedText.slice(0, 50);
→ 101:      summary = trimmedText.slice(0, 50);

TC-05: grep "AbortSignal.timeout" revenuecat.ts
→ 12:        signal: AbortSignal.timeout(3000),

TC-06: grep "allowed: true, remaining: -1" ratelimit.ts
→ 37:    return { allowed: true, remaining: -1 };

TC-07: npm run build
→ ✓ Compiled successfully in 4.3s
